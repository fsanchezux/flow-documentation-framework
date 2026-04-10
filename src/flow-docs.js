/**
 * FlowDocs — Embeddable documentation viewer
 *
 * Usage:
 *   FlowDocs.init({
 *     container: '#docs',
 *     dataUrl: './flow-docs-data.json',
 *     onSave: (skill, filePath, content) => { ... }
 *   })
 */

import { marked } from 'marked'
import CSS_TEXT from './style.css'

;(function () {
  'use strict'

  // ─── Icons (reusable SVG strings) ──────────────────────────────────────────

  const ICONS = {
    book: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    code: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    copy: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    save: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    fileMd: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    db: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
    css: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>',
    chevron: '<svg class="fd-tree-chevron" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
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
    <button class="fd-btn-copy" title="Copiar código">
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

  // ─── Search engine ──────────────────────────────────────────────────────────

  function searchSkills(data, query, activeFlags) {
    const q = query.toLowerCase()
    const results = []
    const ALL_EXTS = ['.md', '.vb', '.sql', '.html', '.js', '.txt', '.cs']

    const flagMap = {}
    for (const f of data.flags) flagMap[f.flag] = f

    let allowedDirs = null
    let allowedExts = null

    if (activeFlags.length > 0) {
      const dirSet = new Set()
      const extSet = new Set()
      let anyDirRestriction = false
      let anyExtRestriction = false

      for (const flagName of activeFlags) {
        const flagDef = flagMap[flagName]
        if (!flagDef) continue
        if (flagDef.dirs !== null) { anyDirRestriction = true; flagDef.dirs.forEach(d => dirSet.add(d)) }
        if (flagDef.exts !== null) { anyExtRestriction = true; flagDef.exts.forEach(e => extSet.add(e)) }
      }

      if (anyDirRestriction) allowedDirs = dirSet
      if (anyExtRestriction) allowedExts = extSet
    }

    const collectLimit = activeFlags.length > 0 ? 150 : 50

    for (const skill of data.skills) {
      for (const [filePath, fileContent] of Object.entries(skill.files)) {
        const ext = '.' + getExt(filePath)
        if (!ALL_EXTS.includes(ext)) continue

        const flagOnlyMode = q.length < 2

        // Dir filter
        const dirParts = filePath.split('/')
        const topDir = dirParts.length > 1 ? dirParts[0] : null
        const isRoot = dirParts.length === 1

        if (!flagOnlyMode && allowedDirs !== null) {
          if (isRoot) continue
          if (!allowedDirs.has(topDir)) continue
        }
        if (!flagOnlyMode && allowedExts !== null && !allowedExts.has(ext)) continue

        const lines = fileContent.split('\n')

        // Priority zones
        const priorityLineSet = new Set()
        if (activeFlags.length > 0) {
          const ZONE_LINES = 50
          for (const flagName of activeFlags) {
            const tagName = flagName.replace(/^--/, '')
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes('@' + tagName)) {
                const zoneEnd = Math.min(lines.length - 1, i + ZONE_LINES)
                for (let j = i; j <= zoneEnd; j++) {
                  if (j > i && lines[j].includes('@') && !lines[j].includes('@' + tagName)) break
                  priorityLineSet.add(j)
                }
              }
            }
          }
        }

        for (let i = 0; i < lines.length; i++) {
          const inPriority = priorityLineSet.has(i)
          const isMatch = q.length >= 2
            ? lines[i].toLowerCase().includes(q)
            : inPriority

          if (isMatch) {
            results.push({
              skill: skill.name,
              file: filePath,
              line: i + 1,
              context: lines.slice(Math.max(0, i - 1), i + 2).join('\n'),
              match: lines[i].trim(),
              priority: activeFlags.length > 0 && inPriority
            })
            if (results.length >= collectLimit) break
          }
        }
        if (results.length >= collectLimit) break
      }
      if (results.length >= collectLimit) break
    }

    if (activeFlags.length > 0) {
      results.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
    }

    return results.slice(0, 50)
  }

  // ─── File tree builder ─────────────────────────────────────────────────────

  function buildFileTree(files) {
    const tree = []
    const dirs = {}

    for (const filePath of Object.keys(files)) {
      if (filePath === 'SKILL.md') continue
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

  // ─── FlowDocs class ───────────────────────────────────────────────────────

  class FlowDocsInstance {
    constructor(options) {
      this.container = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container

      if (!this.container) throw new Error('FlowDocs: container not found')

      this.onSave = options.onSave || null
      this.apiUrl = options.apiUrl || null  // Dynamic server mode
      this.data = null
      this.markedInstance = createMarked()
      this.currentSkill = null
      this.currentFilePath = null
      this.currentRawContent = ''
      this.editorMode = false
      this.searchTimeout = null

      this._injectCSS()
      this._buildDOM()
      this._bindEvents()

      if (this.apiUrl) {
        this._loadFromApi()
      } else if (options.dataUrl) {
        this.loadFromUrl(options.dataUrl)
      } else if (options.data) {
        this.loadData(options.data)
      }
    }

    // ─── CSS injection ─────────────────────────────────────────────────────

    _injectCSS() {
      // Load highlight.js CSS from CDN
      if (!document.querySelector('link[href*="highlight.js"][href*="github-dark"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        document.head.appendChild(link)
      }

      // Inject scoped CSS
      const style = document.createElement('style')
      style.textContent = CSS_TEXT
      document.head.appendChild(style)

      // Load highlight.js if not present
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
          // Load extra languages
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

    // ─── API mode (dynamic server) ────────────────────────────────────────

    async _loadFromApi() {
      try {
        const base = this.apiUrl.replace(/\/+$/, '')
        const res = await fetch(base)
        const data = await res.json()
        this.loadData(data)
      } catch (e) {
        console.error('FlowDocs: failed to load from API', e)
      }
    }

    async _saveViaApi(skillName, filePath, content) {
      const base = this.apiUrl.replace(/\/+$/, '')
      const res = await fetch(`${base}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: skillName, file: filePath, content })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error || 'Save failed')
      }
    }

    // ─── DOM structure ─────────────────────────────────────────────────────

    _buildDOM() {
      this.container.innerHTML = ''
      const root = document.createElement('div')
      root.className = 'flow-docs-root'
      root.innerHTML = `
        <!-- Sidebar -->
        <aside class="fd-sidebar">
          <div class="fd-sidebar-header">
            <div class="fd-logo">
              ${ICONS.book}
              <span>Flow-Docs</span>
            </div>
            <div class="fd-search-box">
              ${ICONS.search}
              <input type="text" class="fd-search-input" placeholder="Buscar... (usa --flag para filtrar)" autocomplete="off">
              <kbd>Ctrl+K</kbd>
              <div class="fd-flag-suggestions fd-hidden"></div>
            </div>
            <div class="fd-search-flags fd-hidden"></div>
          </div>
          <nav class="fd-skill-list"></nav>
        </aside>

        <!-- Main content -->
        <main class="fd-main">
          <div class="fd-content-area">
            <!-- Editor toolbar -->
            <div class="fd-editor-toolbar fd-hidden">
              <label class="fd-editor-switch" title="Activar modo editor">
                <input type="checkbox" class="fd-editor-toggle">
                <span class="fd-switch-track"><span class="fd-switch-thumb"></span></span>
                <span class="fd-switch-label">Editor</span>
              </label>
              <button class="fd-btn-save fd-hidden">
                ${ICONS.save} Guardar
              </button>
            </div>

            <div class="fd-welcome">
              <div class="fd-welcome-inner">
                ${ICONS.book}
                <h1>Flow-Docs</h1>
                <p>Selecciona un skill del sidebar para ver su documentación.</p>
                <p class="fd-hint">Usa <kbd>Ctrl+K</kbd> para buscar en todos los skills.</p>
              </div>
            </div>
            <div class="fd-skill-content fd-hidden"></div>
            <div class="fd-editor-area fd-hidden">
              <textarea class="fd-editor-textarea" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
            </div>
            <div class="fd-search-results fd-hidden"></div>
          </div>

          <!-- TOC -->
          <div class="fd-toc">
            <div class="fd-toc-resizer"></div>
            <div class="fd-toc-title">En esta página</div>
            <ul class="fd-toc-list"></ul>
          </div>
        </main>

        <!-- Toast -->
        <div class="fd-toast">
          ${ICONS.check}
          <span class="fd-toast-msg">Copiado</span>
        </div>
      `

      this.container.appendChild(root)
      this.root = root

      // Cache DOM references
      this.$ = {
        skillList: root.querySelector('.fd-skill-list'),
        searchInput: root.querySelector('.fd-search-input'),
        flagSuggestions: root.querySelector('.fd-flag-suggestions'),
        searchFlags: root.querySelector('.fd-search-flags'),
        welcome: root.querySelector('.fd-welcome'),
        skillContent: root.querySelector('.fd-skill-content'),
        searchResults: root.querySelector('.fd-search-results'),
        editorToolbar: root.querySelector('.fd-editor-toolbar'),
        editorToggle: root.querySelector('.fd-editor-toggle'),
        editorArea: root.querySelector('.fd-editor-area'),
        editorTextarea: root.querySelector('.fd-editor-textarea'),
        btnSave: root.querySelector('.fd-btn-save'),
        toc: root.querySelector('.fd-toc'),
        tocList: root.querySelector('.fd-toc-list'),
        tocResizer: root.querySelector('.fd-toc-resizer'),
        contentArea: root.querySelector('.fd-content-area'),
        toast: root.querySelector('.fd-toast'),
        toastMsg: root.querySelector('.fd-toast-msg'),
        main: root.querySelector('.fd-main'),
      }
    }

    // ─── Event binding ─────────────────────────────────────────────────────

    _bindEvents() {
      // Search
      this.$.searchInput.addEventListener('input', () => {
        clearTimeout(this.searchTimeout)
        const raw = this.$.searchInput.value.trim()
        const { flags, query } = this._parseSearchQuery(raw)

        this._updateFlagChips(flags)
        this._showFlagSuggestions()

        const hasSearch = query.length >= 2 || flags.length > 0
        if (!hasSearch) {
          if (this.currentSkill) this._loadSkill(this.currentSkill)
          else this._showPanel('welcome')
          return
        }
        this.searchTimeout = setTimeout(() => this._doSearch(raw), 250)
      })

      this.$.searchInput.addEventListener('blur', () => {
        setTimeout(() => this._hideFlagSuggestions(), 150)
      })

      // Keyboard
      this.root.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault()
          this.$.searchInput.focus()
          this.$.searchInput.select()
        }
        if (e.key === 'Escape') {
          if (document.activeElement === this.$.searchInput) {
            this.$.searchInput.value = ''
            this.$.searchInput.blur()
            if (this.currentSkill) this._loadSkill(this.currentSkill)
            else this._showPanel('welcome')
          }
        }
      })

      // Make root focusable for keyboard events
      this.root.setAttribute('tabindex', '-1')

      // Tree events (delegated)
      this.$.skillList.addEventListener('click', (e) => {
        const header = e.target.closest('.fd-tree-dir-header')
        if (header) {
          e.stopPropagation()
          const children = header.nextElementSibling
          const chevron = header.querySelector('.fd-tree-chevron')
          const open = header.dataset.open === 'true'
          header.dataset.open = !open
          children.classList.toggle('fd-hidden', open)
          if (chevron) chevron.style.transform = open ? '' : 'rotate(90deg)'
          return
        }

        const fileEl = e.target.closest('.fd-tree-file')
        if (fileEl) {
          e.stopPropagation()
          this._loadFile(fileEl.dataset.skill, fileEl.dataset.path)
        }
      })

      // Editor toggle
      this.$.editorToggle.addEventListener('change', (e) => {
        this._toggleEditorMode(e.target.checked)
      })

      this.$.btnSave.addEventListener('click', () => this._saveFile())

      this.$.editorTextarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
          e.preventDefault()
          this._saveFile()
        }
      })

      // Copy code (delegated)
      this.root.addEventListener('click', (e) => {
        const btn = e.target.closest('.fd-btn-copy')
        if (btn) {
          const code = btn.closest('.fd-code-block').querySelector('code')
          navigator.clipboard.writeText(code.innerText).then(() => this._showToast())
        }
      })

      // TOC resizer
      this._initTocResizer()
    }

    // ─── Data loading ──────────────────────────────────────────────────────

    async loadFromUrl(url) {
      const res = await fetch(url)
      const data = await res.json()
      this.loadData(data)
    }

    loadData(data) {
      this.data = data
      this._renderSkillList()
    }

    reload(data) {
      if (data) this.data = data
      this._renderSkillList()
      if (this.currentSkill) {
        this._loadSkill(this.currentSkill)
      }
    }

    // ─── Skill list ────────────────────────────────────────────────────────

    _renderSkillList() {
      if (!this.data || !this.data.skills.length) {
        this.$.skillList.innerHTML = `<div class="fd-empty-state">No se encontraron skills.</div>`
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
      if (!skill || !skill.files['SKILL.md']) return

      this.currentSkill = name

      this.root.querySelectorAll('.fd-skill-item').forEach(el => {
        el.classList.toggle('active', el.dataset.skill === name)
      })
      this.root.querySelectorAll('.fd-tree-file').forEach(el => el.classList.remove('active'))

      this.$.toc.classList.add('visible')

      if (this.editorMode) {
        this.$.editorToggle.checked = false
        this._toggleEditorMode(false)
      }

      this.currentFilePath = null
      const rawContent = skill.files['SKILL.md']
      this.currentRawContent = rawContent

      // Process markdown
      let content = resolveFileRefs(rawContent, skill.files)
      content = addHeadingIds(content)
      const html = this.markedInstance.parse(content)
      const sections = extractSections(rawContent)

      this._showPanel('skillContent')
      this.$.skillContent.innerHTML = html
      this._highlightCode()
      this._buildTOC(sections, name)

      if (section) {
        setTimeout(() => {
          const el = this.root.querySelector(`#${section}`) || this.root.querySelector(`[id="${section}"]`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      } else {
        this.$.contentArea.scrollTop = 0
      }

      // Build file tree
      this._buildSkillTree(skill)
    }

    // ─── Load file ─────────────────────────────────────────────────────────

    _loadFile(skillName, filePath) {
      const skill = this.data.skills.find(s => s.name === skillName)
      if (!skill) return

      const fileContent = skill.files[filePath]
      if (fileContent === undefined) return

      this.currentSkill = skillName
      this.currentFilePath = filePath
      this.currentRawContent = fileContent

      this.root.querySelectorAll('.fd-skill-item').forEach(el => {
        el.classList.toggle('active', el.dataset.skill === skillName)
      })
      this.root.querySelectorAll('.fd-tree-file').forEach(el => {
        el.classList.toggle('active', el.dataset.skill === skillName && el.dataset.path === filePath)
      })

      if (this.editorMode) {
        this.$.editorToggle.checked = false
        this._toggleEditorMode(false)
      }

      this._showPanel('skillContent')
      const ext = getExt(filePath)

      if (ext === 'md') {
        let mdContent = addHeadingIds(fileContent)
        const html = this.markedInstance.parse(mdContent)
        const sections = extractSections(fileContent)
        this.$.skillContent.innerHTML = html
        this._highlightCode()
        this._buildTOC(sections, skillName)
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
              <button class="fd-btn-copy" title="Copiar código">
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
      // Remove existing trees
      this.root.querySelectorAll('.fd-skill-tree').forEach(el => el.remove())

      const tree = buildFileTree(skill.files)
      if (!tree.length) return

      const skillItem = this.root.querySelector(`.fd-skill-item[data-skill="${escAttr(skill.name)}"]`)
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
          return `
            <div class="fd-tree-dir">
              <div class="fd-tree-dir-header" data-open="false">
                ${ICONS.chevron}
                ${ICONS.folder}
                <span>${escHtml(node.name)}</span>
                ${hasFiles ? `<span class="fd-tree-count">${countFiles(node.children)}</span>` : ''}
              </div>
              <div class="fd-tree-dir-children fd-hidden">
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

    _buildTOC(sections, skillName) {
      this.$.tocList.innerHTML = sections.map(s => `
        <li class="fd-toc-level-${s.level}">
          <a href="javascript:void(0)" data-section="${escAttr(s.id)}">${escHtml(s.title)}</a>
        </li>
      `).join('')

      this.$.tocList.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', (e) => {
          e.preventDefault()
          const id = a.dataset.section
          const el = this.root.querySelector(`#${id}`) || this.root.querySelector(`[id="${id}"]`)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      })
    }

    // ─── Search ────────────────────────────────────────────────────────────

    _parseSearchQuery(raw) {
      const tokens = raw.trim().split(/\s+/).filter(Boolean)
      const flags = tokens.filter(t => t.startsWith('--') && t.length > 2)
      const query = tokens.filter(t => !t.startsWith('--')).join(' ').trim()
      return { flags, query }
    }

    _updateFlagChips(activeFlags) {
      const container = this.$.searchFlags
      if (!activeFlags.length) {
        container.classList.add('fd-hidden')
        container.innerHTML = ''
        return
      }
      container.classList.remove('fd-hidden')
      const allFlags = (this.data && this.data.flags) || []
      container.innerHTML = activeFlags.map(flag => {
        const def = allFlags.find(f => f.flag === flag)
        return `<span class="fd-flag-chip">${escHtml(def ? def.label : flag)}</span>`
      }).join('')
    }

    _showFlagSuggestions() {
      const inputEl = this.$.searchInput
      const val = inputEl.value
      const cursorPos = inputEl.selectionStart
      const textBeforeCursor = val.slice(0, cursorPos)
      const lastSpaceIdx = textBeforeCursor.lastIndexOf(' ')
      const currentWord = textBeforeCursor.slice(lastSpaceIdx + 1)

      if (!currentWord.startsWith('--') || currentWord.length < 2 || !this.data) {
        this._hideFlagSuggestions()
        return
      }

      const matches = (this.data.flags || []).filter(f => f.flag.startsWith(currentWord) && f.flag !== currentWord)
      if (!matches.length) { this._hideFlagSuggestions(); return }

      const dropdown = this.$.flagSuggestions
      dropdown.innerHTML = matches.map(f => `
        <div class="fd-flag-suggestion" data-flag="${escAttr(f.flag)}">
          <code>${escHtml(f.flag)}</code>
          <span>${escHtml(f.label)}</span>
        </div>
      `).join('')
      dropdown.classList.remove('fd-hidden')

      dropdown.querySelectorAll('.fd-flag-suggestion').forEach(el => {
        el.addEventListener('mousedown', (ev) => {
          ev.preventDefault()
          const flag = el.dataset.flag
          const before = val.slice(0, lastSpaceIdx + 1)
          const after = val.slice(cursorPos).trimStart()
          inputEl.value = (before + flag + ' ' + after).trimStart()
          inputEl.dispatchEvent(new Event('input'))
          inputEl.focus()
          this._hideFlagSuggestions()
        })
      })
    }

    _hideFlagSuggestions() {
      this.$.flagSuggestions.classList.add('fd-hidden')
    }

    _doSearch(rawQuery) {
      const { flags, query } = this._parseSearchQuery(rawQuery)
      if (query.length < 2 && !flags.length) return

      const results = searchSkills(this.data, query, flags)

      this._showPanel('searchResults')
      this._hideFlagSuggestions()

      const allFlags = (this.data && this.data.flags) || []
      const flagBadges = flags.map(f => {
        const def = allFlags.find(af => af.flag === f)
        return `<span class="fd-flag-chip">${escHtml(def ? def.label : f)}</span>`
      }).join('')

      if (results.length === 0) {
        this.$.searchResults.innerHTML = `<div class="fd-search-empty">Sin resultados para "<strong>${escHtml(query)}</strong>"${flagBadges ? `<span class="fd-search-filter-badges">${flagBadges}</span>` : ''}</div>`
        return
      }

      const highlighted = (text) => {
        if (!query) return escHtml(text)
        const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
        return escHtml(text).replace(re, '<mark>$1</mark>')
      }

      const renderResult = (r) => `
        <div class="fd-search-result${r.priority ? ' priority' : ''}" data-skill="${escAttr(r.skill)}" data-file="${escAttr(r.file)}">
          <div class="fd-search-result-meta">
            <span class="fd-tag">${escHtml(r.skill)}</span>
            <span class="fd-file-path">${escHtml(r.file)}:${r.line}</span>
            ${r.priority ? `<span class="fd-priority-badge">★ destacado</span>` : ''}
          </div>
          <div class="fd-search-result-match">${highlighted(r.match)}</div>
          <div class="fd-search-result-context">${highlighted(r.context)}</div>
        </div>`

      const priorityResults = results.filter(r => r.priority)
      const normalResults = results.filter(r => !r.priority)

      let resultsHtml = priorityResults.map(renderResult).join('')
      if (priorityResults.length > 0 && normalResults.length > 0) {
        resultsHtml += `<div class="fd-search-divider">Otros resultados</div>`
      }
      resultsHtml += normalResults.map(renderResult).join('')

      this.$.searchResults.innerHTML = `
        <div class="fd-search-header">
          ${results.length} resultado${results.length !== 1 ? 's' : ''} para "<strong>${escHtml(query)}</strong>"
          ${flagBadges ? `<span class="fd-search-filter-badges">${flagBadges}</span>` : ''}
        </div>
        ${resultsHtml}
      `

      this.$.searchResults.querySelectorAll('.fd-search-result').forEach(el => {
        el.addEventListener('click', () => {
          this.$.searchInput.value = ''
          this._updateFlagChips([])
          this._loadFile(el.dataset.skill, el.dataset.file)
        })
      })

      this.$.toc.classList.remove('visible')
    }

    // ─── Editor ────────────────────────────────────────────────────────────

    _toggleEditorMode(active) {
      this.editorMode = active
      if (active) {
        this.$.editorTextarea.value = this.currentRawContent
        this.$.skillContent.classList.add('fd-hidden')
        this.$.editorArea.classList.remove('fd-hidden')
        this.$.btnSave.classList.remove('fd-hidden')
        this.$.contentArea.classList.add('editor-mode-active')
        this.$.editorTextarea.focus()
      } else {
        this.$.editorArea.classList.add('fd-hidden')
        this.$.skillContent.classList.remove('fd-hidden')
        this.$.btnSave.classList.add('fd-hidden')
        this.$.contentArea.classList.remove('editor-mode-active')
      }
    }

    async _saveFile() {
      if (!this.currentSkill) return
      const content = this.$.editorTextarea.value
      const filePath = this.currentFilePath || 'SKILL.md'
      const btn = this.$.btnSave
      btn.disabled = true

      try {
        // Update in-memory data
        const skill = this.data.skills.find(s => s.name === this.currentSkill)
        if (skill) {
          skill.files[filePath] = content
          // Update description if SKILL.md changed
          if (filePath === 'SKILL.md') {
            const lines = content.split('\n').slice(0, 5)
            for (const line of lines) {
              const m = line.match(/^#\s+(.+)/)
              if (m) { skill.description = m[1].trim(); break }
            }
          }
        }

        this.currentRawContent = content
        this.$.editorToggle.checked = false
        this._toggleEditorMode(false)

        // Re-render
        if (this.currentFilePath) {
          this._loadFile(this.currentSkill, this.currentFilePath)
        } else {
          this._loadSkill(this.currentSkill)
        }

        // Save: API mode, callback, or just in-memory
        if (this.apiUrl) {
          await this._saveViaApi(this.currentSkill, filePath, content)
        }
        if (this.onSave) {
          await this.onSave(this.currentSkill, filePath, content)
        }

        this._showToast('Guardado')
      } catch (e) {
        this._showToast('Error: ' + e.message)
      } finally {
        btn.disabled = false
      }
    }

    // ─── UI helpers ────────────────────────────────────────────────────────

    _showPanel(id) {
      const panels = { welcome: this.$.welcome, skillContent: this.$.skillContent, searchResults: this.$.searchResults }
      for (const [key, el] of Object.entries(panels)) {
        el.classList.toggle('fd-hidden', key !== id)
      }
      this.$.editorArea.classList.add('fd-hidden')
      this.$.editorToolbar.classList.toggle('fd-hidden', id !== 'skillContent')
    }

    _showToast(msg) {
      this.$.toastMsg.textContent = msg || 'Copiado'
      this.$.toast.classList.add('show')
      setTimeout(() => this.$.toast.classList.remove('show'), 1800)
    }

    _highlightCode() {
      if (!window.hljs) return
      this.root.querySelectorAll('pre code').forEach(el => {
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

  const FlowDocs = {
    init(options) {
      return new FlowDocsInstance(options)
    }
  }

  // Export for both module and script tag usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowDocs
  }
  window.FlowDocs = FlowDocs

})()
