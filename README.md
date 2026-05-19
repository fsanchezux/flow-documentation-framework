# Flow Documentation Framework

Embeddable documentation viewer that loads directly from GitHub repositories. Single JS file, no build step required.

## CDN

```html
<script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
```

## Usage

### GitHub API mode (recommended)

Point the framework at any GitHub repository. It scans the repo for `SKILL.md` files and loads all documentation automatically.

```html
<div id="docs" style="height:100vh"></div>
<script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
<script>
  FlowDocs.init({
    container: '#docs',
    github: {
      owner: 'fsanchezux',
      repo: 'flow-documentation-framework',
      branch: 'main',
      token: 'optional-github-token' // optional, increases rate limit
    }
  })
</script>
```

### Static mode (pre-built JSON)

If you prefer to serve a pre-built JSON file:

```html
<div id="docs" style="height:100vh"></div>
<script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
<script>
  FlowDocs.init({
    container: '#docs',
    dataUrl: './flow-docs-data.json'
  })
</script>
```

## How It Works

1. **One GET request** at init loads all documentation from GitHub into browser memory
2. **Navigation, search, TOC** — all client-side, zero additional requests
3. **Reload button** — fetches latest from GitHub on demand

```
Browser                         GitHub API
  │                               │
  │  GET /repos/{owner}/{repo}    │
  │     /git/trees/{branch}       │
  │──────────────────────────────>│  Returns file tree
  │<──────────────────────────────│
  │                               │
  │  GET /repos/{owner}/{repo}    │
  │     /git/blobs/{sha}          │
  │──────────────────────────────>│  Returns file content
  │<──────────────────────────────│  (base64 encoded)
  │                               │
  │  (navigate, search, TOC)      │
  │  all in-memory, no requests   │
```

## Repo Structure

Each top-level folder containing a `SKILL.md` is treated as a skill:

```
my-repo/
  getting-started/
    SKILL.md
    examples/
      hello.js
    references/
      guide.md
  api-reference/
    SKILL.md
    examples/
      schema.json
```

### File References

In SKILL.md, link to local files to embed them as code blocks:

```markdown
## Example

[See the code](examples/hello.js)
```

This renders the file content inline with syntax highlighting.

### Search Flags

Use `--flag` syntax in the search box to filter results:

| Flag | Description |
|------|-------------|
| `--ejemplo` | Code examples (.vb, .js, .html, .cs) |
| `--ref` | References folder |
| `--lib` | Libraries folder |
| `--style` | CSS files |
| `--script` | JS files |
| `--sql` | SQL files |
| `--doc` | Markdown files |
| `--vb` | VB.NET files |

### Priority Zones

Tag sections in any file to prioritize them in flag searches:

```markdown
<!-- @ejemplo -->
```
```javascript
// @ejemplo
```
```vb
' @ejemplo
```
```sql
-- @ejemplo
```

## FlowDocs.init(options)

| Option | Type | Description |
|--------|------|-------------|
| `container` | `string \| Element` | CSS selector or DOM element (required) |
| `github` | `object` | GitHub repo config (owner, repo, branch, token) |
| `dataUrl` | `string` | URL to pre-built JSON file |
| `data` | `object` | Inline data object |
| `homePage` | `string` | Custom home page markdown |

Returns a `FlowDocsInstance` with:

- `reload(data?)` — reload the viewer, optionally with new data
- `loadData(data)` — load a new data object
- `loadFromUrl(url)` — load data from a URL

## Development

```bash
npm install
npm run build        # builds dist/flow-docs.min.js
npm run dev          # same as build
```
