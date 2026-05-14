# Flow Documentation Framework

Embeddable documentation viewer with a built-in editor that syncs with GitHub. One JS file, no build step required.

- **Read docs in the browser** — markdown rendering, code-block embedding from local files, search with flags, table of contents.
- **Edit in the browser** — toggle the editor and save. Saves write to disk on the server.
- **Push to GitHub** — log in with your GitHub account, send pending edits as a single commit authored by you.
- **Pull from GitHub** — bring in changes made elsewhere, with conflict detection.

```html
<div id="docs" style="height:100vh"></div>
<script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
<script>
  FlowDocs.init({ container: '#docs', apiUrl: '/FlowDocsHandler.ashx' })
</script>
```

---

## Three modes of use

| Mode | When | Server required | Edit | Push to GitHub |
|---|---|---|---|---|
| **Static** | Read-only docs hosted on GitHub Pages, S3, etc. | No | ❌ | ❌ |
| **API (local)** | Self-hosted viewer + editor, GitHub sync optional | Yes (ASP.NET or Node) | ✅ | ❌ |
| **API + GitHub** | Self-hosted, multiple editors, GitHub as source of truth | Yes (ASP.NET only in v2.0) | ✅ | ✅ |

Skip to the section that matches your case:

- [Static mode](#static-mode-no-server)
- [API mode (local editing only)](#api-mode-local-editing)
- [API mode + GitHub Push/Pull](#api-mode--github-pushpull)

---

## Docs folder structure

Every skill is a folder containing `SKILL.md` (or `home.md`):

```
docs/
  HOME.md                       ← optional, shown on landing
  getting-started/
    SKILL.md                    ← required entry point
    examples/
      hello.js
    references/
      guide.md
  api-reference/
    SKILL.md
```

In `SKILL.md`, link to local files and they render inline with syntax highlighting:

```markdown
## Example

[See the code](examples/hello.js)
```

### Search flags

Use `--flag` syntax in the search box:

| Flag | Filters by |
|---|---|
| `--ejemplo` | Code examples (.vb, .js, .html, .cs) |
| `--ref` | `references/` folder |
| `--lib` | `libraries/` folder |
| `--style`, `--script`, `--sql`, `--doc`, `--vb` | By extension |

Tag sections inside files with `@ejemplo` to prioritize them in searches:

````markdown
<!-- @ejemplo -->
```js
// @ejemplo
```
````

---

## Static mode (no server)

1. Generate JSON from your docs folder:

   ```bash
   npx flow-documentation-framework flow-docs-build ./docs -o flow-docs-data.json
   ```

2. Embed in an HTML page:

   ```html
   <div id="docs" style="height:100vh"></div>
   <script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
   <script>
     FlowDocs.init({ container: '#docs', dataUrl: './flow-docs-data.json' })
   </script>
   ```

That's it. Read-only, no editor.

---

## API mode (local editing)

The viewer talks to a server that reads/writes the docs folder live. Edits are saved on the server's disk.

### ASP.NET (IIS)

1. Copy `servers/FlowDocsHandler.ashx` into your web project.
2. Add `Web.config` setting:

   ```xml
   <appSettings>
     <add key="FlowDocs.DocsFolder" value="~/Docs" />
   </appSettings>
   ```

3. Make sure the App Pool has **write permission** on the docs folder.
4. Embed:

   ```html
   <div id="docs" style="height:100vh"></div>
   <script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
   <script>
     FlowDocs.init({ container: '#docs', apiUrl: '/FlowDocsHandler.ashx' })
   </script>
   ```

### Node / Express

```bash
npm install express flow-documentation-framework
```

```js
const express = require('express')
const flowDocs = require('flow-documentation-framework/servers/flow-docs-server')

const app = express()
app.use('/api/docs', flowDocs('./docs'))
app.listen(3000)
```

Client:

```html
<script>
  FlowDocs.init({ container: '#docs', apiUrl: '/api/docs' })
</script>
```

> In v2.0, only the ASP.NET handler supports GitHub Push/Pull. The Node adapter does local-save only.

---

## API mode + GitHub Push/Pull

This is the full setup: edits are saved locally, then **Push** sends them to GitHub as commits with your authorship, and **Pull** brings in changes made elsewhere.

### Architecture in one picture

```
       Browser                Server (ASHX)              GitHub
   ┌───────────┐           ┌──────────────┐          ┌─────────┐
   │  Editor   │  save     │  disk + log  │          │  repo   │
   │  Push  ───┼──────────►│   buffer     │   push   │  main   │
   │  Pull  ◄──┼───────────┤              │◄────────►│         │
   └───────────┘           └──────────────┘          └─────────┘
        OAuth via GitHub  (token used server-side, never in browser)
```

- Web edits write to the server's disk **and** append to a buffer `.flow-docs-changes.jsonl`.
- **Push**: the buffer is bundled into one commit, authored by the logged-in user, sent via GitHub's Git Data API.
- **Pull**: server compares GitHub's HEAD with local files, overwrites files that have no pending edits, flags conflicts on files that do.

### Setup (one-time)

#### 1. Register a GitHub OAuth App

[github.com/settings/applications/new](https://github.com/settings/applications/new)

| Field | Value |
|---|---|
| Homepage URL | `https://your-server.example/` |
| Authorization callback URL | `https://your-server.example/FlowDocsHandler.ashx?action=oauth-callback` |

Save the **Client ID** and **Client Secret**.

#### 2. Add Web.config settings

```xml
<appSettings>
  <add key="FlowDocs.DocsFolder"          value="~/Docs" />
  <add key="FlowDocs.GitHubOwner"         value="your-username-or-org" />
  <add key="FlowDocs.GitHubRepo"          value="your-repo-name" />
  <add key="FlowDocs.GitHubBranch"        value="main" />
  <add key="FlowDocs.GitHubClientId"      value="Iv1.xxxxxxxxxxxx" />
  <add key="FlowDocs.GitHubClientSecret"  value="xxxxxxxxxxxx" />
  <add key="FlowDocs.SessionSecret"       value="GENERATE_32_OR_MORE_RANDOM_CHARS" />
</appSettings>
```

Generate `SessionSecret` with PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | %{[byte](Get-Random -Max 256)}))
```

#### 3. Initialize the docs folder

The server's docs folder should contain a clone (or copy) of what's in GitHub. Easiest:

```powershell
cd C:\inetpub\wwwroot\your-app
git clone https://github.com/your-username/your-repo.git Docs
```

Or set it up empty and use **Pull** from the UI to fetch the initial content.

#### 4. Use it

Open the viewer. In the sidebar you'll now see two new buttons next to the download icon:

- **⬆ Push** — sends pending edits to GitHub.
- **⬇ Pull** — brings in GitHub changes.

The first time you click either, a GitHub auth popup appears. Your session lasts 15 minutes — after that you'll be asked to re-auth.

### What goes in each commit

Push consolidates **all pending edits** (every save since last push) into one commit. Multiple users' edits in the buffer are merged into a single commit by whoever clicks Push — that's the limitation of a single "Push" actor. The buffer's JSONL still preserves authorship per edit for audit (it's archived in the docs folder on push).

### Conflict resolution

If you Pull and the same file has been edited both locally (pending) and on GitHub, the file is flagged as **conflict** — not overwritten. The dialog asks whether to discard the local edits. There's no merge tool; for now you either:
- Click "yes" → GitHub wins, your pending edit is lost (still recoverable from the buffer archive).
- Click "no" → local stays. Your next Push will overwrite GitHub.

A proper diff UI is planned for 2.1.

### Permission check

Push only succeeds if the authenticated GitHub user has push access to the repo. The server checks `repos/{owner}/{repo}/permissions.push` before doing anything.

---

## FlowDocs.init(options)

| Option | Type | Description |
|---|---|---|
| `container` | `string \| Element` | CSS selector or DOM element. **Required.** |
| `dataUrl` | `string` | URL to a pre-built JSON file (static mode). |
| `apiUrl` | `string` | URL to a server endpoint (API mode). |
| `data` | `object` | Inline data object. |
| `onSave` | `function(skill, filePath, content)` | Custom callback after save. Optional — API mode handles save automatically. |

Returns a `FlowDocsInstance` with:

- `reload(data?)` — reload the viewer.
- `loadData(data)` — swap in a new data object.
- `loadFromUrl(url)` — fetch and load.

---

## CLI

```bash
# Build static JSON
npx flow-documentation-framework flow-docs-build ./docs -o flow-docs-data.json
```

The Node binary is registered as `flow-docs-build`.

---

## How the GitHub flow works under the hood

### Save (writes to disk + log)
```
POST /FlowDocsHandler.ashx?action=save
  body: {skill, file, content, user}
  effect: writes file, appends to .flow-docs-changes.jsonl
```

### OAuth
```
GET  ?action=oauth-start     → 302 to github.com/login/oauth/authorize
GET  ?action=oauth-callback  → exchange code for token, set HMAC-signed cookie
GET  ?action=oauth-status    → {authenticated, user, canWrite, pending}
POST ?action=oauth-logout    → clear cookie
```

### Push
```
POST ?action=push
  body: {message?: string}
  effect: bundles pending edits into one commit via GitHub Git Data API
          - POST /git/blobs (one per file)
          - POST /git/trees (with base_tree)
          - POST /git/commits
          - PATCH /git/refs/heads/{branch}
          - archives .flow-docs-changes.jsonl
  returns: {success, commitSha, commitUrl, files, pushedBy, message}
```

### Pull
```
POST ?action=pull
  body: {force?: boolean}
  effect: fetches GitHub HEAD tree, compares per-file SHAs,
          overwrites local files that have no pending edits.
          Files with pending edits → conflicts (unless force=true).
  returns: {success, sha, updated, conflicts, forced}
```

### Files written to the docs folder (auto-managed)

| File | Purpose |
|---|---|
| `.flow-docs-changes.jsonl` | Pending edits buffer (since last push) |
| `.flow-docs-changes.<timestamp>.jsonl` | Archived buffers (one per push) — useful for audit |
| `.flow-docs-state.json` | Tracks `lastPulledSha` and `lastPushedSha` |

All start with `.` so they're skipped by the docs reader.

---

## Security

- **Tokens never reach the browser.** OAuth tokens are stored server-side in an HMAC-signed cookie (HttpOnly, SameSite=Lax, Secure when on HTTPS).
- **Session TTL is 15 minutes.** After that, re-auth is required.
- **Push permission is checked** via `GET /repos/{owner}/{repo}` before any write attempt.
- **CSRF state** is validated on the OAuth callback.
- **Path traversal** is blocked on save and pull (no `..` allowed).
- **HTTPS is strongly recommended in production.** The OAuth cookie is marked `Secure` automatically when served over HTTPS; on HTTP some browsers will silently drop it.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Push button doesn't appear | `apiUrl` not set, or `oauth-status` returned `githubEnabled: false`. Check `FlowDocs.GitHubClientId` etc. in Web.config |
| "OAuth state mismatch" | Cookies blocked / cross-domain. Make sure the OAuth callback is on the same origin as the viewer |
| "User lacks push permission" | The GitHub user logged in is not a collaborator/owner with write access on the repo |
| Push 422 "tree.sha could not be created" | The buffer has paths that don't match the repo's expected layout. Make sure every skill lives in its own folder |
| Pull 409 / conflicts list non-empty | Same file has pending local edit + remote update. Decide: discard local (force pull) or push first |
| Cookies don't persist | Server is HTTP and SameSite policy is strict. Use HTTPS in production |

---

## Development

```bash
git clone https://github.com/fsanchezux/flow-documentation-framework
cd flow-documentation-framework
npm install
npm run build        # builds dist/flow-docs.min.js
npm run build:data   # regenerates example/flow-docs-data.json
npm run dev          # both
```

## License

MIT
