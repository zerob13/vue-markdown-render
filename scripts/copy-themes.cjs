#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src/themes')
const destDir = path.join(root, 'dist/themes')

if (!fs.existsSync(srcDir))
  process.exit(0)

const ensureDir = (dir) => {
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true })
}

const copyCssFiles = (from, to) => {
  ensureDir(to)
  const entries = fs.readdirSync(from, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name)
    const destPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyCssFiles(srcPath, destPath)
      continue
    }
    if (!entry.name.endsWith('.css'))
      continue
    ensureDir(path.dirname(destPath))
    fs.copyFileSync(srcPath, destPath)
  }
}

copyCssFiles(srcDir, destDir)
