# Getting Started

Welcome to the Flow-Docs documentation framework.

## Installation

Include the script in your HTML page:

```html
<script src="flow-docs.min.js"></script>
```

## Quick Start

Create a container div and initialize:

```javascript
FlowDocs.init({
  container: '#docs',
  dataUrl: './flow-docs-data.json'
})
```

## Building Your Data

Use the CLI tool to scan your documentation folder:

```bash
node flow-docs-build.js ./my-docs -o flow-docs-data.json
```

### Folder Structure

Each skill is a folder containing a `SKILL.md` file:

```
my-docs/
  getting-started/
    SKILL.md
    examples/
      hello.js
  api-reference/
    SKILL.md
```

## Example Code

Here is a simple example:

[Hello World Example](examples/hello.js)

## Features

- Sidebar navigation with skill list
- Table of contents for each document
- Full-text search with flag filters
- Syntax highlighted code blocks
- Built-in editor mode
- Dark theme (GitHub-style)
