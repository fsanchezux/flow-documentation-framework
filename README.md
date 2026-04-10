# Flow Documentation Framework

Embeddable documentation viewer for SKILL.md files. Single JS file, no server required for static mode. Includes server adapters for dynamic folder reading.

## CDN

```html
<script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
```

## Usage

### Option A: Static mode (pre-built JSON)

Generate the JSON from your docs folder:

```bash
npx flow-documentation-framework ./my-docs -o flow-docs-data.json
```

Then include in your page:

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

### Option B: Dynamic mode (server reads folder live)

Point the framework at a server endpoint that scans your docs folder on each request. No build step needed.

```html
<div id="docs" style="height:100vh"></div>
<script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
<script>
  FlowDocs.init({
    container: '#docs',
    apiUrl: '/FlowDocsHandler.ashx'  // or your endpoint
  })
</script>
```

## Server Adapters

### ASP.NET WebForms (.ashx)

Copy `servers/FlowDocsHandler.ashx` into your project. Edit the `DOCS_FOLDER` constant:

```vb
Private Const DOCS_FOLDER As String = "~/Docs"
```

The handler exposes two endpoints:

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/FlowDocsHandler.ashx` | Returns all skills and files as JSON |
| POST | `/FlowDocsHandler.ashx?action=save` | Saves a file (body: `{skill, file, content}`) |

### Node.js / Express

```javascript
const express = require('express')
const flowDocs = require('flow-documentation-framework/servers/flow-docs-server')

const app = express()
app.use('/api/docs', flowDocs('./my-docs-folder'))
app.listen(3000)
```

### PHP

Copy `servers/flow-docs-server.php` into your project. Edit `$DOCS_FOLDER`:

```php
$DOCS_FOLDER = __DIR__ . '/docs';
```

## How It Works

1. **One GET request** at init loads all documentation into browser memory
2. **Navigation, search, TOC** — all client-side, zero additional requests
3. **Editor save** — one POST per save, writes file to disk via the server adapter

```
Browser                         Server
  │                               │
  │  GET /FlowDocsHandler.ashx    │
  │──────────────────────────────>│  Scans docs folder
  │<──────────────────────────────│  Returns JSON with all files
  │                               │
  │  (navigate, search, TOC)      │
  │  all in-memory, no requests   │
  │                               │
  │  POST ?action=save            │
  │──────────────────────────────>│  Writes file to disk
  │<──────────────────────────────│  {success: true}
```

## Docs Folder Structure

Each skill is a folder containing a `SKILL.md` entry point:

```
my-docs/
  getting-started/
    SKILL.md
    examples/
      hello.js
      query.sql
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
| `dataUrl` | `string` | URL to pre-built JSON file |
| `apiUrl` | `string` | URL to server endpoint (dynamic mode) |
| `data` | `object` | Inline data object |
| `onSave` | `function(skill, filePath, content)` | Callback after editor save |

Returns a `FlowDocsInstance` with:

- `reload(data?)` — reload the viewer, optionally with new data
- `loadData(data)` — load a new data object
- `loadFromUrl(url)` — load data from a URL

## Development

```bash
npm install
npm run build        # builds dist/flow-docs.min.js
npm run build:data   # generates example JSON
npm run dev          # builds both
```
