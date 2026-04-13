#!/usr/bin/env node

/**
 * flow-docs-build — Scans a documentation folder and generates a JSON manifest
 * containing all skill data for the FlowDocs client library.
 *
 * Usage:
 *   node flow-docs-build.js <docs-folder> [-o output.json]
 *   node flow-docs-build.js ./my-skills -o flow-docs-data.json
 *   node flow-docs-build.js ./my-skills > flow-docs-data.json
 */

const fs = require('fs')
const path = require('path')

// ─── Config ─────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readFilesRecursive(dir, basePath) {
  const files = {}
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    const relPath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      Object.assign(files, readFilesRecursive(fullPath, relPath))
    } else {
      const ext = path.extname(entry.name).toLowerCase()
      if (TEXT_EXTS.has(ext)) {
        try {
          files[relPath] = fs.readFileSync(fullPath, 'utf-8')
        } catch (_) {}
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

// ─── Main ────────────────────────────────────────────────────────────────────

function buildData(skillsDir) {
  const resolved = path.resolve(skillsDir)
  if (!fs.existsSync(resolved)) {
    console.error(`Error: folder "${skillsDir}" does not exist`)
    process.exit(1)
  }

  const entries = fs.readdirSync(resolved, { withFileTypes: true })
  const skills = []

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const skillDir = path.join(resolved, entry.name)
    const skillMd = path.join(skillDir, 'SKILL.md')

    if (!fs.existsSync(skillMd)) continue

    const files = readFilesRecursive(skillDir, '')
    const description = files['SKILL.md'] ? extractDescription(files['SKILL.md']) : ''

    skills.push({
      name: entry.name,
      description,
      files
    })
  }

  skills.sort((a, b) => a.name.localeCompare(b.name))

  // Read optional HOME.md for custom home page
  const homeMd = path.join(resolved, 'HOME.md')
  const homePage = fs.existsSync(homeMd) ? fs.readFileSync(homeMd, 'utf-8') : null

  const result = {
    version: 1,
    generatedAt: new Date().toISOString(),
    skills,
    flags: SEARCH_FLAGS
  }

  if (homePage) result.homePage = homePage

  return result
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const outputIdx = args.indexOf('-o')
let outputFile = null
let inputDir = null

if (outputIdx !== -1) {
  outputFile = args[outputIdx + 1]
  args.splice(outputIdx, 2)
}

inputDir = args[0]

if (!inputDir) {
  console.error('Usage: flow-docs-build <docs-folder> [-o output.json]')
  process.exit(1)
}

const data = buildData(inputDir)
const json = JSON.stringify(data, null, 2)

if (outputFile) {
  fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true })
  fs.writeFileSync(outputFile, json, 'utf-8')
  console.error(`Generated ${outputFile} (${data.skills.length} skills)`)
} else {
  process.stdout.write(json)
}
