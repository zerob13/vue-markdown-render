#!/usr/bin/env node

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  }
  catch {
    return null
  }
}

function detectPM() {
  const ua = process.env.npm_config_user_agent || ''
  if (ua.includes('pnpm'))
    return 'pnpm'
  if (ua.includes('yarn'))
    return 'yarn'
  return 'npm'
}

function resolveFrom(name, fromDir) {
  try {
    require.resolve(name, { paths: [fromDir] })
    return true
  }
  catch {
    return false
  }
}

(function main() {
  const pkgRoot = path.resolve(__dirname, '..')
  const pkg = readJSON(path.join(pkgRoot, 'package.json'))
  if (!pkg || !pkg.peerDependencies)
    return

  // consumer 项目根目录（包管理器通常会设置 INIT_CWD）
  const consumerCwd = process.env.INIT_CWD || process.cwd()
  const consumerPkg = readJSON(path.join(consumerCwd, 'package.json'))

  const peerDeps = pkg.peerDependencies
  const missing = []

  for (const [dep, range] of Object.entries(peerDeps)) {
    let declared = false
    if (consumerPkg) {
      const sections = [
        consumerPkg.dependencies,
        consumerPkg.devDependencies,
        consumerPkg.optionalDependencies,
        consumerPkg.peerDependencies,
      ].filter(Boolean)
      declared = sections.some(s => Object.prototype.hasOwnProperty.call(s, dep))
    }

    const present = declared || resolveFrom(dep, consumerCwd)
    if (!present)
      missing.push({ dep, range })
  }

  if (missing.length === 0)
    return

  const pm = detectPM()
  const pkgs = missing.map(m => m.dep) // 建议不带版本，避免 shell 转义问题
  const installCmd
    = pm === 'pnpm'
      ? `pnpm add ${pkgs.join(' ')}`
      : pm === 'yarn'
        ? `yarn add ${pkgs.join(' ')}`
        : `npm install ${pkgs.join(' ')}`

  const header = `\n${'-'.repeat(60)}`
  console.log(`${header}
Missing peerDependencies for ${pkg.name}:
${missing.map(m => `  - ${m.dep} (required: ${m.range})`).join('\n')}

Suggested command:
  ${installCmd}
Set VUE_RENDERER_MARKDOWN_AUTO_INSTALL=1 to auto-install.
${'-'.repeat(60)}\n`)

  if (process.env.VUE_RENDERER_MARKDOWN_AUTO_INSTALL === '1') {
    try {
      const result = spawnSync(installCmd, {
        cwd: consumerCwd,
        stdio: 'inherit',
        shell: true,
      })
      if (result.status !== 0) {
        console.warn('[vue-renderer-markdown] auto-install failed, please install manually.')
      }
    }
    catch (e) {
      console.warn('[vue-renderer-markdown] auto-install error:', e && e.message)
    }
  }
})()
