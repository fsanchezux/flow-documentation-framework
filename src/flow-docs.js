/**
 * FlowDocs — Embeddable documentation viewer for GitHub repos
 *
 * Reads any GitHub repository and shows its `SKILL.md`-based docs in a
 * sidebar/content/TOC layout. No build step, no JSON files.
 *
 * Usage:
 *   FlowDocs.init({
 *     container: '#docs',
 *     github: { owner: 'user', repo: 'docs', branch: 'main', token: 'optional' }
 *   })
 */

import { marked } from 'marked'
import CSS_TEXT from './style.css'

;(function () {
  'use strict'

  // ─── Icons ─────────────────────────────────────────────────────────────────

  const ICONS = {
    book: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    code: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    copy: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    fileMd: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    db: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    css: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>',
    chevron: '<svg class="fd-tree-chevron" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    chat: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    close: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    send: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  }

  const FILE_ICONS = { md: 'fileMd', vb: 'code', js: 'code', html: 'code', cs: 'code', sql: 'db', css: 'css' }

  // ─── Utilities ──────────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }
  function escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function getExt(filePath) {
    const m = filePath.match(/\.([^.]+)$/)
    return m ? m[1].toLowerCase() : ''
  }

  // Decode a base64 string as UTF-8. `atob()` alone returns a binary string
  // (Latin-1), which mangles any non-ASCII char in the source — e.g. an
  // 'ó' (UTF-8 bytes c3 b3) ends up as "Ã³". We need to take the raw bytes
  // and run them through TextDecoder.
  function b64ToUtf8(b64) {
    if (!b64) return ''
    const cleaned = String(b64).replace(/\s/g, '')
    const binary = atob(cleaned)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder('utf-8').decode(bytes)
  }

  // ─── Markdown engine ───────────────────────────────────────────────────────

  function createMarked() {
    const m = marked
    m.use({
      renderer: {
        code(code, lang) {
          lang = lang || 'plaintext'
          const escaped = String(code).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          return `
<div class="fd-code-block">
  <div class="fd-code-header">
    <span class="fd-code-lang">${lang}</span>
    <button type="button" class="fd-btn-copy" title="Copiar código">
      ${ICONS.copy} Copiar
    </button>
  </div>
  <pre><code class="hljs language-${lang}">${escaped}</code></pre>
</div>`
        }
      }
    })
    return m
  }

  function extractSections(markdown) {
    const sections = []
    const lines = markdown.split('\n')
    for (const line of lines) {
      const m = line.match(/^(#{1,3})\s+(.+)/)
      if (m) {
        const level = m[1].length
        const title = m[2].trim()
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        sections.push({ level, title, id })
      }
    }
    return sections
  }

  function resolveFileRefs(content, files) {
    return content.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g, (match, text, ref) => {
      const normalizedRef = ref.replace(/\\/g, '/')
      if (files[normalizedRef] !== undefined) {
        const ext = getExt(ref)
        return `**${text}** (\`${ref}\`)\n\`\`\`${ext}\n${files[normalizedRef]}\n\`\`\``
      }
      return match
    })
  }

  function addHeadingIds(content) {
    return content.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, title) => {
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return `${hashes} <a id="${id}"></a>${title}`
    })
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  function searchSkills(data, query) {
    const q = query.toLowerCase()
    if (q.length < 2) return []
    const results = []
    const ALL_EXTS = ['.md', '.vb', '.sql', '.html', '.js', '.txt', '.cs']
    const LIMIT = 50

    for (const skill of data.skills) {
      for (const [filePath, fileContent] of Object.entries(skill.files)) {
        const ext = '.' + getExt(filePath)
        if (!ALL_EXTS.includes(ext)) continue
        if (!fileContent) continue

        const lines = fileContent.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(q)) {
            results.push({
              skill: skill.name,
              file: filePath,
              line: i + 1,
              context: lines.slice(Math.max(0, i - 1), i + 2).join('\n'),
              match: lines[i].trim(),
            })
            if (results.length >= LIMIT) return results
          }
        }
      }
    }

    return results
  }

  // ─── BM25 "Ask the docs" engine ────────────────────────────────────────────

  // Multilingual (ES + EN) stopword list — keeps the index small without
  // dropping query-relevant terms.
  const STOPWORDS = new Set([
    'the','a','an','of','to','in','and','or','is','it','for','on','with','as','at',
    'by','from','that','this','be','are','was','were','have','has','had','will',
    'can','do','does','did','if','but','not','no','yes','so','then','than','when',
    'where','what','who','how','why','which','its','their','they','them','our',
    'el','la','los','las','de','que','y','en','un','una','con','por','para','es',
    'son','se','del','al','lo','su','sus','si','como','pero','o','u','e','este',
    'esta','estos','estas','ese','esa','esos','esas','le','les','me','te','nos',
    'mi','tu','ya','muy','mas','sin','sobre','entre','hasta','desde','hay','han',
    'fue','ser','sera','soy','eres','somos','tambien','solo','tan'
  ])

  function bm25Tokenize(text) {
    return String(text)
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip diacritics
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 2 && !STOPWORDS.has(t))
  }

  // Split a markdown doc into chunks at H1/H2 boundaries. Returns
  // [{ title, id, body }]. Falls back to a single chunk if no headings.
  function chunkMarkdown(md) {
    const lines = md.split('\n')
    const sections = []
    let cur = { title: '', id: '', body: '' }
    for (const line of lines) {
      const h = line.match(/^(#{1,2})\s+(.+)/)
      if (h) {
        if (cur.body.trim()) sections.push(cur)
        const title = h[2].trim()
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        cur = { title, id, body: line + '\n' }
      } else {
        cur.body += line + '\n'
      }
    }
    if (cur.body.trim()) sections.push(cur)
    return sections
  }

  function buildAskIndex(skills) {
    const chunks = []
    for (const skill of skills) {
      for (const [filePath, content] of Object.entries(skill.files)) {
        if (!content) continue
        const ext = getExt(filePath)
        if (ext === 'md') {
          for (const sec of chunkMarkdown(content)) {
            chunks.push({
              skill: skill.name,
              file: filePath,
              section: sec.title || filePath,
              sectionId: sec.id || null,
              text: sec.body,
            })
          }
        } else {
          // Non-markdown: index whole file as one chunk (cap at ~4000 chars)
          chunks.push({
            skill: skill.name,
            file: filePath,
            section: filePath,
            sectionId: null,
            text: content.length > 4000 ? content.slice(0, 4000) : content,
          })
        }
      }
    }

    const tokens = chunks.map(c => bm25Tokenize(c.text + ' ' + c.section + ' ' + c.file))
    const N = tokens.length || 1
    const avgdl = tokens.reduce((s, d) => s + d.length, 0) / N

    const df = Object.create(null)
    const tfPerDoc = tokens.map(doc => {
      const tf = Object.create(null)
      const seen = new Set()
      for (const t of doc) {
        tf[t] = (tf[t] || 0) + 1
        seen.add(t)
      }
      for (const t of seen) df[t] = (df[t] || 0) + 1
      return tf
    })

    const idf = Object.create(null)
    for (const t in df) {
      idf[t] = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5))
    }

    return { chunks, tfPerDoc, idf, avgdl, N, dl: tokens.map(d => d.length) }
  }

  function bm25Search(index, query, topK = 5) {
    if (!index || !index.N) return []
    const k1 = 1.5, b = 0.75
    const qTerms = [...new Set(bm25Tokenize(query))]
    if (!qTerms.length) return []

    const scores = new Array(index.N).fill(0)
    for (let i = 0; i < index.N; i++) {
      const dl = index.dl[i]
      const tfDoc = index.tfPerDoc[i]
      for (const t of qTerms) {
        const tf = tfDoc[t]
        if (!tf) continue
        const idfT = index.idf[t] || 0
        const norm = 1 - b + b * (dl / index.avgdl)
        scores[i] += idfT * (tf * (k1 + 1)) / (tf + k1 * norm)
      }
    }

    return scores
      .map((s, i) => ({ s, i }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, topK)
      .map(x => ({ score: x.s, chunk: index.chunks[x.i], queryTerms: qTerms }))
  }

  // Parse home.md for navigable links. Captures both markdown syntax
  // `[text](href)` and raw HTML `<a href="...">text</a>` (useful when the
  // home page is hand-written HTML for layout reasons). Each becomes a
  // navigation chip in the ask panel. Returns [{ label, href }].
  function extractHomeLinks(homeMd) {
    if (!homeMd) return []
    const links = []
    const seen = new Set()
    const add = (rawLabel, rawHref) => {
      // Strip any inner HTML tags from the label, then markdown emphasis
      const label = String(rawLabel)
        .replace(/<[^>]+>/g, '')
        .replace(/[*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      const href = String(rawHref).trim()
      if (!label || !href) return
      // Skip anchors, mailto and javascript: hrefs — they're not navigable
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return
      const key = label.toLowerCase() + '|' + href.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      links.push({ label, href })
    }

    // Markdown links: [label](href)
    const mdRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    let m
    while ((m = mdRegex.exec(homeMd)) !== null) add(m[1], m[2])

    // HTML anchors: <a ... href="..."> label </a>  (single or double quoted)
    const htmlRegex = /<a\b[^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    while ((m = htmlRegex.exec(homeMd)) !== null) add(m[2], m[1])

    return links
  }

  // Filter the home links by a query: case-insensitive substring match against
  // either the label or the href. Uses diacritic-stripped matching for ES.
  function filterHomeLinks(links, query) {
    if (!links.length || !query) return []
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const q = norm(query)
    return links.filter(l => norm(l.label).includes(q) || norm(l.href).includes(q))
  }

  // Extract the most relevant ~400 char window around query terms
  function extractSnippet(text, qTerms, maxLen = 400) {
    const clean = text.replace(/^#{1,6}\s+.*$/gm, '').trim()
    if (clean.length <= maxLen) return clean
    const lower = clean.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    let bestPos = 0, bestHits = 0
    for (let pos = 0; pos < lower.length; pos += 50) {
      const window = lower.slice(pos, pos + maxLen)
      let hits = 0
      for (const t of qTerms) if (window.includes(t)) hits++
      if (hits > bestHits) { bestHits = hits; bestPos = pos }
    }
    const start = Math.max(0, bestPos - 20)
    const end = Math.min(clean.length, start + maxLen)
    return (start > 0 ? '…' : '') + clean.slice(start, end) + (end < clean.length ? '…' : '')
  }

  // ─── File tree builder ─────────────────────────────────────────────────────

  function buildFileTree(files) {
    const tree = []
    const dirs = {}

    for (const filePath of Object.keys(files)) {
      if (filePath === 'SKILL.md' || filePath === 'home.md') continue
      const parts = filePath.split('/')

      if (parts.length === 1) {
        tree.push({ type: 'file', name: parts[0], path: filePath, ext: getExt(filePath) })
      } else {
        const topDir = parts[0]
        if (!dirs[topDir]) {
          dirs[topDir] = { type: 'dir', name: topDir, path: topDir, children: [] }
          tree.push(dirs[topDir])
        }
        dirs[topDir].children.push({
          type: 'file',
          name: parts.slice(1).join('/'),
          path: filePath,
          ext: getExt(filePath)
        })
      }
    }

    tree.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return tree
  }

  function countFiles(nodes) {
    return nodes.reduce((n, node) => n + (node.type === 'file' ? 1 : countFiles(node.children || [])), 0)
  }

  // ─── GitHub API loader ─────────────────────────────────────────────────────

  async function loadFromGitHub(config) {
    const { owner, repo, branch = 'main', token } = config
    const headers = { 'Accept': 'application/vnd.github.v3+json' }
    if (token) headers['Authorization'] = `token ${token}`

    const baseUrl = `https://api.github.com/repos/${owner}/${repo}`

    // Fetch the recursive tree
    const treeRes = await fetch(`${baseUrl}/git/trees/${branch}?recursive=1`, { headers })
    if (!treeRes.ok) throw new Error(`GitHub API error: ${treeRes.status} ${treeRes.statusText}`)
    const treeData = await treeRes.json()

    const files = treeData.tree.filter(item => item.type === 'blob')

    // Group files by top-level directory (each dir with SKILL.md = a skill)
    const skillDirs = new Set()
    for (const f of files) {
      const parts = f.path.split('/')
      if (parts.length > 1 && parts[parts.length - 1] === 'SKILL.md') {
        skillDirs.add(parts[0])
      }
    }

    const rootSkillMd = files.find(f => f.path === 'SKILL.md')
    const skills = []

    // Helper: does this file belong to a sub-skill directory?
    const belongsToSubSkill = (path) => {
      for (const dir of skillDirs) {
        if (path.startsWith(dir + '/')) return true
      }
      return false
    }

    if (rootSkillMd) {
      const rootSkill = { name: repo, description: '', files: {} }
      // Include ALL files (any depth) that aren't inside a sub-skill dir
      for (const f of files) {
        if (!belongsToSubSkill(f.path)) {
          rootSkill.files[f.path] = null
        }
      }
      skills.push(rootSkill)
    }

    for (const dir of skillDirs) {
      const skill = { name: dir, description: '', files: {} }
      for (const f of files) {
        if (f.path.startsWith(dir + '/')) {
          const relPath = f.path.slice(dir.length + 1)
          skill.files[relPath] = null
        }
      }
      skills.push(skill)
    }

    // Fetch all file contents in batches
    const BATCH_SIZE = 50
    const allFiles = files.filter(f => {
      // Root skill: all files at any depth that aren't in a sub-skill
      if (rootSkillMd && !belongsToSubSkill(f.path)) return true
      // Sub-skill files
      if (belongsToSubSkill(f.path)) return true
      return false
    })

    let homePage = null

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE)
      const promises = batch.map(async (f) => {
        try {
          const res = await fetch(f.url, { headers })
          const data = await res.json()
          return { path: f.path, content: b64ToUtf8(data.content) }
        } catch {
          return { path: f.path, content: '' }
        }
      })
      const results = await Promise.all(promises)
      for (const r of results) {
        // Root home.md is always the global home page
        if (r.path === 'home.md') homePage = r.content

        if (belongsToSubSkill(r.path)) {
          // Sub-skill file: assign to the sub-skill it belongs to
          const parts = r.path.split('/')
          const dir = parts[0]
          const skill = skills.find(s => s.name === dir)
          if (skill) {
            const relPath = parts.slice(1).join('/')
            skill.files[relPath] = r.content
          }
        } else if (rootSkillMd) {
          // Anything else (any depth) belongs to the root skill
          const skill = skills.find(s => s.name === repo)
          if (skill) skill.files[r.path] = r.content
        }
      }
    }

    // Extract descriptions from SKILL.md first line
    for (const skill of skills) {
      const skillMd = skill.files['SKILL.md']
      if (skillMd) {
        const firstLine = skillMd.split('\n')[0]
        const m = firstLine.match(/^#\s+(.+)/)
        if (m) skill.description = m[1].trim()
      }
    }

    return { skills, homePage }
  }

  // ─── FlowDocs class ───────────────────────────────────────────────────────

  class FlowDocsInstance {
    constructor(options) {
      this.container = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container

      if (!this.container) throw new Error('FlowDocs: container not found')
      if (!options.github) throw new Error('FlowDocs: `github` option is required')

      const mode = options.mode || 'full'
      if (!['full', 'chat', 'modal'].includes(mode)) {
        throw new Error(`FlowDocs: invalid mode "${mode}". Use 'full', 'chat' or 'modal'.`)
      }
      this.mode = mode

      this.github = options.github
      this.homePage = null
      this.data = null
      this.markedInstance = createMarked()
      this.currentSkill = null
      this.currentFilePath = null
      this.searchTimeout = null
      this.askIndex = null

      this._injectCSS()
      this._buildDOM()
      this._bindEvents()
      this._loadFromGitHub()
    }

    // ─── Public methods for modal/chat modes ───────────────────────────────

    open() {
      if (this.mode === 'modal') this._openModal()
      else if (this.mode === 'chat') this._openAsk()
    }

    close() {
      if (this.mode === 'modal') this._closeModal()
      else if (this.mode === 'chat') this._closeAsk()
    }

    // ─── CSS injection ─────────────────────────────────────────────────────

    _injectCSS() {
      if (!document.querySelector('link[href*="highlight.js"][href*="github-dark"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        document.head.appendChild(link)
      }

      const style = document.createElement('style')
      style.textContent = CSS_TEXT
      document.head.appendChild(style)

      this._loadHljs()
    }

    _loadHljs() {
      if (window.hljs) return Promise.resolve()
      return new Promise((resolve) => {
        if (document.querySelector('script[src*="highlight.min.js"]')) {
          const check = () => window.hljs ? resolve() : setTimeout(check, 50)
          check()
          return
        }
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'
        s.onload = () => {
          const langs = ['vbnet', 'sql']
          let loaded = 0
          langs.forEach(lang => {
            const ls = document.createElement('script')
            ls.src = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/${lang}.min.js`
            ls.onload = () => { if (++loaded === langs.length) resolve() }
            document.head.appendChild(ls)
          })
        }
        document.head.appendChild(s)
      })
    }

    // ─── GitHub API mode ───────────────────────────────────────────────────

    async _loadFromGitHub() {
      try {
        this._showLoading('Cargando desde GitHub...')
        const data = await loadFromGitHub(this.github)
        this._loadData(data)
        this._hideLoading()
      } catch (e) {
        this._hideLoading()
        this._showError('Error al cargar desde GitHub: ' + e.message)
        console.error('FlowDocs: GitHub load failed', e)
      }
    }

    // ─── DOM structure ─────────────────────────────────────────────────────

    _buildDOM() {
      // Two roots:
      // - `root` lives inside the host container (only used by 'full' mode
      //   for the viewer; empty in chat/modal modes).
      // - `floatRoot` lives directly under <body> so that floating UI
      //   (FABs, panels, modal) escapes any ancestor with `transform`,
      //   `filter`, `perspective` or `will-change`, which would otherwise
      //   break `position: fixed` and re-anchor the FABs to the wrong
      //   element (often top-left of the host page).
      this.container.innerHTML = ''
      const root = document.createElement('div')
      root.className = `flow-docs-root fd-mode-${this.mode}`

      if (this.mode === 'full') {
        root.innerHTML = this._dom_viewerInner() + this._dom_overlays()
      }
      this.container.appendChild(root)
      this.root = root

      const floatRoot = document.createElement('div')
      floatRoot.className = `flow-docs-root flow-docs-floating fd-mode-${this.mode}`

      if (this.mode === 'chat') {
        floatRoot.innerHTML = this._dom_overlays() + this._dom_askUI()
      } else if (this.mode === 'modal') {
        floatRoot.innerHTML = this._dom_modalTrigger() + this._dom_modalShell() + this._dom_overlays() + this._dom_askUI()
      } else {
        // full mode: only the ask UI floats; overlays stay in container
        floatRoot.innerHTML = this._dom_askUI()
      }
      document.body.appendChild(floatRoot)
      this.floatRoot = floatRoot

      this._cacheElements()
    }

    // Viewer shell (sidebar + main + toc). Used in 'full' and (wrapped) 'modal'.
    _dom_viewerInner() {
      return `
        <aside class="fd-sidebar">
          <div class="fd-sidebar-header">
            <button type="button" class="fd-logo" title="Inicio">${ICONS.book}</button>
            <button type="button" class="fd-btn-reload" title="Recargar desde GitHub">
              ${ICONS.refresh}
            </button>
          </div>
          <nav class="fd-skill-list"></nav>
        </aside>

        <main class="fd-main">
          <div class="fd-content-area">
            <div class="fd-welcome">
              <div class="fd-welcome-inner">
                ${ICONS.book}
                <p>Selecciona un skill del sidebar para ver su documentación.</p>
              </div>
            </div>
            <div class="fd-skill-content fd-hidden"></div>
            <div class="fd-search-results fd-hidden"></div>
          </div>

          <div class="fd-toc">
            <div class="fd-toc-resizer"></div>
            <div class="fd-toc-title">En esta página</div>
            <ul class="fd-toc-list"></ul>
          </div>
        </main>
      `
    }

    _dom_overlays() {
      return `
        <div class="fd-toast">
          ${ICONS.check}
          <span class="fd-toast-msg">Copiado</span>
        </div>
        <div class="fd-loading fd-hidden">
          <div class="fd-loading-spinner"></div>
          <div class="fd-loading-text">Cargando...</div>
        </div>
        <div class="fd-error fd-hidden">
          <div class="fd-error-text"></div>
        </div>
      `
    }

    _dom_askUI() {
      return `
        <button type="button" class="fd-ask-fab" title="Pregunta a los docs">
          ${ICONS.chat}
        </button>
        <div class="fd-ask-panel fd-hidden">
          <div class="fd-ask-header">
            <span class="fd-ask-title">Pregunta a los docs</span>
            <button type="button" class="fd-ask-close" title="Cerrar">${ICONS.close}</button>
          </div>
          <div class="fd-ask-results">
            <div class="fd-ask-placeholder">
              Haz una pregunta en lenguaje natural y te muestro los fragmentos más relevantes de la documentación.
            </div>
          </div>
          <form class="fd-ask-input-row">
            <input type="text" class="fd-ask-input" placeholder="¿Qué quieres saber?" autocomplete="off">
            <button type="submit" class="fd-ask-send" title="Buscar">${ICONS.send}</button>
          </form>
        </div>
      `
    }

    _dom_modalTrigger() {
      return `
        <button type="button" class="fd-modal-fab" title="Abrir documentación">
          ${ICONS.book}
        </button>
      `
    }

    _dom_modalShell() {
      return `
        <div class="fd-modal-backdrop fd-hidden"></div>
        <div class="fd-modal fd-hidden">
          <button type="button" class="fd-modal-close" title="Cerrar">${ICONS.close}</button>
          ${this._dom_viewerInner()}
        </div>
      `
    }

    // Query helpers that look in BOTH roots (container + body-attached float).
    // Needed because in modal mode the viewer lives inside the modal which is
    // in floatRoot, not in the container root.
    _$(sel)  { return this.root.querySelector(sel) || this.floatRoot.querySelector(sel) }
    _$$(sel) {
      return [
        ...this.root.querySelectorAll(sel),
        ...this.floatRoot.querySelectorAll(sel),
      ]
    }

    _cacheElements() {
      const find = (sel) => this._$(sel)
      this.$ = {
        // viewer
        skillList: find('.fd-skill-list'),
        searchInput: find('.fd-search-input'),
        welcome: find('.fd-welcome'),
        skillContent: find('.fd-skill-content'),
        searchResults: find('.fd-search-results'),
        btnReload: find('.fd-btn-reload'),
        toc: find('.fd-toc'),
        tocList: find('.fd-toc-list'),
        tocResizer: find('.fd-toc-resizer'),
        contentArea: find('.fd-content-area'),
        main: find('.fd-main'),
        // overlays
        toast: find('.fd-toast'),
        toastMsg: find('.fd-toast-msg'),
        loading: find('.fd-loading'),
        loadingText: find('.fd-loading-text'),
        error: find('.fd-error'),
        errorText: find('.fd-error-text'),
        // ask (in floatRoot)
        askFab: find('.fd-ask-fab'),
        askPanel: find('.fd-ask-panel'),
        askClose: find('.fd-ask-close'),
        askResults: find('.fd-ask-results'),
        askForm: find('.fd-ask-input-row'),
        askInput: find('.fd-ask-input'),
        // modal (in floatRoot, only in modal mode)
        modalFab: find('.fd-modal-fab'),
        modal: find('.fd-modal'),
        modalBackdrop: find('.fd-modal-backdrop'),
        modalClose: find('.fd-modal-close'),
      }
    }

    // ─── Event binding ─────────────────────────────────────────────────────

    _bindEvents() {
      this.root.setAttribute('tabindex', '-1')

      // Ask panel events (always present)
      this.$.askFab.addEventListener('click', () => this._toggleAsk())
      this.$.askClose.addEventListener('click', () => this._closeAsk())
      this.$.askForm.addEventListener('submit', (e) => {
        e.preventDefault()
        this._doAsk(this.$.askInput.value.trim())
      })
      this.$.askResults.addEventListener('click', (e) => {
        // Home.md shortcut chip → navigate to its href
        const shortcut = e.target.closest('.fd-ask-shortcut')
        if (shortcut) {
          this._navigateToHref(shortcut.dataset.href)
          return
        }

        const card = e.target.closest('.fd-ask-result')
        if (!card) return
        const skill = card.dataset.skill
        const file = card.dataset.file
        const section = card.dataset.section

        // In chat mode there's no viewer → open the file on GitHub directly
        if (this.mode === 'chat') {
          const url = `https://github.com/${this.github.owner}/${this.github.repo}/blob/${this.github.branch || 'main'}/${file}${section ? '#' + section : ''}`
          window.open(url, '_blank', 'noopener')
          return
        }

        // In full/modal: navigate inside the viewer
        this._loadFile(skill, file)
        if (section) {
          setTimeout(() => {
            const el = this._$(`[id="${section}"]`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        }
        this._closeAsk()
      })

      // Modal trigger events (modal mode only)
      if (this.mode === 'modal') {
        this.$.modalFab.addEventListener('click', () => this._openModal())
        this.$.modalClose.addEventListener('click', () => this._closeModal())
        this.$.modalBackdrop.addEventListener('click', () => this._closeModal())
      }

      // Keyboard: Esc closes whatever is open. Bound to document so shortcuts
      // work regardless of which DOM tree (root vs floatRoot) has focus.
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.$.searchInput && document.activeElement === this.$.searchInput) {
            this.$.searchInput.value = ''
            this.$.searchInput.blur()
            if (this.currentSkill) this._loadSkill(this.currentSkill)
            else this._showPanel('welcome')
            return
          }
          if (this.mode === 'modal' && this.$.modal && !this.$.modal.classList.contains('fd-hidden')) {
            this._closeModal()
            return
          }
          if (this.$.askPanel && !this.$.askPanel.classList.contains('fd-hidden')) {
            this._closeAsk()
          }
        }
        if (this.$.searchInput && (e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault()
          this.$.searchInput.focus()
          this.$.searchInput.select()
        }
      })

      // Viewer-only events (full + modal modes)
      if (this.$.searchInput) {
        this.$.searchInput.addEventListener('input', () => {
          clearTimeout(this.searchTimeout)
          const q = this.$.searchInput.value.trim()
          if (q.length < 2) {
            if (this.currentSkill) this._loadSkill(this.currentSkill)
            else this._showPanel('welcome')
            return
          }
          this.searchTimeout = setTimeout(() => this._doSearch(q), 250)
        })
      }

      if (this.$.skillList) {
        this.$.skillList.addEventListener('click', (e) => {
          const header = e.target.closest('.fd-tree-dir-header')
          if (header) {
            e.stopPropagation()
            const children = header.nextElementSibling
            const open = header.dataset.open === 'true'
            header.dataset.open = !open
            children.classList.toggle('fd-hidden', open)
            return
          }

          const fileEl = e.target.closest('.fd-tree-file')
          if (fileEl) {
            e.stopPropagation()
            this._loadFile(fileEl.dataset.skill, fileEl.dataset.path)
          }
        })
      }

      if (this.$.btnReload) {
        this.$.btnReload.addEventListener('click', (e) => {
          e.stopPropagation()
          this._loadFromGitHub()
        })
      }

      const logo = this._$('.fd-logo')
      if (logo) {
        logo.addEventListener('click', () => {
          this.currentSkill = null
          this.currentFilePath = null
          this._$$('.fd-skill-item').forEach(el => el.classList.remove('active'))
          this._$$('.fd-skill-tree').forEach(el => el.remove())
          this.$.toc.classList.remove('visible')
          this._showPanel('welcome')
          this._renderHomePage()
        })
      }

      // Copy-button delegation. Listen on BOTH roots since rendered markdown
      // content may live inside root (full mode) or inside the modal in
      // floatRoot (modal mode).
      const onCopyClick = (e) => {
        const btn = e.target.closest('.fd-btn-copy')
        if (btn) {
          const code = btn.closest('.fd-code-block').querySelector('code')
          navigator.clipboard.writeText(code.innerText).then(() => this._showToast())
        }
      }
      this.root.addEventListener('click', onCopyClick)
      this.floatRoot.addEventListener('click', onCopyClick)

      if (this.$.tocResizer) this._initTocResizer()
    }

    // ─── Modal open/close ──────────────────────────────────────────────────

    _openModal() {
      this.$.modal.classList.remove('fd-hidden')
      this.$.modalBackdrop.classList.remove('fd-hidden')
      this.$.modalFab.classList.add('fd-hidden')
    }

    _closeModal() {
      this.$.modal.classList.add('fd-hidden')
      this.$.modalBackdrop.classList.add('fd-hidden')
      this.$.modalFab.classList.remove('fd-hidden')
    }

    // ─── Data loading ──────────────────────────────────────────────────────

    _loadData(data) {
      this.data = data
      this.homePage = data.homePage || null
      this.askIndex = null // built lazily on first ask
      if (this.$.skillList) this._renderSkillList()
      if (this.$.welcome) this._renderHomePage()
      // If the ask panel was opened before data finished loading, swap the
      // "loading…" message for the placeholder + shortcuts.
      if (this.$.askPanel && !this.$.askPanel.classList.contains('fd-hidden')) {
        this.$.askResults.innerHTML = this._askPlaceholderHtml()
      }
    }

    // ─── Loading / Error states ────────────────────────────────────────────

    _showLoading(msg) {
      if (!this.$.loading) return
      this.$.loadingText.textContent = msg || 'Cargando...'
      this.$.loading.classList.remove('fd-hidden')
    }

    _hideLoading() {
      if (!this.$.loading) return
      this.$.loading.classList.add('fd-hidden')
    }

    _showError(msg) {
      if (!this.$.error) return
      this.$.errorText.textContent = msg
      this.$.error.classList.remove('fd-hidden')
    }

    // ─── Skill list ────────────────────────────────────────────────────────

    _renderSkillList() {
      if (!this.data || !this.data.skills.length) {
        this.$.skillList.innerHTML = `<div class="fd-empty-state">No se encontraron skills.<br><br>Asegúrate de que el repo tiene carpetas con un archivo <code>SKILL.md</code>.</div>`
        return
      }

      this.$.skillList.innerHTML = this.data.skills.map(s => `
        <div class="fd-skill-item ${this.currentSkill === s.name ? 'active' : ''}"
             data-skill="${escAttr(s.name)}">
          <div class="fd-skill-name">
            ${ICONS.code}
            ${escHtml(s.name)}
          </div>
          ${s.description ? `<div class="fd-skill-desc">${escHtml(s.description)}</div>` : ''}
        </div>
      `).join('')

      this.$.skillList.querySelectorAll('.fd-skill-item').forEach(el => {
        el.addEventListener('click', () => this._loadSkill(el.dataset.skill))
      })
    }

    // ─── Load skill ────────────────────────────────────────────────────────

    _loadSkill(name, section) {
      const skill = this.data.skills.find(s => s.name === name)
      if (!skill) return

      this.currentSkill = name
      this.currentFilePath = null

      this._$$('.fd-skill-item').forEach(el => {
        el.classList.toggle('active', el.dataset.skill === name)
      })
      this._$$('.fd-tree-file').forEach(el => el.classList.remove('active'))

      // Render content (home.md > SKILL.md > empty placeholder)
      const defaultFile = skill.files['home.md']
        ? 'home.md'
        : (skill.files['SKILL.md'] ? 'SKILL.md' : null)

      this._showPanel('skillContent')

      if (defaultFile) {
        const rawContent = skill.files[defaultFile]
        let content = resolveFileRefs(rawContent, skill.files)
        content = addHeadingIds(content)
        const html = this.markedInstance.parse(content)
        const sections = extractSections(rawContent)

        this.$.skillContent.innerHTML = html
        this._highlightCode()
        this._bindInternalLinks(this.$.skillContent)
        this._buildTOC(sections)
        this.$.toc.classList.add('visible')
      } else {
        this.$.skillContent.innerHTML = `<div class="fd-empty-state">Este skill no tiene <code>SKILL.md</code> ni <code>home.md</code>. Selecciona un archivo del árbol.</div>`
        this.$.tocList.innerHTML = ''
        this.$.toc.classList.remove('visible')
      }

      // Always render the file tree (even when there's no SKILL.md)
      this._buildSkillTree(skill)

      if (section) {
        setTimeout(() => {
          const el = this._$(`#${section}`) || this._$(`[id="${section}"]`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      } else {
        this.$.contentArea.scrollTop = 0
      }
    }

    // ─── Load file ─────────────────────────────────────────────────────────

    _loadFile(skillName, filePath) {
      const skill = this.data.skills.find(s => s.name === skillName)
      if (!skill) return

      const fileContent = skill.files[filePath]
      if (fileContent === undefined) return

      this.currentSkill = skillName
      this.currentFilePath = filePath

      this._$$('.fd-skill-item').forEach(el => {
        el.classList.toggle('active', el.dataset.skill === skillName)
      })
      this._$$('.fd-tree-file').forEach(el => {
        el.classList.toggle('active', el.dataset.skill === skillName && el.dataset.path === filePath)
      })

      this._showPanel('skillContent')
      const ext = getExt(filePath)

      if (ext === 'md') {
        let mdContent = addHeadingIds(fileContent)
        const html = this.markedInstance.parse(mdContent)
        const sections = extractSections(fileContent)
        this.$.skillContent.innerHTML = html
        this._highlightCode()
        this._bindInternalLinks(this.$.skillContent)
        this._buildTOC(sections)
        this.$.toc.classList.add('visible')
      } else {
        const lang = ext || 'plaintext'
        const escaped = escHtml(fileContent)
        this.$.skillContent.innerHTML = `
          <div class="fd-file-header">
            <span class="fd-file-breadcrumb">${escHtml(skillName)} / ${escHtml(filePath)}</span>
          </div>
          <div class="fd-code-block">
            <div class="fd-code-header">
              <span class="fd-code-lang">${escHtml(lang)}</span>
              <button type="button" class="fd-btn-copy" title="Copiar código">
                ${ICONS.copy} Copiar
              </button>
            </div>
            <pre><code class="hljs language-${escHtml(lang)}">${escaped}</code></pre>
          </div>`
        this._highlightCode()
        this.$.tocList.innerHTML = ''
        this.$.toc.classList.remove('visible')
      }

      this.$.contentArea.scrollTop = 0
    }

    // ─── File tree ─────────────────────────────────────────────────────────

    _buildSkillTree(skill) {
      this._$$('.fd-skill-tree').forEach(el => el.remove())

      const tree = buildFileTree(skill.files)
      if (!tree.length) return

      const skillItem = this._$(`.fd-skill-item[data-skill="${escAttr(skill.name)}"]`)
      if (!skillItem) return

      const treeEl = document.createElement('div')
      treeEl.className = 'fd-skill-tree'
      treeEl.dataset.skill = skill.name
      treeEl.innerHTML = this._renderTreeNodes(tree, skill.name)
      skillItem.insertAdjacentElement('afterend', treeEl)
    }

    _renderTreeNodes(nodes, skillName) {
      return nodes.map(node => {
        if (node.type === 'dir') {
          const hasFiles = (node.children || []).length > 0
          // Directories start OPEN by default so the structure is visible at a glance
          return `
            <div class="fd-tree-dir">
              <div class="fd-tree-dir-header" data-open="true">
                ${ICONS.chevron}
                ${ICONS.folder}
                <span>${escHtml(node.name)}</span>
                ${hasFiles ? `<span class="fd-tree-count">${countFiles(node.children)}</span>` : ''}
              </div>
              <div class="fd-tree-dir-children">
                ${this._renderTreeNodes(node.children || [], skillName)}
              </div>
            </div>`
        } else {
          const iconKey = FILE_ICONS[node.ext] || 'fileMd'
          return `
            <div class="fd-tree-file" data-skill="${escAttr(skillName)}" data-path="${escAttr(node.path)}" title="${escAttr(node.path)}">
              ${ICONS[iconKey]}
              <span>${escHtml(node.name)}</span>
            </div>`
        }
      }).join('')
    }

    // ─── TOC ───────────────────────────────────────────────────────────────

    _buildTOC(sections) {
      this.$.tocList.innerHTML = sections.map(s => `
        <li class="fd-toc-level-${s.level}">
          <a href="javascript:void(0)" data-section="${escAttr(s.id)}">${escHtml(s.title)}</a>
        </li>
      `).join('')

      this.$.tocList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault()
          const id = a.dataset.section
          const el = this._$(`#${id}`) || this._$(`[id="${id}"]`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })
    }

    // ─── Search ────────────────────────────────────────────────────────────

    _doSearch(query) {
      if (query.length < 2) return

      const results = searchSkills(this.data, query)
      this._showPanel('searchResults')

      if (results.length === 0) {
        this.$.searchResults.innerHTML = `<div class="fd-search-empty">Sin resultados para "<strong>${escHtml(query)}</strong>"</div>`
        return
      }

      const highlighted = (text) => {
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        return escHtml(text).replace(re, '<mark>$1</mark>')
      }

      const resultsHtml = results.map(r => `
        <div class="fd-search-result" data-skill="${escAttr(r.skill)}" data-file="${escAttr(r.file)}">
          <div class="fd-search-result-meta">
            <span class="fd-tag">${escHtml(r.skill)}</span>
            <span class="fd-file-path">${escHtml(r.file)}:${r.line}</span>
          </div>
          <div class="fd-search-result-match">${highlighted(r.match)}</div>
          <div class="fd-search-result-context">${highlighted(r.context)}</div>
        </div>`).join('')

      this.$.searchResults.innerHTML = `
        <div class="fd-search-header">
          ${results.length} resultado${results.length !== 1 ? 's' : ''} para "<strong>${escHtml(query)}</strong>"
        </div>
        ${resultsHtml}
      `

      this.$.searchResults.querySelectorAll('.fd-search-result').forEach(el => {
        el.addEventListener('click', () => {
          this.$.searchInput.value = ''
          this._loadFile(el.dataset.skill, el.dataset.file)
        })
      })

      this.$.toc.classList.remove('visible')
    }

    // ─── Home page ──────────────────────────────────────────────────────────

    _renderHomePage() {
      if (!this.homePage) return
      let content = addHeadingIds(this.homePage)
      const html = this.markedInstance.parse(content)
      this.$.welcome.innerHTML = `<div class="fd-home-content">${html}</div>`
      this._highlightCode()
      this._bindInternalLinks(this.$.welcome)
    }

    _bindInternalLinks(container) {
      container.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href')
        if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('javascript:')) return
        a.addEventListener('click', (e) => {
          e.preventDefault()
          this._navigateInternal(href)
        })
      })
    }

    _navigateInternal(href) {
      const clean = href.replace(/^\/+/, '')
      if (!clean || !this.data) return

      // Split off optional #section fragment
      let section = null
      let path = clean
      const hashIdx = clean.indexOf('#')
      if (hashIdx >= 0) {
        section = clean.slice(hashIdx + 1)
        path = clean.slice(0, hashIdx)
      }

      if (!path) return
      const parts = path.split('/')
      const skillName = parts[0]
      const skill = this.data.skills.find(s => s.name === skillName)

      if (!skill) return

      if (parts.length === 1) {
        this._loadSkill(skillName, section)
      } else {
        const filePath = parts.slice(1).join('/')
        if (skill.files[filePath] !== undefined) {
          this._loadFile(skillName, filePath)
          if (section) {
            setTimeout(() => {
              const el = this._$(`[id="${section}"]`)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
          }
        } else {
          this._loadSkill(skillName, section)
        }
      }
    }

    // Navigate to a home.md href. Behaviour depends on mode:
    //  - chat: open the corresponding file on github.com in a new tab
    //  - modal: open the modal and navigate inside
    //  - full: navigate inside the existing viewer
    _navigateToHref(href) {
      if (!href) return

      // External links: open as-is
      if (/^https?:\/\//i.test(href)) {
        window.open(href, '_blank', 'noopener')
        return
      }

      if (this.mode === 'chat') {
        const path = href.replace(/^\/+/, '').replace(/#.*$/, '')
        const fragment = href.includes('#') ? '#' + href.split('#').slice(1).join('#') : ''
        const url = `https://github.com/${this.github.owner}/${this.github.repo}/blob/${this.github.branch || 'main'}/${path}${fragment}`
        window.open(url, '_blank', 'noopener')
        return
      }

      // modal/full: navigate inside the viewer
      if (this.mode === 'modal') this._openModal()
      this._navigateInternal(href)
      this._closeAsk()
    }

    // ─── Ask panel ─────────────────────────────────────────────────────────

    _toggleAsk() {
      if (this.$.askPanel.classList.contains('fd-hidden')) this._openAsk()
      else this._closeAsk()
    }

    _openAsk() {
      this.$.askPanel.classList.remove('fd-hidden')
      this.$.askFab.classList.add('fd-hidden')
      if (!this.data) {
        this.$.askResults.innerHTML = `
          <div class="fd-ask-placeholder">
            <div class="fd-ask-spinner"></div>
            Cargando documentación de GitHub...
          </div>`
      } else if (!this.$.askInput.value.trim()) {
        // Refresh placeholder + shortcuts whenever opening with empty input
        this.$.askResults.innerHTML = this._askPlaceholderHtml()
      }
      setTimeout(() => this.$.askInput.focus(), 50)
    }

    _closeAsk() {
      this.$.askPanel.classList.add('fd-hidden')
      this.$.askFab.classList.remove('fd-hidden')
    }

    _renderShortcutsList(links, title) {
      if (!links.length) return ''
      return `
        <div class="fd-ask-shortcuts">
          <div class="fd-ask-shortcuts-title">${escHtml(title)}</div>
          <div class="fd-ask-shortcuts-list">
            ${links.map(l => `<button type="button" class="fd-ask-shortcut" data-href="${escAttr(l.href)}">${escHtml(l.label)}</button>`).join('')}
          </div>
        </div>`
    }

    _askPlaceholderHtml() {
      const links = extractHomeLinks(this.homePage)
      return `
        <div class="fd-ask-placeholder">
          Haz una pregunta en lenguaje natural y te muestro los fragmentos más relevantes de la documentación.
        </div>
        ${this._renderShortcutsList(links, 'Accesos rápidos')}
      `
    }

    _doAsk(query) {
      // Empty submit → reset to placeholder + shortcuts
      if (!query) {
        this.$.askInput.value = ''
        this.$.askResults.innerHTML = this._askPlaceholderHtml()
        this.$.askInput.focus()
        return
      }
      if (query.length < 2 || !this.data) return

      // Lazy build index on first query
      if (!this.askIndex) {
        this.askIndex = buildAskIndex(this.data.skills)
      }

      const homeLinks = extractHomeLinks(this.homePage)
      const matchingLinks = filterHomeLinks(homeLinks, query)
      const results = bm25Search(this.askIndex, query, 5)

      if (!matchingLinks.length && !results.length) {
        this.$.askResults.innerHTML = `
          <div class="fd-ask-empty">
            Sin resultados para "<strong>${escHtml(query)}</strong>".
            Prueba con otras palabras clave.
          </div>
          ${this._renderShortcutsList(homeLinks, 'Accesos rápidos')}
        `
        return
      }

      const highlight = (text, terms) => {
        const safe = escHtml(text)
        if (!terms.length) return safe
        const pattern = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
        const re = new RegExp(`\\b(${pattern})`, 'gi')
        return safe.replace(re, '<mark>$1</mark>')
      }

      const html = results.map(r => {
        const c = r.chunk
        const snippet = extractSnippet(c.text, r.queryTerms, 350)
        return `
          <div class="fd-ask-result" data-skill="${escAttr(c.skill)}" data-file="${escAttr(c.file)}" ${c.sectionId ? `data-section="${escAttr(c.sectionId)}"` : ''}>
            <div class="fd-ask-result-meta">
              <span class="fd-tag">${escHtml(c.skill)}</span>
              <span class="fd-file-path">${escHtml(c.file)}${c.section && c.section !== c.file ? ' › ' + escHtml(c.section) : ''}</span>
            </div>
            <div class="fd-ask-result-snippet">${highlight(snippet, r.queryTerms)}</div>
          </div>`
      }).join('')

      // Home-md link matches go FIRST, then BM25 content fragments.
      const linksBlock = matchingLinks.length
        ? this._renderShortcutsList(matchingLinks, 'Accesos directos')
        : ''

      const fragmentsBlock = results.length
        ? `
          <div class="fd-ask-header-results">
            Top ${results.length} fragmento${results.length !== 1 ? 's' : ''} para "<strong>${escHtml(query)}</strong>"
          </div>
          ${html}`
        : ''

      this.$.askResults.innerHTML = linksBlock + fragmentsBlock
    }

    // ─── UI helpers ────────────────────────────────────────────────────────

    _showPanel(id) {
      const panels = { welcome: this.$.welcome, skillContent: this.$.skillContent, searchResults: this.$.searchResults }
      for (const [key, el] of Object.entries(panels)) {
        el.classList.toggle('fd-hidden', key !== id)
      }
    }

    _showToast(msg) {
      this.$.toastMsg.textContent = msg || 'Copiado'
      this.$.toast.classList.add('show')
      setTimeout(() => this.$.toast.classList.remove('show'), 1800)
    }

    _highlightCode() {
      if (!window.hljs) return
      this._$$('pre code').forEach(el => {
        window.hljs.highlightElement(el)
      })
    }

    _initTocResizer() {
      const resizer = this.$.tocResizer
      const toc = this.$.toc

      const savedW = parseInt(localStorage.getItem('flow-docs-toc-width'))
      if (savedW && savedW >= 100 && savedW <= 600) {
        this.root.style.setProperty('--fd-toc-w', savedW + 'px')
      }

      resizer.addEventListener('mousedown', (e) => {
        e.preventDefault()
        const startX = e.clientX
        const startW = toc.offsetWidth
        let currentW = startW
        resizer.classList.add('dragging')
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'

        const onMove = (e) => {
          currentW = Math.max(100, Math.min(600, startW + (startX - e.clientX)))
          this.root.style.setProperty('--fd-toc-w', currentW + 'px')
        }

        const onUp = () => {
          resizer.classList.remove('dragging')
          document.body.style.cursor = ''
          document.body.style.userSelect = ''
          localStorage.setItem('flow-docs-toc-width', currentW)
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup', onUp)
        }

        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
      })
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  const VERSION = '3.1.6'

  const FlowDocs = {
    VERSION,
    init(options) {
      console.log('[FlowDocs] v' + VERSION + ' (mode=' + (options.mode || 'full') + ')')
      return new FlowDocsInstance(options)
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowDocs
  }
  window.FlowDocs = FlowDocs

})()
