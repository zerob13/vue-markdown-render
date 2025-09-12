#!/usr/bin/env node
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')

// Locate the package.json of the project that is installing this package.
// npm/yarn/pnpm set INIT_CWD to the consumer's project root during install.
const consumerRoot = process.env.INIT_CWD || process.cwd()

function readPkg(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  }
  catch {
    return null
  }
}

const myPkg = readPkg(path.join(__dirname, '..', 'package.json')) || {}
const peerDeps = myPkg.peerDependencies || {}

if (!peerDeps || Object.keys(peerDeps).length === 0) {
  process.exit(0)
}

const consumerPkgPath = path.join(consumerRoot, 'package.json')
const consumerPkg = readPkg(consumerPkgPath) || {}

const missing = []
const installed = Object.assign({}, consumerPkg.dependencies, consumerPkg.devDependencies)

for (const name of Object.keys(peerDeps)) {
  if (!installed || !installed[name]) {
    missing.push(`${name}@"${peerDeps[name]}"`)
  }
}

if (missing.length === 0) {
  console.log('All peerDependencies are satisfied.')
  process.exit(0)
}

const pkgManager = detectPackageManager(process.env.npm_config_user_agent || '')
const installCmd = buildInstallCmd(pkgManager, missing)

console.log('------------------------------------------------------------')
console.log('Missing peerDependencies for vue-renderer-markdown:')
missing.forEach(m => console.log('  -', m))
console.log('')
console.log('Suggested command to install them in the consumer project:')
console.log('  ', installCmd)
console.log('------------------------------------------------------------')

// Respect environment variable to auto-install when explicitly allowed
if (process.env.VUE_RENDERER_MARKDOWN_AUTO_INSTALL === '1') {
  try {
    console.log('Auto-installing missing peerDependencies...')
    execSync(installCmd, { stdio: 'inherit', cwd: consumerRoot })
    console.log('Auto-install completed.')
  }
  catch (e) {
    console.error('Auto-install failed:', e.message)
    process.exit(1)
  }
}

function detectPackageManager(userAgent) {
  if (userAgent.includes('pnpm'))
    return 'pnpm'
  if (userAgent.includes('yarn'))
    return 'yarn'
  if (userAgent.includes('npm'))
    return 'npm'
  // fallback to npm
  return 'npm'
}

function buildInstallCmd(pkgManager, pkgs) {
  if (pkgManager === 'pnpm')
    return `pnpm add -D ${pkgs.join(' ')}`
  if (pkgManager === 'yarn')
    return `yarn add -D ${pkgs.join(' ')}`
  return `npm install -D ${pkgs.join(' ')}`
}
