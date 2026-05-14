<%@ WebHandler Language="VB" Class="FlowDocsHandler" %>

Imports System
Imports System.Collections.Generic
Imports System.IO
Imports System.Net
Imports System.Text
Imports System.Security.Cryptography
Imports System.Web
Imports System.Web.Configuration
Imports System.Web.Script.Serialization

''' <summary>
''' FlowDocs server adapter for ASP.NET WebForms with GitHub OAuth + Push/Pull.
'''
''' Web.config &lt;appSettings&gt; keys required for Push/Pull:
'''   FlowDocs.DocsFolder         (e.g. "~/Docs")
'''   FlowDocs.GitHubOwner        (GitHub user or org)
'''   FlowDocs.GitHubRepo         (repository name)
'''   FlowDocs.GitHubBranch       (default "main")
'''   FlowDocs.GitHubClientId     (OAuth App client id)
'''   FlowDocs.GitHubClientSecret (OAuth App client secret)
'''   FlowDocs.SessionSecret      (random 32+ chars, for cookie signing)
'''
''' Endpoints:
'''   GET   ?(no action)                  → docs JSON (skills + files)
'''   POST  ?action=save                  → write file + append to JSONL buffer
'''   GET   ?action=oauth-start           → redirect to GitHub OAuth
'''   GET   ?action=oauth-callback        → handle GitHub callback
'''   GET   ?action=oauth-status          → {authenticated, user, canWrite, pending}
'''   POST  ?action=oauth-logout          → clear session cookie
'''   POST  ?action=push                  → commit + push pending edits to GitHub
'''   POST  ?action=pull                  → fetch GitHub HEAD and update local files
''' </summary>
Public Class FlowDocsHandler
    Implements IHttpHandler

    Private Const LOG_FILENAME As String = ".flow-docs-changes.jsonl"
    Private Const STATE_FILENAME As String = ".flow-docs-state.json"
    Private Const SESSION_COOKIE As String = "fd_session"
    Private Const OAUTH_STATE_COOKIE As String = "fd_oauth_state"
    Private Const SESSION_TTL_SECONDS As Integer = 900

    Private Shared ReadOnly TEXT_EXTS() As String = {
        ".md", ".txt", ".vb", ".js", ".ts", ".html", ".css", ".sql",
        ".cs", ".json", ".xml", ".yaml", ".yml", ".config", ".aspx", ".ascx"
    }

    Private Shared ReadOnly SEARCH_FLAGS() As Object = {
        New With {.flag = "--ejemplo", .label = "Ejemplos", .dirs = CType(Nothing, String()), .exts = New String() {".vb", ".js", ".html", ".cs"}},
        New With {.flag = "--ref", .label = "Referencias", .dirs = New String() {"references"}, .exts = CType(Nothing, String())},
        New With {.flag = "--lib", .label = "Librerías", .dirs = New String() {"libraries"}, .exts = CType(Nothing, String())},
        New With {.flag = "--style", .label = "Estilos", .dirs = New String() {"style"}, .exts = New String() {".css"}},
        New With {.flag = "--script", .label = "Scripts", .dirs = New String() {"scripts"}, .exts = New String() {".js"}},
        New With {.flag = "--sql", .label = "SQL", .dirs = CType(Nothing, String()), .exts = New String() {".sql"}},
        New With {.flag = "--doc", .label = "Docs", .dirs = CType(Nothing, String()), .exts = New String() {".md"}},
        New With {.flag = "--vb", .label = "VB.NET", .dirs = CType(Nothing, String()), .exts = New String() {".vb"}}
    }

    Public ReadOnly Property IsReusable As Boolean Implements IHttpHandler.IsReusable
        Get
            Return True
        End Get
    End Property

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' Entry point
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Public Sub ProcessRequest(context As HttpContext) Implements IHttpHandler.ProcessRequest
        context.Response.AddHeader("Access-Control-Allow-Origin", "*")
        context.Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        context.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type")
        context.Response.AddHeader("X-Content-Type-Options", "nosniff")

        If context.Request.HttpMethod = "OPTIONS" Then
            context.Response.StatusCode = 200
            Return
        End If

        Try
            Dim action As String = If(context.Request.QueryString("action"), "")
            Dim method As String = context.Request.HttpMethod
            Dim docsPath As String = ResolveDocsPath(context)

            Select Case action
                Case ""
                    context.Response.ContentType = "application/json"
                    HandleGetData(context, docsPath)
                Case "save"
                    context.Response.ContentType = "application/json"
                    If method <> "POST" Then RespondError(context, 405, "Use POST") : Return
                    HandleSave(context, docsPath)
                Case "oauth-start"
                    HandleOAuthStart(context)
                Case "oauth-callback"
                    HandleOAuthCallback(context)
                Case "oauth-status"
                    context.Response.ContentType = "application/json"
                    HandleOAuthStatus(context, docsPath)
                Case "oauth-logout"
                    context.Response.ContentType = "application/json"
                    If method <> "POST" Then RespondError(context, 405, "Use POST") : Return
                    HandleOAuthLogout(context)
                Case "push"
                    context.Response.ContentType = "application/json"
                    If method <> "POST" Then RespondError(context, 405, "Use POST") : Return
                    HandlePush(context, docsPath)
                Case "pull"
                    context.Response.ContentType = "application/json"
                    If method <> "POST" Then RespondError(context, 405, "Use POST") : Return
                    HandlePull(context, docsPath)
                Case Else
                    RespondError(context, 400, "Unknown action: " & action)
            End Select
        Catch ex As Exception
            RespondError(context, 500, ex.Message)
        End Try
    End Sub

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' Config
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Function GetConfig(key As String, fallback As String) As String
        Dim v As String = WebConfigurationManager.AppSettings("FlowDocs." & key)
        If String.IsNullOrEmpty(v) Then Return fallback
        Return v
    End Function

    Private Function ResolveDocsPath(context As HttpContext) As String
        Dim folder As String = GetConfig("DocsFolder", "~/Docs")
        Return context.Server.MapPath(folder)
    End Function

    Private Function GetOwner() As String : Return GetConfig("GitHubOwner", "") : End Function
    Private Function GetRepo() As String : Return GetConfig("GitHubRepo", "") : End Function
    Private Function GetBranch() As String : Return GetConfig("GitHubBranch", "main") : End Function
    Private Function GetClientId() As String : Return GetConfig("GitHubClientId", "") : End Function
    Private Function GetClientSecret() As String : Return GetConfig("GitHubClientSecret", "") : End Function
    Private Function GetSessionSecret() As String : Return GetConfig("SessionSecret", "") : End Function

    Private Function OAuthConfigured() As Boolean
        Return Not String.IsNullOrEmpty(GetClientId()) _
           AndAlso Not String.IsNullOrEmpty(GetClientSecret()) _
           AndAlso Not String.IsNullOrEmpty(GetOwner()) _
           AndAlso Not String.IsNullOrEmpty(GetRepo()) _
           AndAlso Not String.IsNullOrEmpty(GetSessionSecret())
    End Function

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' Existing: GET data + save
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Sub HandleGetData(context As HttpContext, docsPath As String)
        Dim serializer As New JavaScriptSerializer()
        serializer.MaxJsonLength = Integer.MaxValue

        Dim skills As New List(Of Object)
        If Directory.Exists(docsPath) Then
            For Each skillDir As String In Directory.GetDirectories(docsPath)
                Dim skillName As String = Path.GetFileName(skillDir)
                If skillName.StartsWith(".") Then Continue For
                Dim skillMd As String = Path.Combine(skillDir, "SKILL.md")
                Dim homeMdSkill As String = Path.Combine(skillDir, "home.md")
                If Not File.Exists(skillMd) AndAlso Not File.Exists(homeMdSkill) Then Continue For

                Dim files As New Dictionary(Of String, String)
                ReadFilesRecursive(skillDir, skillDir, files)

                Dim homeKeyFound As String = Nothing
                For Each fKey As String In files.Keys
                    If fKey.ToLower() = "home.md" AndAlso fKey <> "home.md" Then homeKeyFound = fKey : Exit For
                Next
                If homeKeyFound IsNot Nothing Then files("home.md") = files(homeKeyFound) : files.Remove(homeKeyFound)

                Dim description As String = ""
                If files.ContainsKey("home.md") Then description = ExtractDescription(files("home.md"))
                If String.IsNullOrEmpty(description) AndAlso files.ContainsKey("SKILL.md") Then description = ExtractDescription(files("SKILL.md"))

                skills.Add(New With {.name = skillName, .description = description, .files = files})
            Next
        End If
        skills.Sort(Function(a, b) CStr(CallByName(a, "name", CallType.Get)).CompareTo(CStr(CallByName(b, "name", CallType.Get))))

        Dim flags As New List(Of Object)
        For Each f In SEARCH_FLAGS
            flags.Add(New With {.flag = f.flag, .label = f.label, .dirs = f.dirs, .exts = f.exts})
        Next

        Dim result As New Dictionary(Of String, Object)
        result("version") = 1
        result("generatedAt") = DateTime.UtcNow.ToString("o")
        result("skills") = skills
        result("flags") = flags
        result("github") = New With {.enabled = OAuthConfigured(), .owner = GetOwner(), .repo = GetRepo(), .branch = GetBranch()}

        Dim homeMd As String = Path.Combine(docsPath, "HOME.md")
        If File.Exists(homeMd) Then result("homePage") = File.ReadAllText(homeMd, Encoding.UTF8)

        context.Response.Write(serializer.Serialize(result))
    End Sub

    Private Sub HandleSave(context As HttpContext, docsPath As String)
        Dim body As String = ReadBody(context)
        Dim serializer As New JavaScriptSerializer()
        Dim data As Dictionary(Of String, Object) = serializer.Deserialize(Of Dictionary(Of String, Object))(body)

        Dim skillName As String = CStr(data("skill"))
        Dim filePath As String = CStr(data("file"))
        Dim content As String = CStr(data("content"))
        Dim userName As String = "anonymous"
        If data.ContainsKey("user") AndAlso data("user") IsNot Nothing Then
            Dim u As String = CStr(data("user")).Trim()
            If u.Length > 0 Then userName = u
        End If

        If skillName.Contains("..") OrElse filePath.Contains("..") Then RespondError(context, 400, "Invalid path") : Return
        Dim fullPath As String = Path.Combine(docsPath, skillName, filePath.Replace("/"c, "\"c))
        Dim resolved As String = Path.GetFullPath(fullPath)
        If Not resolved.StartsWith(Path.GetFullPath(docsPath)) Then RespondError(context, 400, "Path traversal detected") : Return

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath))
        Dim wasCreated As Boolean = Not File.Exists(fullPath)
        File.WriteAllText(fullPath, content, New UTF8Encoding(False))
        AppendChangeLog(docsPath, userName, skillName, filePath, content, wasCreated)

        context.Response.Write("{""success"":true}")
    End Sub

    Private Sub AppendChangeLog(docsPath As String, userName As String, skillName As String, filePath As String, content As String, wasCreated As Boolean)
        Dim logPath As String = Path.Combine(docsPath, LOG_FILENAME)
        Dim entry As New Dictionary(Of String, Object)
        entry("ts") = DateTime.UtcNow.ToString("o")
        entry("user") = userName
        entry("skill") = skillName
        entry("file") = filePath
        entry("bytes") = Encoding.UTF8.GetByteCount(content)
        entry("created") = wasCreated
        entry("content") = content

        Dim serializer As New JavaScriptSerializer()
        serializer.MaxJsonLength = Integer.MaxValue
        Dim line As String = serializer.Serialize(entry) & vbLf
        File.AppendAllText(logPath, line, New UTF8Encoding(False))
    End Sub

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' OAuth
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Sub HandleOAuthStart(context As HttpContext)
        If Not OAuthConfigured() Then RespondError(context, 500, "GitHub OAuth not configured. See Web.config.") : Return
        Dim state As String = GenerateRandomToken(24)
        WriteCookie(context, OAUTH_STATE_COOKIE, state, 600)
        Dim redirectUri As String = BuildSelfUrl(context, "oauth-callback")
        Dim url As String = "https://github.com/login/oauth/authorize" &
            "?client_id=" & Uri.EscapeDataString(GetClientId()) &
            "&redirect_uri=" & Uri.EscapeDataString(redirectUri) &
            "&scope=" & Uri.EscapeDataString("repo") &
            "&state=" & Uri.EscapeDataString(state)
        context.Response.Redirect(url, False)
    End Sub

    Private Sub HandleOAuthCallback(context As HttpContext)
        Dim code As String = context.Request.QueryString("code")
        Dim state As String = context.Request.QueryString("state")
        Dim cookieState As String = ReadCookie(context, OAUTH_STATE_COOKIE)
        ClearCookie(context, OAUTH_STATE_COOKIE)
        If String.IsNullOrEmpty(code) OrElse String.IsNullOrEmpty(state) OrElse state <> cookieState Then
            WriteOAuthClosePage(context, "OAuth state mismatch — try again.")
            Return
        End If

        Dim tokenJson As String = HttpPostForm("https://github.com/login/oauth/access_token",
            "client_id=" & Uri.EscapeDataString(GetClientId()) &
            "&client_secret=" & Uri.EscapeDataString(GetClientSecret()) &
            "&code=" & Uri.EscapeDataString(code) &
            "&redirect_uri=" & Uri.EscapeDataString(BuildSelfUrl(context, "oauth-callback")),
            "application/json")
        Dim tokenResp As Dictionary(Of String, Object) = New JavaScriptSerializer().Deserialize(Of Dictionary(Of String, Object))(tokenJson)
        If Not tokenResp.ContainsKey("access_token") Then
            WriteOAuthClosePage(context, "GitHub did not return a token.")
            Return
        End If
        Dim accessToken As String = CStr(tokenResp("access_token"))

        Dim userInfo As Dictionary(Of String, Object) = GitHubGetJson(accessToken, "https://api.github.com/user")
        Dim login As String = CStr(userInfo("login"))

        Dim payload As New Dictionary(Of String, Object)
        payload("user") = login
        payload("token") = accessToken
        payload("expiresAt") = DateTimeOffset.UtcNow.AddSeconds(SESSION_TTL_SECONDS).ToUnixTimeSeconds()
        Dim signed As String = SignPayload(payload)
        WriteCookie(context, SESSION_COOKIE, signed, SESSION_TTL_SECONDS)

        WriteOAuthClosePage(context, "")
    End Sub

    Private Sub HandleOAuthStatus(context As HttpContext, docsPath As String)
        Dim session As Dictionary(Of String, Object) = GetSession(context)
        Dim pending As Integer = CountPendingChanges(docsPath)
        If session Is Nothing Then
            WriteJson(context, New With {.authenticated = False, .pending = pending, .githubEnabled = OAuthConfigured()})
            Return
        End If

        Dim user As String = CStr(session("user"))
        Dim canWrite As Boolean = False
        Try
            Dim repoInfo As Dictionary(Of String, Object) = GitHubGetJson(CStr(session("token")),
                "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo())
            If repoInfo.ContainsKey("permissions") Then
                Dim perms As Dictionary(Of String, Object) = CType(repoInfo("permissions"), Dictionary(Of String, Object))
                If perms.ContainsKey("push") Then canWrite = CBool(perms("push"))
            End If
        Catch
            canWrite = False
        End Try

        WriteJson(context, New With {.authenticated = True, .user = user, .canWrite = canWrite, .pending = pending, .githubEnabled = True})
    End Sub

    Private Sub HandleOAuthLogout(context As HttpContext)
        ClearCookie(context, SESSION_COOKIE)
        context.Response.Write("{""success"":true}")
    End Sub

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' Push
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Sub HandlePush(context As HttpContext, docsPath As String)
        Dim session As Dictionary(Of String, Object) = GetSession(context)
        If session Is Nothing Then RespondError(context, 401, "Not authenticated") : Return
        Dim token As String = CStr(session("token"))
        Dim author As String = CStr(session("user"))

        ' Check push permission
        Dim repoInfo As Dictionary(Of String, Object) = GitHubGetJson(token, "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo())
        Dim perms As Dictionary(Of String, Object) = CType(repoInfo("permissions"), Dictionary(Of String, Object))
        If Not CBool(perms("push")) Then RespondError(context, 403, "User lacks push permission on repo") : Return

        ' Read pending changes
        Dim logPath As String = Path.Combine(docsPath, LOG_FILENAME)
        If Not File.Exists(logPath) Then WriteJson(context, New With {.success = True, .upToDate = True}) : Return

        Dim entries As List(Of Dictionary(Of String, Object)) = ReadJsonLines(logPath)
        If entries.Count = 0 Then WriteJson(context, New With {.success = True, .upToDate = True}) : Return

        ' Dedupe per file (last write wins). path = skill/file
        Dim latest As New Dictionary(Of String, Dictionary(Of String, Object))
        Dim usersInPush As New HashSet(Of String)
        For Each e As Dictionary(Of String, Object) In entries
            Dim key As String = CStr(e("skill")) & "/" & CStr(e("file"))
            latest(key) = e
            usersInPush.Add(CStr(e("user")))
        Next

        ' Optional body fields
        Dim body As String = ReadBody(context)
        Dim message As String = ""
        If Not String.IsNullOrEmpty(body) Then
            Try
                Dim req As Dictionary(Of String, Object) = New JavaScriptSerializer().Deserialize(Of Dictionary(Of String, Object))(body)
                If req IsNot Nothing AndAlso req.ContainsKey("message") Then message = CStr(req("message"))
            Catch
            End Try
        End If
        If String.IsNullOrEmpty(message) Then
            message = "Web edits by " & String.Join(", ", New List(Of String)(usersInPush).ToArray()) &
                      " (" & latest.Count & " file" & If(latest.Count = 1, "", "s") & ")"
        End If

        ' Get current ref
        Dim refInfo As Dictionary(Of String, Object) = GitHubGetJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/ref/heads/" & GetBranch())
        Dim parentSha As String = CStr(CType(refInfo("object"), Dictionary(Of String, Object))("sha"))
        Dim parentCommit As Dictionary(Of String, Object) = GitHubGetJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/commits/" & parentSha)
        Dim baseTreeSha As String = CStr(CType(parentCommit("tree"), Dictionary(Of String, Object))("sha"))

        ' Create blobs, then a tree
        Dim treeItems As New List(Of Object)
        For Each kv In latest
            Dim blobJson As Object = GitHubPostJson(token,
                "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/blobs",
                New With {.content = CStr(kv.Value("content")), .encoding = "utf-8"})
            Dim blobSha As String = CStr(CType(blobJson, Dictionary(Of String, Object))("sha"))
            treeItems.Add(New With {.path = kv.Key, .mode = "100644", .type = "blob", .sha = blobSha})
        Next

        Dim treeResp As Dictionary(Of String, Object) = GitHubPostJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/trees",
            New With {.base_tree = baseTreeSha, .tree = treeItems})
        Dim newTreeSha As String = CStr(treeResp("sha"))

        Dim commitResp As Dictionary(Of String, Object) = GitHubPostJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/commits",
            New With {.message = message, .tree = newTreeSha, .parents = New String() {parentSha}})
        Dim newCommitSha As String = CStr(commitResp("sha"))

        ' Update ref
        Dim patchResp As Dictionary(Of String, Object) = GitHubPatchJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/refs/heads/" & GetBranch(),
            New With {.sha = newCommitSha, .force = False})

        ' Archive JSONL
        Dim stamp As String = DateTime.UtcNow.ToString("yyyy-MM-ddTHH-mm-ss-fffZ")
        Dim archived As String = Path.Combine(docsPath, ".flow-docs-changes." & stamp & ".jsonl")
        File.Move(logPath, archived)

        ' Update state
        WriteState(docsPath, newCommitSha, newCommitSha)

        WriteJson(context, New With {
            .success = True,
            .commitSha = newCommitSha,
            .commitUrl = "https://github.com/" & GetOwner() & "/" & GetRepo() & "/commit/" & newCommitSha,
            .files = New List(Of String)(latest.Keys).ToArray(),
            .pushedBy = author,
            .message = message
        })
    End Sub

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' Pull
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Sub HandlePull(context As HttpContext, docsPath As String)
        Dim session As Dictionary(Of String, Object) = GetSession(context)
        If session Is Nothing Then RespondError(context, 401, "Not authenticated") : Return
        Dim token As String = CStr(session("token"))

        ' Optional body: {force: true} to overwrite local even if pending edits
        Dim force As Boolean = False
        Dim body As String = ReadBody(context)
        If Not String.IsNullOrEmpty(body) Then
            Try
                Dim req As Dictionary(Of String, Object) = New JavaScriptSerializer().Deserialize(Of Dictionary(Of String, Object))(body)
                If req IsNot Nothing AndAlso req.ContainsKey("force") Then force = CBool(req("force"))
            Catch
            End Try
        End If

        Dim refInfo As Dictionary(Of String, Object) = GitHubGetJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/ref/heads/" & GetBranch())
        Dim remoteSha As String = CStr(CType(refInfo("object"), Dictionary(Of String, Object))("sha"))

        Dim state As Dictionary(Of String, Object) = ReadState(docsPath)
        Dim lastPulled As String = ""
        If state.ContainsKey("lastPulledSha") Then lastPulled = CStr(state("lastPulledSha"))
        If lastPulled = remoteSha AndAlso Not force Then
            WriteJson(context, New With {.success = True, .upToDate = True, .sha = remoteSha})
            Return
        End If

        ' Fetch full tree
        Dim commitInfo As Dictionary(Of String, Object) = GitHubGetJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/commits/" & remoteSha)
        Dim treeSha As String = CStr(CType(commitInfo("tree"), Dictionary(Of String, Object))("sha"))
        Dim treeResp As Dictionary(Of String, Object) = GitHubGetJson(token,
            "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/trees/" & treeSha & "?recursive=1")
        Dim treeArr As Object() = CType(treeResp("tree"), Object())

        ' Build set of files with pending local edits
        Dim pendingFiles As New HashSet(Of String)
        Dim logPath As String = Path.Combine(docsPath, LOG_FILENAME)
        If File.Exists(logPath) Then
            For Each e In ReadJsonLines(logPath)
                pendingFiles.Add(CStr(e("skill")) & "/" & CStr(e("file")))
            Next
        End If

        Dim updated As New List(Of String)
        Dim conflicts As New List(Of String)
        Dim remotePaths As New HashSet(Of String)

        For Each item As Object In treeArr
            Dim entry As Dictionary(Of String, Object) = CType(item, Dictionary(Of String, Object))
            If CStr(entry("type")) <> "blob" Then Continue For
            Dim relPath As String = CStr(entry("path"))
            remotePaths.Add(relPath)

            ' Only sync text files we care about
            Dim ext As String = Path.GetExtension(relPath).ToLower()
            If Not (Array.IndexOf(TEXT_EXTS, ext) >= 0) Then Continue For

            Dim localFull As String = Path.Combine(docsPath, relPath.Replace("/"c, "\"c))
            Dim blobSha As String = CStr(entry("sha"))

            ' If local has pending edits and not forced, skip and flag conflict
            If pendingFiles.Contains(relPath) AndAlso Not force Then
                conflicts.Add(relPath)
                Continue For
            End If

            ' Compare hashes: get local content, sha1 with "blob <len>\0content" prefix? Simpler: just fetch and compare
            Dim shouldFetch As Boolean = True
            If File.Exists(localFull) Then
                Dim localContent As String = File.ReadAllText(localFull, Encoding.UTF8)
                Dim localBlobSha As String = ComputeGitBlobSha(localContent)
                If localBlobSha = blobSha Then shouldFetch = False
            End If

            If shouldFetch Then
                Dim blobInfo As Dictionary(Of String, Object) = GitHubGetJson(token,
                    "https://api.github.com/repos/" & GetOwner() & "/" & GetRepo() & "/git/blobs/" & blobSha)
                Dim encoded As String = CStr(blobInfo("content"))
                Dim raw As Byte() = Convert.FromBase64String(encoded.Replace(vbLf, ""))
                Directory.CreateDirectory(Path.GetDirectoryName(localFull))
                File.WriteAllBytes(localFull, raw)
                updated.Add(relPath)
            End If
        Next

        WriteState(docsPath, remoteSha, If(state.ContainsKey("lastPushedSha"), CStr(state("lastPushedSha")), ""))

        WriteJson(context, New With {
            .success = True,
            .sha = remoteSha,
            .updated = updated.ToArray(),
            .conflicts = conflicts.ToArray(),
            .forced = force
        })
    End Sub

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' Session (HMAC-signed cookie)
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Function SignPayload(payload As Dictionary(Of String, Object)) As String
        Dim json As String = New JavaScriptSerializer().Serialize(payload)
        Dim payloadB64 As String = Base64UrlEncode(Encoding.UTF8.GetBytes(json))
        Dim sig As String = Base64UrlEncode(HmacSha256(GetSessionSecret(), payloadB64))
        Return payloadB64 & "." & sig
    End Function

    Private Function VerifyAndParse(signed As String) As Dictionary(Of String, Object)
        If String.IsNullOrEmpty(signed) Then Return Nothing
        Dim parts As String() = signed.Split("."c)
        If parts.Length <> 2 Then Return Nothing
        Dim expected As String = Base64UrlEncode(HmacSha256(GetSessionSecret(), parts(0)))
        If Not ConstantTimeEquals(expected, parts(1)) Then Return Nothing
        Try
            Dim json As String = Encoding.UTF8.GetString(Base64UrlDecode(parts(0)))
            Dim payload As Dictionary(Of String, Object) = New JavaScriptSerializer().Deserialize(Of Dictionary(Of String, Object))(json)
            If payload.ContainsKey("expiresAt") Then
                Dim exp As Long = Convert.ToInt64(payload("expiresAt"))
                If exp < DateTimeOffset.UtcNow.ToUnixTimeSeconds() Then Return Nothing
            End If
            Return payload
        Catch
            Return Nothing
        End Try
    End Function

    Private Function GetSession(context As HttpContext) As Dictionary(Of String, Object)
        Return VerifyAndParse(ReadCookie(context, SESSION_COOKIE))
    End Function

    Private Function HmacSha256(secret As String, message As String) As Byte()
        Using h As New HMACSHA256(Encoding.UTF8.GetBytes(secret))
            Return h.ComputeHash(Encoding.UTF8.GetBytes(message))
        End Using
    End Function

    Private Function ConstantTimeEquals(a As String, b As String) As Boolean
        If a.Length <> b.Length Then Return False
        Dim r As Integer = 0
        For i As Integer = 0 To a.Length - 1
            r = r Or (Asc(a(i)) Xor Asc(b(i)))
        Next
        Return r = 0
    End Function

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' Helpers
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Sub ReadFilesRecursive(baseDir As String, currentDir As String, files As Dictionary(Of String, String))
        For Each filePath As String In Directory.GetFiles(currentDir)
            Dim ext As String = Path.GetExtension(filePath).ToLower()
            If Array.IndexOf(TEXT_EXTS, ext) < 0 Then Continue For
            If Path.GetFileName(filePath).StartsWith(".") Then Continue For
            Dim relPath As String = filePath.Substring(baseDir.Length + 1).Replace("\", "/")
            Try
                files(relPath) = File.ReadAllText(filePath, Encoding.UTF8)
            Catch
            End Try
        Next
        For Each subDir As String In Directory.GetDirectories(currentDir)
            If Path.GetFileName(subDir).StartsWith(".") Then Continue For
            ReadFilesRecursive(baseDir, subDir, files)
        Next
    End Sub

    Private Function ExtractDescription(content As String) As String
        Dim lines() As String = content.Split(New String() {vbCrLf, vbLf}, StringSplitOptions.None)
        For i As Integer = 0 To Math.Min(4, lines.Length - 1)
            If lines(i).StartsWith("# ") Then Return lines(i).Substring(2).Trim()
        Next
        Return ""
    End Function

    Private Function ReadBody(context As HttpContext) As String
        Using reader As New StreamReader(context.Request.InputStream, Encoding.UTF8)
            Return reader.ReadToEnd()
        End Using
    End Function

    Private Function ReadJsonLines(path As String) As List(Of Dictionary(Of String, Object))
        Dim list As New List(Of Dictionary(Of String, Object))
        Dim serializer As New JavaScriptSerializer()
        serializer.MaxJsonLength = Integer.MaxValue
        For Each line As String In File.ReadAllLines(path, Encoding.UTF8)
            If String.IsNullOrWhiteSpace(line) Then Continue For
            Try
                list.Add(serializer.Deserialize(Of Dictionary(Of String, Object))(line))
            Catch
            End Try
        Next
        Return list
    End Function

    Private Function CountPendingChanges(docsPath As String) As Integer
        Dim logPath As String = Path.Combine(docsPath, LOG_FILENAME)
        If Not File.Exists(logPath) Then Return 0
        Dim seen As New HashSet(Of String)
        For Each e In ReadJsonLines(logPath)
            seen.Add(CStr(e("skill")) & "/" & CStr(e("file")))
        Next
        Return seen.Count
    End Function

    Private Sub WriteState(docsPath As String, pulledSha As String, pushedSha As String)
        Dim p As String = Path.Combine(docsPath, STATE_FILENAME)
        Dim state As New Dictionary(Of String, Object)
        state("lastPulledSha") = pulledSha
        state("lastPushedSha") = pushedSha
        state("updatedAt") = DateTime.UtcNow.ToString("o")
        File.WriteAllText(p, New JavaScriptSerializer().Serialize(state), New UTF8Encoding(False))
    End Sub

    Private Function ReadState(docsPath As String) As Dictionary(Of String, Object)
        Dim p As String = Path.Combine(docsPath, STATE_FILENAME)
        If Not File.Exists(p) Then Return New Dictionary(Of String, Object)
        Try
            Return New JavaScriptSerializer().Deserialize(Of Dictionary(Of String, Object))(File.ReadAllText(p, Encoding.UTF8))
        Catch
            Return New Dictionary(Of String, Object)
        End Try
    End Function

    Private Function ComputeGitBlobSha(content As String) As String
        Dim bytes As Byte() = Encoding.UTF8.GetBytes(content)
        Dim header As Byte() = Encoding.ASCII.GetBytes("blob " & bytes.Length & vbNullChar)
        Dim full(header.Length + bytes.Length - 1) As Byte
        Array.Copy(header, 0, full, 0, header.Length)
        Array.Copy(bytes, 0, full, header.Length, bytes.Length)
        Using sha As SHA1 = SHA1.Create()
            Dim hash As Byte() = sha.ComputeHash(full)
            Dim sb As New StringBuilder(hash.Length * 2)
            For Each b As Byte In hash
                sb.Append(b.ToString("x2"))
            Next
            Return sb.ToString()
        End Using
    End Function

    Private Function GenerateRandomToken(bytes As Integer) As String
        Dim buf(bytes - 1) As Byte
        Using rng As New RNGCryptoServiceProvider()
            rng.GetBytes(buf)
        End Using
        Return Base64UrlEncode(buf)
    End Function

    Private Function Base64UrlEncode(bytes As Byte()) As String
        Return Convert.ToBase64String(bytes).TrimEnd("="c).Replace("+", "-").Replace("/", "_")
    End Function

    Private Function Base64UrlDecode(s As String) As Byte()
        Dim t As String = s.Replace("-", "+").Replace("_", "/")
        Select Case t.Length Mod 4
            Case 2 : t &= "=="
            Case 3 : t &= "="
        End Select
        Return Convert.FromBase64String(t)
    End Function

    Private Sub WriteCookie(context As HttpContext, name As String, value As String, ttlSeconds As Integer)
        Dim cookie As New HttpCookie(name, value)
        cookie.HttpOnly = True
        cookie.Path = "/"
        cookie.Expires = DateTime.UtcNow.AddSeconds(ttlSeconds)
        If context.Request.IsSecureConnection Then cookie.Secure = True
        context.Response.Cookies.Add(cookie)
    End Sub

    Private Function ReadCookie(context As HttpContext, name As String) As String
        Dim c As HttpCookie = context.Request.Cookies(name)
        If c Is Nothing Then Return ""
        Return c.Value
    End Function

    Private Sub ClearCookie(context As HttpContext, name As String)
        Dim c As New HttpCookie(name, "")
        c.Path = "/"
        c.Expires = DateTime.UtcNow.AddDays(-1)
        context.Response.Cookies.Add(c)
    End Sub

    Private Function BuildSelfUrl(context As HttpContext, action As String) As String
        Dim req As HttpRequest = context.Request
        Dim scheme As String = If(req.IsSecureConnection, "https", "http")
        Dim host As String = req.Url.Authority
        Dim pathOnly As String = req.Url.AbsolutePath
        Return scheme & "://" & host & pathOnly & "?action=" & action
    End Function

    Private Sub RespondError(context As HttpContext, status As Integer, msg As String)
        context.Response.StatusCode = status
        context.Response.ContentType = "application/json"
        Dim safe As String = msg.Replace("\", "\\").Replace("""", "\""")
        context.Response.Write("{""error"":""" & safe & """}")
    End Sub

    Private Sub WriteJson(context As HttpContext, obj As Object)
        context.Response.ContentType = "application/json"
        Dim s As New JavaScriptSerializer()
        s.MaxJsonLength = Integer.MaxValue
        context.Response.Write(s.Serialize(obj))
    End Sub

    Private Sub WriteOAuthClosePage(context As HttpContext, errMsg As String)
        context.Response.ContentType = "text/html; charset=utf-8"
        Dim msg As String = If(errMsg = "", "ok", errMsg.Replace("'", "\'"))
        context.Response.Write(
            "<!doctype html><html><body><script>" &
            "try{window.opener&&window.opener.postMessage({type:'flow-docs-oauth',ok:" &
            If(errMsg = "", "true", "false") &
            ",error:'" & msg & "'},'*')}catch(e){}window.close();" &
            "document.write('Auth complete. You can close this window.');" &
            "</script></body></html>")
    End Sub

    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ' HTTP helpers (GitHub API)
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    Private Function HttpPostForm(url As String, body As String, accept As String) As String
        ServicePointManager.SecurityProtocol = ServicePointManager.SecurityProtocol Or SecurityProtocolType.Tls12
        Dim req As HttpWebRequest = CType(WebRequest.Create(url), HttpWebRequest)
        req.Method = "POST"
        req.ContentType = "application/x-www-form-urlencoded"
        req.Accept = accept
        req.UserAgent = "FlowDocs"
        Dim payload As Byte() = Encoding.UTF8.GetBytes(body)
        req.ContentLength = payload.Length
        Using s As Stream = req.GetRequestStream() : s.Write(payload, 0, payload.Length) : End Using
        Using resp As HttpWebResponse = CType(req.GetResponse(), HttpWebResponse)
            Using rs As New StreamReader(resp.GetResponseStream(), Encoding.UTF8)
                Return rs.ReadToEnd()
            End Using
        End Using
    End Function

    Private Function GitHubGetJson(token As String, url As String) As Dictionary(Of String, Object)
        Return CType(GitHubRequest(token, "GET", url, Nothing), Dictionary(Of String, Object))
    End Function

    Private Function GitHubPostJson(token As String, url As String, body As Object) As Dictionary(Of String, Object)
        Return CType(GitHubRequest(token, "POST", url, body), Dictionary(Of String, Object))
    End Function

    Private Function GitHubPatchJson(token As String, url As String, body As Object) As Dictionary(Of String, Object)
        Return CType(GitHubRequest(token, "PATCH", url, body), Dictionary(Of String, Object))
    End Function

    Private Function GitHubRequest(token As String, method As String, url As String, body As Object) As Object
        ServicePointManager.SecurityProtocol = ServicePointManager.SecurityProtocol Or SecurityProtocolType.Tls12
        Dim req As HttpWebRequest = CType(WebRequest.Create(url), HttpWebRequest)
        req.Method = method
        req.Accept = "application/vnd.github+json"
        req.UserAgent = "FlowDocs"
        req.Headers.Add("Authorization", "Bearer " & token)
        req.Headers.Add("X-GitHub-Api-Version", "2022-11-28")
        If body IsNot Nothing Then
            req.ContentType = "application/json"
            Dim json As String = New JavaScriptSerializer().Serialize(body)
            Dim payload As Byte() = Encoding.UTF8.GetBytes(json)
            req.ContentLength = payload.Length
            Using s As Stream = req.GetRequestStream() : s.Write(payload, 0, payload.Length) : End Using
        End If
        Try
            Using resp As HttpWebResponse = CType(req.GetResponse(), HttpWebResponse)
                Using rs As New StreamReader(resp.GetResponseStream(), Encoding.UTF8)
                    Dim text As String = rs.ReadToEnd()
                    If String.IsNullOrEmpty(text) Then Return New Dictionary(Of String, Object)
                    Return New JavaScriptSerializer().Deserialize(Of Object)(text)
                End Using
            End Using
        Catch ex As WebException
            Dim msg As String = ex.Message
            If ex.Response IsNot Nothing Then
                Using rs As New StreamReader(ex.Response.GetResponseStream(), Encoding.UTF8)
                    msg = msg & " | " & rs.ReadToEnd()
                End Using
            End If
            Throw New Exception("GitHub API " & method & " " & url & " failed: " & msg)
        End Try
    End Function

End Class
