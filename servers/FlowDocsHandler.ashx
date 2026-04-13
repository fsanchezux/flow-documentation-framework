<%@ WebHandler Language="VB" Class="FlowDocsHandler" %>

Imports System
Imports System.IO
Imports System.Web
Imports System.Web.Script.Serialization

''' <summary>
''' FlowDocs server adapter for ASP.NET WebForms.
''' Drop this file into your project and configure DOCS_FOLDER.
'''
''' Usage in HTML:
'''   FlowDocs.init({
'''     container: '#docs',
'''     apiUrl: '/FlowDocsHandler.ashx'
'''   })
'''
''' Endpoints:
'''   GET  /FlowDocsHandler.ashx          → returns full JSON data (skill list + files)
'''   POST /FlowDocsHandler.ashx?action=save  → saves a file (body: {skill, file, content})
''' </summary>
Public Class FlowDocsHandler
    Implements IHttpHandler

    ' ━━━ CONFIGURE THIS: path to your documentation folder ━━━━━━━━━━━━━━━━
    Private Const DOCS_FOLDER As String = "~/Docs"
    ' ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

    Public Sub ProcessRequest(context As HttpContext) Implements IHttpHandler.ProcessRequest
        context.Response.ContentType = "application/json"
        context.Response.AddHeader("Access-Control-Allow-Origin", "*")
        context.Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        context.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        If context.Request.HttpMethod = "OPTIONS" Then
            context.Response.StatusCode = 200
            Return
        End If

        Dim docsPath As String = context.Server.MapPath(DOCS_FOLDER)

        Try
            Dim action As String = context.Request.QueryString("action")

            If context.Request.HttpMethod = "POST" AndAlso action = "save" Then
                HandleSave(context, docsPath)
            Else
                HandleGetData(context, docsPath)
            End If
        Catch ex As Exception
            context.Response.StatusCode = 500
            context.Response.Write("{""error"":""" & ex.Message.Replace("""", "\""") & """}")
        End Try
    End Sub

    Private Sub HandleGetData(context As HttpContext, docsPath As String)
        Dim serializer As New JavaScriptSerializer()
        serializer.MaxJsonLength = Integer.MaxValue

        Dim skills As New List(Of Object)

        If Directory.Exists(docsPath) Then
            For Each skillDir As String In Directory.GetDirectories(docsPath)
                Dim skillMd As String = Path.Combine(skillDir, "SKILL.md")
                If Not File.Exists(skillMd) Then Continue For

                Dim skillName As String = Path.GetFileName(skillDir)
                Dim files As New Dictionary(Of String, String)

                ReadFilesRecursive(skillDir, skillDir, files)

                Dim description As String = ""
                If files.ContainsKey("SKILL.md") Then
                    description = ExtractDescription(files("SKILL.md"))
                End If

                skills.Add(New With {
                    .name = skillName,
                    .description = description,
                    .files = files
                })
            Next
        End If

        skills.Sort(Function(a, b) CStr(CallByName(a, "name", CallType.Get)).CompareTo(CStr(CallByName(b, "name", CallType.Get))))

        Dim flags As New List(Of Object)
        For Each f In SEARCH_FLAGS
            flags.Add(New With {
                .flag = f.flag,
                .label = f.label,
                .dirs = f.dirs,
                .exts = f.exts
            })
        Next

        Dim result As New Dictionary(Of String, Object)
        result("version") = 1
        result("generatedAt") = DateTime.UtcNow.ToString("o")
        result("skills") = skills
        result("flags") = flags

        Dim homeMd As String = Path.Combine(docsPath, "HOME.md")
        If File.Exists(homeMd) Then
            result("homePage") = File.ReadAllText(homeMd, System.Text.Encoding.UTF8)
        End If

        context.Response.Write(serializer.Serialize(result))
    End Sub

    Private Sub HandleSave(context As HttpContext, docsPath As String)
        Dim reader As New StreamReader(context.Request.InputStream)
        Dim body As String = reader.ReadToEnd()
        Dim serializer As New JavaScriptSerializer()
        Dim data As Dictionary(Of String, Object) = serializer.Deserialize(Of Dictionary(Of String, Object))(body)

        Dim skillName As String = CStr(data("skill"))
        Dim filePath As String = CStr(data("file"))
        Dim content As String = CStr(data("content"))

        ' Security: prevent path traversal
        If skillName.Contains("..") OrElse filePath.Contains("..") Then
            context.Response.StatusCode = 400
            context.Response.Write("{""error"":""Invalid path""}")
            Return
        End If

        Dim fullPath As String = Path.Combine(docsPath, skillName, filePath.Replace("/", "\"))
        Dim resolved As String = Path.GetFullPath(fullPath)

        If Not resolved.StartsWith(Path.GetFullPath(docsPath)) Then
            context.Response.StatusCode = 400
            context.Response.Write("{""error"":""Path traversal detected""}")
            Return
        End If

        File.WriteAllText(fullPath, content, System.Text.Encoding.UTF8)
        context.Response.Write("{""success"":true}")
    End Sub

    Private Sub ReadFilesRecursive(baseDir As String, currentDir As String, files As Dictionary(Of String, String))
        For Each filePath As String In Directory.GetFiles(currentDir)
            Dim ext As String = Path.GetExtension(filePath).ToLower()
            If Not TEXT_EXTS.Contains(ext) Then Continue For
            If Path.GetFileName(filePath).StartsWith(".") Then Continue For

            Dim relPath As String = filePath.Substring(baseDir.Length + 1).Replace("\", "/")
            Try
                files(relPath) = File.ReadAllText(filePath, System.Text.Encoding.UTF8)
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
            If lines(i).StartsWith("# ") Then
                Return lines(i).Substring(2).Trim()
            End If
        Next
        Return ""
    End Function

End Class
