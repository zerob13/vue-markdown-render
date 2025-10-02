const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')

const dir = path.resolve(__dirname, '..', 'dist', 'types')
if (fs.existsSync(dir)) {
  try {
    fs.rmSync(dir, { recursive: true, force: true })
    console.log('Removed', dir)
  }
  catch (e) {
    console.error('Failed to remove', dir, e)
    process.exit(1)
  }
}
else {
  // nothing to do
}
