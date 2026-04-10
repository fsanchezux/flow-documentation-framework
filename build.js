const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

// CSS loader plugin — imports CSS files as string constants
const cssPlugin = {
  name: 'css-text',
  setup(build) {
    build.onResolve({ filter: /\.css$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path),
      namespace: 'css-text',
    }))
    build.onLoad({ filter: /.*/, namespace: 'css-text' }, async (args) => ({
      contents: `export default ${JSON.stringify(fs.readFileSync(args.path, 'utf-8'))}`,
      loader: 'js',
    }))
  },
}

esbuild.build({
  entryPoints: ['src/flow-docs.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/flow-docs.min.js',
  format: 'iife',
  globalName: 'FlowDocsModule',
  target: ['es2018'],
  plugins: [cssPlugin],
}).then(() => {
  const size = fs.statSync('dist/flow-docs.min.js').size
  console.log(`Built dist/flow-docs.min.js (${(size / 1024).toFixed(1)} KB)`)
}).catch(() => process.exit(1))

// Also build unminified version
esbuild.build({
  entryPoints: ['src/flow-docs.js'],
  bundle: true,
  minify: false,
  outfile: 'dist/flow-docs.js',
  format: 'iife',
  globalName: 'FlowDocsModule',
  target: ['es2018'],
  plugins: [cssPlugin],
}).then(() => {
  const size = fs.statSync('dist/flow-docs.js').size
  console.log(`Built dist/flow-docs.js (${(size / 1024).toFixed(1)} KB)`)
}).catch(() => process.exit(1))
