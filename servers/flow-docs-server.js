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
 *
 * Endpoints:
 *   GET  /                       → full JSON data
 *   POST /save                   → save a file + append JSONL log entry
 *   GET  /changes                → download the JSONL log
 *   POST /changes/archive        → rotate the JSONL log (timestamped rename)
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

const LOG_FILENAME = '.flow-docs-changes.jsonl'

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
    if (!fs.existsSync(path.join(skillDir, 'SKILL.md')) && !fs.existsSync(path.join(skillDir, 'home.md'))) continue

    const files = readFilesRecursive(skillDir, '')
    const homeKey = Object.keys(files).find(k => k.toLowerCase() === 'home.md')
    if (homeKey && homeKey !== 'home.md') {
      files['home.md'] = files[homeKey]
      delete files[homeKey]
    }
    const descSource = files['home.md'] || files['SKILL.md']
    const description = descSource ? extractDescription(descSource) : ''
    skills.push({ name: entry.name, description, files })
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))

  const homeMd = path.join(resolved, 'HOME.md')
  const homePage = fs.existsSync(homeMd) ? fs.readFileSync(homeMd, 'utf-8') : null

  const result = { version: 1, generatedAt: new Date().toISOString(), skills, flags: SEARCH_FLAGS }
  if (homePage) result.homePage = homePage
  return result
}

function appendChangeLog(docsDir, entry) {
  const logPath = path.join(path.resolve(docsDir), LOG_FILENAME)
  fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf-8')
}

module.exports = function flowDocsServer(docsDir) {
  const router = express.Router()

  router.get('/', (req, res) => {
    res.json(buildData(docsDir))
  })

  router.post('/save', express.json({ limit: '10mb' }), (req, res) => {
    try {
      const { skill, file, content, user } = req.body
      if (!skill || !file || typeof content !== 'string') {
        return res.status(400).json({ error: 'Missing skill, file, or content' })
      }

      const resolved = path.resolve(docsDir)
      const filePath = safeJoin(resolved, skill, file)

      let previousContent = null
      try { previousContent = fs.readFileSync(filePath, 'utf-8') } catch (_) {}

      fs.writeFileSync(filePath, content, 'utf-8')

      appendChangeLog(docsDir, {
        ts: new Date().toISOString(),
        user: (typeof user === 'string' && user.trim()) ? user.trim() : 'anonymous',
        skill,
        file,
        bytes: Buffer.byteLength(content, 'utf-8'),
        created: previousContent === null,
        content
      })

      res.json({ success: true })
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  })

  router.get('/changes', (req, res) => {
    const logPath = path.join(path.resolve(docsDir), LOG_FILENAME)
    if (!fs.existsSync(logPath)) {
      res.setHeader('Content-Type', 'application/x-ndjson')
      return res.send('')
    }
    res.setHeader('Content-Type', 'application/x-ndjson')
    res.setHeader('Content-Disposition', `attachment; filename="${LOG_FILENAME}"`)
    fs.createReadStream(logPath).pipe(res)
  })

  router.post('/changes/archive', (req, res) => {
    const logPath = path.join(path.resolve(docsDir), LOG_FILENAME)
    if (!fs.existsSync(logPath)) return res.json({ success: true, archived: null })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const archived = path.join(path.resolve(docsDir), `.flow-docs-changes.${stamp}.jsonl`)
    fs.renameSync(logPath, archived)
    res.json({ success: true, archived: path.basename(archived) })
  })

  return router
}
