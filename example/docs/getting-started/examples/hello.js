// <!-- @ejemplo -->
// Simple FlowDocs initialization example

document.addEventListener('DOMContentLoaded', () => {
  const docs = FlowDocs.init({
    container: '#my-docs',
    dataUrl: './flow-docs-data.json',
    onSave: (skill, file, content) => {
      console.log(`Saved ${skill}/${file}`)
      // POST to your API here
    }
  })
})
