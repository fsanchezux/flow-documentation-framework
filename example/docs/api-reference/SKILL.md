# API Reference

Complete API documentation for FlowDocs.

## FlowDocs.init(options)

Creates a new documentation viewer instance.

### Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `container` | `string \| Element` | Yes | CSS selector or DOM element |
| `dataUrl` | `string` | No | URL to the JSON data file |
| `data` | `object` | No | Inline data object |
| `onSave` | `function` | No | Callback when editor saves |

### Return Value

Returns a `FlowDocsInstance` object with the following methods:

## Instance Methods

### reload(data?)

Reload the viewer. Optionally pass new data.

```javascript
const docs = FlowDocs.init({ container: '#docs', dataUrl: './data.json' })

// Later, reload with updated data
docs.reload(newData)
```

### loadData(data)

Load a new data object directly.

## Data Format

The JSON data file has this structure:

[Data Schema Example](examples/schema.json)

## Search Flags

Use `--flag` syntax in the search box to filter results:

| Flag | Description |
|------|-------------|
| `--ejemplo` | Code examples (.vb, .js, .html, .cs) |
| `--ref` | References (references/ folder) |
| `--doc` | Documentation (.md files) |
| `--sql` | SQL files |
| `--vb` | VB.NET files |

## Editor Mode

Toggle the editor switch to edit files in-place. Changes are passed to the `onSave` callback.

```javascript
FlowDocs.init({
  container: '#docs',
  dataUrl: './data.json',
  onSave: async (skill, filePath, content) => {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill, filePath, content })
    })
  }
})
```
