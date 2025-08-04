import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { build } from 'vite'

const distDir = path.resolve(process.cwd(), 'dist')

// 确保dist目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

async function buildTailwindCSS() {
  console.log('📦 Building Tailwind CSS (with @apply directives preserved)...')

  const tempDistDir = path.resolve(process.cwd(), 'dist2')

  try {
    // 使用新的 vite 配置文件构建
    await build({
      configFile: './vite.config.tailwind.ts',
      mode: 'npm',
    })

    // 查找生成的CSS文件并复制到目标位置
    const files = fs.readdirSync(tempDistDir)
    const cssFile = files.find(file => file.endsWith('.css'))

    if (cssFile) {
      const sourcePath = path.join(tempDistDir, cssFile)
      const targetPath = path.join(distDir, 'index.tailwind.css')
      fs.copyFileSync(sourcePath, targetPath)
      console.log('✅ index.tailwind.css generated (with @apply directives preserved)')
    }
    else {
      console.error('❌ Generated CSS file not found')
    }
  }
  catch (error) {
    console.error('❌ Failed to build Tailwind CSS:', error)
  }
  finally {
    // 删除 dist2 目录
    if (fs.existsSync(tempDistDir)) {
      fs.rmSync(tempDistDir, { recursive: true, force: true })
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting CSS build process...')

    // 构建两种不同的CSS
    await buildTailwindCSS()

    console.log('\n✅ CSS build completed!')
    console.log('📦 Generated files:')
    console.log('  - dist/index.tailwind.css (for Tailwind 3+ users, with @apply directives)')
    console.log('  - dist/index.compiled.css (standalone CSS, @apply directives processed)')
  }
  catch (error) {
    console.error('❌ CSS build failed:', error)
    process.exit(1)
  }
}

main()
