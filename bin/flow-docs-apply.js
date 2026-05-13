#!/usr/bin/env node
/**
 * Apply a flow-docs JSONL change log to a local docs folder.
 *
 * Usage:
 *   node bin/flow-docs-apply.js <changes.jsonl> <local-docs-folder> [--dry]
 *
 * Each JSONL line: {ts, user, skill, file, bytes, created, content}
 * The latest entry per (skill, file) wins. After running, review with
 * `git diff` and create the commit yourself.
 */

const fs = require('fs')
const path = require('path')

function die(msg) { console.error('error:', msg); process.exit(1) }

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const positional = args.filter(a => !a.startsWith('--'))
const [logFile, targetDir] = positional

if (!logFile || !targetDir) {
  console.error('Usage: flow-docs-apply <changes.jsonl> <local-docs-folder> [--dry]')
  process.exit(1)
}

if (!fs.existsSync(logFile)) die(`log not found: ${logFile}`)
if (!fs.existsSync(targetDir)) die(`target docs folder not found: ${targetDir}`)

const raw = fs.readFileSync(logFile, 'utf-8')
const lines = raw.split('\n').filter(l => l.trim())

const latest = new Map()
const stats = { total: 0, skipped: 0, byUser: {} }

for (const line of lines) {
  let entry
  try { entry = JSON.parse(line) } catch (e) { stats.skipped++; continue }
  if (!entry.skill || !entry.file || typeof entry.content !== 'string') { stats.skipped++; continue }
  const key = `${entry.skill}/${entry.file}`
  latest.set(key, entry)
  stats.total++
  stats.byUser[entry.user || 'anonymous'] = (stats.byUser[entry.user || 'anonymous'] || 0) + 1
}

const targetResolved = path.resolve(targetDir)
const applied = []
const created = []

for (const [key, entry] of latest) {
  const relParts = key.split('/')
  const filePath = path.resolve(targetResolved, ...relParts)
  if (!filePath.startsWith(targetResolved + path.sep) && filePath !== targetResolved) {
    console.warn(`skip (path traversal): ${key}`)
    continue
  }
  const existed = fs.existsSync(filePath)
  if (!dry) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, entry.content, 'utf-8')
  }
  if (!existed) created.push(key)
  else applied.push(key)
}

console.log(`Log entries: ${stats.total} total, ${stats.skipped} skipped`)
console.log(`Unique files: ${latest.size}`)
console.log(`Updated: ${applied.length}, Created: ${created.length}`)
console.log('By user:')
for (const [u, n] of Object.entries(stats.byUser)) console.log(`  ${u}: ${n}`)
if (dry) console.log('\n(dry run — no files written)')
else console.log('\nDone. Review with `git diff` and commit when ready.')
