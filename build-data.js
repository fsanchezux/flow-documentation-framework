const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Load .env if present
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') })
} catch {
  // dotenv not installed, will use env vars directly
}

const TOKEN = process.env.GITHUB_TOKEN
const CONFIG_FILE = path.join(__dirname, 'flow-docs.config.json')
const OUTPUT_FILE = path.join(__dirname, 'flow-docs-data.json')

const BANNER = `
FlowDocs \u2014 Private Repo Builder
================================
`

// ── Interactive prompt ──────────────────────────────────────────────────────

function ask(rl, question, defaultVal) {
  return new Promise((resolve) => {
    const suffix = defaultVal ? ` (${defaultVal})` : ''
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal || '')
    })
  })
}

// ── GitHub API helpers ──────────────────────────────────────────────────────

function githubHeaders() {
  if (!TOKEN) {
    console.error('\n\u274c  GITHUB_TOKEN is not set.')
    console.error('   Create a .env file with: GITHUB_TOKEN=ghp_xxx')
    console.error('   See instructions above.')
    process.exit(1)
  }
  return {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `token ${TOKEN}`,
  }
}

async function githubFetch(url) {
  const res = await fetch(url, { headers: githubHeaders() })
  if (res.status === 401) {
    console.error('\n\u274c  Invalid GITHUB_TOKEN. Please check your .env file.')
    console.error('   Generate a new token: https://github.com/settings/tokens')
    process.exit(1)
  }
  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// ── Main logic ──────────────────────────────────────────────────────────────

async function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
    } catch {
      return null
    }
  }
  return null
}

async function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8')
}

async function main() {
  console.log(BANNER)

  // Check token
  if (!TOKEN) {
    console.log('\u26a0  No GITHUB_TOKEN found in environment or .env file.')
    console.log('')
    console.log('  How to get a token:')
    console.log('  1. Go to: https://github.com/settings/tokens')
    console.log('  2. Click "Generate new token (classic)"')
    console.log('  3. Give it a name like "FlowDocs Builder"')
    console.log('  4. Check the "repo" scope')
    console.log('  5. Click "Generate token" and copy it')
    console.log('')
    console.log('  Then create a .env file in this directory:')
    console.log('  GITHUB_TOKEN=ghp_your_token_here')
    console.log('')
    process.exit(1)
  }

  console.log('\u2705  GITHUB_TOKEN loaded\n')

  // Load or create config
  let config = await loadConfig()
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  if (config) {
    console.log(`Using saved config: ${CONFIG_FILE}`)
    config.owner = await ask(rl, 'Owner', config.owner)
    config.repo = await ask(rl, 'Repo', config.repo)
    config.branch = await ask(rl, 'Branch', config.branch || 'main')
  } else {
    config = {
      owner: await ask(rl, 'Owner'),
      repo: await ask(rl, 'Repo'),
      branch: await ask(rl, 'Branch', 'main'),
    }
  }

  rl.close()

  if (!config.owner || !config.repo) {
    console.error('\n\u274c  Owner and repo are required.')
    process.exit(1)
  }

  // Save config for next time
  await saveConfig(config)

  const { owner, repo, branch } = config
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`

  console.log(`\nScanning ${owner}/${repo} (${branch})...`)

  // Fetch tree
  const treeData = await githubFetch(`${baseUrl}/git/trees/${branch}?recursive=1`)
  if (!treeData) {
    console.error(`\n\u274c  Repository or branch not found: ${owner}/${repo} (${branch})`)
    process.exit(1)
  }

  const files = treeData.tree.filter(item => item.type === 'blob')
  if (files.length === 0) {
    console.error('\n\u274c  No files found in repository.')
    process.exit(1)
  }

  // Find skill directories (dirs containing SKILL.md)
  const skillDirs = new Set()
  for (const f of files) {
    const parts = f.path.split('/')
    if (parts.length > 1 && parts[parts.length - 1] === 'SKILL.md') {
      skillDirs.add(parts[0])
    }
  }

  // Check root files
  const rootSkillMd = files.find(f => f.path === 'SKILL.md')
  const rootHomeMd = files.find(f => f.path === 'home.md')

  console.log(`\u2713  Found ${files.length} files`)
  console.log(`\u2713  Found ${skillDirs.size} skill(s): ${[...skillDirs].join(', ') || '(none)'}${rootSkillMd ? ' + root SKILL.md' : ''}`)

  // Build skills
  const skills = []

  if (rootSkillMd) {
    const rootSkill = { name: repo, description: '', files: {} }
    for (const f of files) {
      if (f.path.split('/').length === 1) {
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
    if (rootSkillMd && f.path.split('/').length === 1) return true
    for (const dir of skillDirs) {
      if (f.path.startsWith(dir + '/')) return true
    }
    return false
  })

  let downloaded = 0
  console.log(`\nDownloading ${allFiles.length} files...`)

  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (f) => {
      try {
        const data = await githubFetch(f.url)
        if (data && data.content) {
          return { path: f.path, content: Buffer.from(data.content, 'base64').toString('utf-8') }
        }
        return { path: f.path, content: '' }
      } catch {
        return { path: f.path, content: '' }
      }
    })
    const results = await Promise.all(promises)
    for (const r of results) {
      const parts = r.path.split('/')
      if (parts.length === 1) {
        const skill = skills.find(s => s.name === repo)
        if (skill) skill.files[r.path] = r.content
      } else {
        const dir = parts[0]
        const skill = skills.find(s => s.name === dir)
        if (skill) {
          const relPath = parts.slice(1).join('/')
          skill.files[relPath] = r.content
        }
      }
    }
    downloaded += results.length
    process.stdout.write(`\r  Downloaded ${downloaded}/${allFiles.length} files`)
  }
  console.log('')

  // Extract descriptions
  for (const skill of skills) {
    const skillMd = skill.files['SKILL.md']
    if (skillMd) {
      const firstLine = skillMd.split('\n')[0]
      const m = firstLine.match(/^#\s+(.+)/)
      if (m) skill.description = m[1].trim()
    }
  }

  // Extract home page
  let homePage = null
  if (rootHomeMd) {
    homePage = rootHomeMd.content
  }
  // Also check in skills
  if (!homePage) {
    for (const skill of skills) {
      if (skill.files['home.md']) {
        homePage = skill.files['home.md']
        break
      }
    }
  }

  // Build output
  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    skills,
    flags: [],
    homePage,
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8')

  const size = fs.statSync(OUTPUT_FILE).size
  console.log(`\n\u2705  Generated: ${OUTPUT_FILE} (${(size / 1024).toFixed(1)} KB)`)
  console.log(`\n  Use it in your HTML:`)
  console.log(`  <script src="flow-docs.min.js"></script>`)
  console.log(`  <script>`)
  console.log(`    FlowDocs.init({`)
  console.log(`      container: '#docs',`)
  console.log(`      dataUrl: './flow-docs-data.json'`)
  console.log(`    })`)
  console.log(`  </script>`)
  console.log('')
}

main().catch((err) => {
  console.error('\n\u274c  Error:', err.message)
  process.exit(1)
})
