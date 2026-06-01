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

## Repos privados

Para documentacion que vive en un repositorio privado, la API de GitHub requiere autenticacion. El framework incluye un builder que descarga el contenido del repo y genera un archivo JSON estatico que puedes servir sin exponer credenciales.

### Como funciona

```
.env (token) ──build──> GitHub API ──descarga──> flow-docs-data.json (sin token) ──> frontend lo carga seguro
```

El token **nunca** queda expuesto. Solo se usa durante el build para descargar los archivos. El JSON generado contiene unicamente el contenido de la documentacion.

### Paso a paso

**1. Instalar dotenv**

```bash
npm install
```

**2. Crear el archivo .env**

```bash
cp .env.example .env
```

**3. Generar un Personal Access Token en GitHub**

1. Ve a [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click en **"Generate new token (classic)"**
3. Dale un nombre como `FlowDocs Builder`
4. Marca el scope **`repo`** (esto da acceso de lectura a repos privados)
5. Click en **"Generate token"** y copia el token

**4. Pegar el token en .env**

```
GITHUB_TOKEN=ghp_tu_token_aqui
```

**5. Ejecutar el builder**

```bash
npm run build:data
```

Te pedira de forma interactiva:

- **Owner** — tu usuario o organizacion en GitHub
- **Repo** — nombre del repositorio privado
- **Branch** — rama a usar (default: `main`)

La configuracion se guarda automaticamente para la proxima vez. Solo tendras que confirmar o cambiar los valores.

**6. Usar el JSON generado**

El archivo `flow-docs-data.json` se genera en la raiz del proyecto. Sirvelo junto con tu HTML:

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

### Regenerar la documentacion

Cada vez que actualices la documentacion en el repo privado, vuelve a ejecutar:

```bash
npm run build:data
```

Usara la configuracion guardada y solo tendras que confirmar los valores.

### FAQ

**El token queda expuesto en el JSON?**
No. El token solo se usa para autenticarte con la API de GitHub durante el build. El archivo `flow-docs-data.json` solo contiene el contenido de los archivos markdown y codigo de tu documentacion.

**Puedo commitear el .env?**
No. El archivo `.env` esta en `.gitignore`. Nunca debes commitear tokens de acceso.

**Que pasa si el token expira?**
Genera uno nuevo en [GitHub settings](https://github.com/settings/tokens) y actualiza el `.env`. El builder te avisara si el token es invalido.

**Necesito regenerar cada vez que cambio algo?**
Si. El JSON es una snapshot del estado del repo en el momento del build. Para ver cambios actualizados, vuelve a ejecutar `npm run build:data`.

---

## Development

```bash
npm install
npm run build        # builds dist/flow-docs.min.js
npm run dev          # same as build
```
