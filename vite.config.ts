/// <reference types="vitest" />

import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import dts from 'vite-plugin-dts'
import UnpluginClassExtractor from 'unplugin-class-extractor/vite'
import { name } from './package.json'
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const base = '/'
  let plugins = [
    Vue(),
    Components(),
  ]

  let build: Record<string, any> = {
    target: 'es2015',
    cssTarget: 'chrome61',
  }

  if (mode === 'npm') {
    plugins = [
      Vue(),
      dts({
        outDir: 'dist/types',
      }),
      UnpluginClassExtractor({
        output: 'dist/tailwind.ts',
        include: ['src/components/**/*.vue'],
      }),
    ]
    build = {
      target: 'es2015',
      cssTarget: 'chrome61',
      copyPublicDir: false,
      lib: {
        entry: './src/exports.ts',
        formats: ['cjs', 'es'],
        name,
        fileName: 'index',
      },
      rollupOptions: {
        external: ['vue', '@iconify/vue', '@vueuse/core', 'class-variance-authority', 'clsx', 'markdown-it', 'markdown-it-container', 'markdown-it-emoji', 'markdown-it-footnote', 'markdown-it-ins', 'markdown-it-mark', 'markdown-it-mathjax3', 'markdown-it-sub', 'markdown-it-sup', 'markdown-it-task-checkbox', 'mermaid', 'radix-vue', 'tailwind-merge', 'uuid', 'vue-i18n', 'katex', 'shiki', '@shikijs/monaco', 'monaco-editor'],
        input: {
          utils: './src/exports.ts',
          components: './src/components.ts',
        },
        output: [
          {
            format: 'es',
            entryFileNames: (chunkInfo) => {
              if (chunkInfo.name === 'utils')
                return 'utils.js'
              return 'components/[name].js'
            },
            dir: 'dist/es',
            globals: { vue: 'Vue' },
            exports: 'named',
          },
          {
            format: 'cjs',
            entryFileNames: (chunkInfo) => {
              if (chunkInfo.name === 'utils')
                return 'utils.cjs'
              return 'components/[name].cjs'
            },
            dir: 'dist/cjs',
            globals: { vue: 'Vue' },
            exports: 'named',
          },
        ],
      },
    }
  }

  return {
    base,
    plugins,
    build,
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})
