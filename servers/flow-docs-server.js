/**
 * FlowDocs server adapter for Node.js / Express.
 *
 * Usage:
 *   const express = require('express')
 *   const flowDocs = require('./flow-docs-server')
 *   const app = express()
 *   app.use('/api/docs', flowDocs('./my-docs-folder'))
 *   app.listen(3000)
 *
 * Client:
 *   FlowDocs.init({
 *     container: '#docs',
 *     apiUrl: '/api/docs'
 *   })
 */

const express = require('express')
const fs = require('fs')
const path = require('path')

const TEXT_EXTS = new Set([
  '.md', '.txt', '.vb', '.js', '.ts', '.html', '.css', '.sql',
  '.cs', '.json', '.xml', '.yaml', '.yml', '.sh', '.bat', '.ps1',
  '.py', '.rb', '.go', '.java', '.kt', '.swift', '.c', '.cpp', '.h',
  '.rs', '.php', '.aspx', '.ascx', '.config', '.ini', '.toml'
])

const SEARCH_FLAGS = [
  { flag: '--ejemplo', label: 'Ejemplos',    dirs: null,           exts: ['.vb', '.js', '.html', '.cs'] },
  { flag: '--ref',     label: 'Referencias', dirs: ['references'], exts: null },
  { flag: '--lib',     label: 'Librerías',   dirs: ['libraries'],  exts: null },
  { flag: '--style',   label: 'Estilos',     dirs: ['style'],      exts: ['.css'] },
  { flag: '--script',  label: 'Scripts',     dirs: ['scripts'],    exts: ['.js'] },
  { flag: '--sql',     label: 'SQL',         dirs: null,           exts: ['.sql'] },
  { flag: '--doc',     label: 'Docs',        dirs: null,           exts: ['.md'] },
  { flag: '--vb',      label: 'VB.NET',      dirs: null,           exts: ['.vb'] },
]

function safeJoin(base, ...parts) {
  const resolved = path.resolve(base, ...parts)
  if (!resolved.startsWith(path.resolve(base))) throw new Error('Path traversal detected')
  return resolved
}

function readFilesRecursive(dir, basePath) {
  const files = {}
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch (_) { return files }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      Object.assign(files, readFilesRecursive(fullPath, relPath))
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      if (TEXT_EXTS.has(ext)) {
        try { files[relPath] = fs.readFileSync(fullPath, 'utf-8') } catch (_) {}
      }
    }
  }
  return files
}

function extractDescription(content) {
  const lines = content.split('\n').slice(0, 5)
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)/)
    if (m) return m[1].trim()
  }
  return ''
}

function buildData(docsDir) {
  const resolved = path.resolve(docsDir)
  if (!fs.existsSync(resolved)) return { version: 1, skills: [], flags: SEARCH_FLAGS }

  const entries = fs.readdirSync(resolved, { withFileTypes: true })
  const skills = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const skillDir = path.join(resolved, entry.name)
    if (!fs.existsSync(path.join(skillDir, 'SKILL.md'))) continue

    const files = readFilesRecursive(skillDir, '')
    const description = files['SKILL.md'] ? extractDescription(files['SKILL.md']) : ''
    skills.push({ name: entry.name, description, files })
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))

  const homeMd = path.join(resolved, 'HOME.md')
  const homePage = fs.existsSync(homeMd) ? fs.readFileSync(homeMd, 'utf-8') : null

  const result = { version: 1, generatedAt: new Date().toISOString(), skills, flags: SEARCH_FLAGS }
  if (homePage) result.homePage = homePage
  return result
}

module.exports = function flowDocsServer(docsDir) {
  const router = express.Router()

  // GET / → return full JSON data
  router.get('/', (req, res) => {
    res.json(buildData(docsDir))
  })

  // POST /save → save a file
  router.post('/save', express.json({ limit: '10mb' }), (req, res) => {
    try {
      const { skill, file, content } = req.body
      if (!skill || !file || typeof content !== 'string') {
        return res.status(400).json({ error: 'Missing skill, file, or content' })
      }

      const resolved = path.resolve(docsDir)
      const filePath = safeJoin(resolved, skill, file)
      fs.writeFileSync(filePath, content, 'utf-8')
      res.json({ success: true })
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  return router
}
