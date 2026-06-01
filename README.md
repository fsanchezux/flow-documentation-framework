# Flow Documentation Framework

Visor de documentación embebible que lee directamente desde un repositorio de GitHub. Un único archivo JS, sin build, sin servidor, sin generar JSON intermedios.

## Uso

```html
<div id="docs" style="height:100vh"></div>
<script src="https://cdn.jsdelivr.net/npm/flow-documentation-framework/dist/flow-docs.min.js"></script>
<script>
  FlowDocs.init({
    container: '#docs',
    mode: 'full',   // 'full' (default) | 'chat' | 'modal'
    github: {
      owner: 'tu-usuario',
      repo: 'tu-repo',
      branch: 'main',
      token: 'ghp_xxx'  // opcional: para repos privados o subir el rate limit
    }
  })
</script>
```

El visor escanea el repo, detecta carpetas con `SKILL.md` y las muestra como skills navegables.

## Modos de visualización

Tres formas de embeber el visor según el espacio que quieras darle:

### `mode: 'full'` (default)

El visor ocupa todo el contenedor (sidebar + contenido + TOC). Pensado para una página dedicada a la documentación.

```html
<div id="docs" style="height:100vh"></div>
<script>
  FlowDocs.init({ container: '#docs', github: {...} })
</script>
```

### `mode: 'chat'`

Solo un botón flotante con el chat de "Pregunta a los docs". Sin sidebar ni visor — pensado para empotrar el Q&A en cualquier página sin ocupar layout. Los resultados se abren en GitHub en una pestaña nueva.

```html
<div id="docs-mount"></div>
<script>
  FlowDocs.init({ container: '#docs-mount', mode: 'chat', github: {...} })
</script>
```

El contenedor puede ser de 0x0 — el botón flota anclado al viewport.

### `mode: 'modal'`

Botón flotante que abre una ventana al 90% del viewport con el visor compacto dentro (sidebar + contenido + TOC). Cierra con la X, click fuera, o `Esc`.

```html
<div id="docs-mount"></div>
<script>
  const docs = FlowDocs.init({ container: '#docs-mount', mode: 'modal', github: {...} })
  // Para abrir/cerrar programáticamente:
  // docs.open()
  // docs.close()
</script>
```

> En los tres modos, el panel de "Pregunta a los docs" (BM25) está disponible vía el botón flotante azul.

## Estructura del repo

Cada carpeta de primer nivel que contenga un `SKILL.md` se trata como un skill independiente:

```
mi-repo/
  getting-started/
    SKILL.md            ← portada del skill (o usa home.md)
    examples/
      hello.js
    references/
      guide.md
  api-reference/
    SKILL.md
    examples/
      schema.json
```

- **`SKILL.md`** — portada del skill. La primera línea (`# Título`) se usa como descripción en el sidebar.
- **`home.md`** *(opcional)* — si existe, se usa como portada en lugar de `SKILL.md`. También se puede poner en la raíz del repo como página de inicio global.
- **Cualquier otro archivo** — aparece en el árbol de archivos del skill y se puede abrir clicando.

### Embeber archivos en el markdown

Dentro de un `.md`, los enlaces relativos a archivos del propio skill se renderizan como bloques de código embebidos:

```markdown
[Ver el código](examples/hello.js)
```

Se sustituye por el contenido del archivo con syntax highlighting.

### Enlaces internos

Los enlaces con la forma `skill-name/archivo.md` o `skill-name` navegan dentro del visor sin recargar.

## Token de GitHub

Solo necesario para:
- **Repos privados** — sin token, la API devuelve 404.
- **Repos públicos con tráfico alto** — la API anónima limita a 60 peticiones/h por IP; con token sube a 5000/h.

Cómo conseguirlo:

1. Ve a https://github.com/settings/tokens
2. **Generate new token → classic**
3. Marca el scope **`repo`** (o usa fine-grained con `Contents: Read-only` sobre el repo concreto)
4. Copia el token y pásalo en `github.token`

> ⚠️ **Importante:** el token queda visible en el HTML del cliente. No lo embebas en una web pública si es de un repo privado. Para producción, sirve el HTML detrás de auth o usa un proxy backend que inyecte el token.

## Opciones

| Opción | Tipo | Descripción |
|---|---|---|
| `container` | `string \| Element` | Selector CSS o elemento DOM donde montar el visor (requerido) |
| `mode` | `'full' \| 'chat' \| 'modal'` | Tipo de visualización (default: `'full'`) |
| `github.owner` | `string` | Usuario u organización en GitHub (requerido) |
| `github.repo` | `string` | Nombre del repo (requerido) |
| `github.branch` | `string` | Rama a leer (default: `main`) |
| `github.token` | `string` | Personal Access Token (opcional) |

Métodos de la instancia devuelta:

| Método | Descripción |
|---|---|
| `open()` | En modo `modal`/`chat`, abre el visor/chat |
| `close()` | Cierra el modal/chat |

## Features

- Sidebar con lista de skills + árbol de archivos
- Tabla de contenidos (TOC) por documento, redimensionable
- Búsqueda full-text en todos los archivos (Ctrl+K)
- **"Pregunta a los docs"** — panel flotante con búsqueda BM25 sobre los fragmentos de la documentación (en lenguaje natural, sin LLM, sin coste)
- Syntax highlighting (highlight.js, tema GitHub Dark)
- Tema oscuro estilo GitHub
- Una sola petición al inicio — navegación, búsqueda y TOC funcionan en memoria
- Botón de recarga para refrescar desde GitHub

### Pregunta a los docs

El botón flotante de la esquina inferior derecha abre un panel donde puedes hacer preguntas en lenguaje natural ("¿cómo configuro la autenticación?", "qué formato tiene el archivo de salida"). El visor indexa todos los archivos por secciones H1/H2 y usa BM25 (búsqueda probabilística por palabras clave, sin ML ni APIs externas) para devolver los fragmentos más relevantes con highlight. Click en un fragmento te lleva al archivo y sección correspondientes.

## Desarrollo

```bash
npm install
npm run build        # genera dist/flow-docs.min.js y dist/flow-docs.js
```
