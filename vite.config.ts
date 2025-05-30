/// <reference types="vitest" />

import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import Components from 'unplugin-vue-components/vite'
import dts from 'vite-plugin-dts'
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
        external: ['vue', '@codemirror/state', '@iconify/vue', '@lezer/highlight', '@uiw/codemirror-extensions-langs', '@uiw/codemirror-themes', '@vueuse/core', 'class-variance-authority', 'clsx', 'codemirror', 'codemirror-lang-glsl', 'codemirror-lang-makefile', 'codemirror-lang-terraform', 'markdown-it', 'markdown-it-container', 'markdown-it-emoji', 'markdown-it-footnote', 'markdown-it-ins', 'markdown-it-mark', 'markdown-it-mathjax3', 'markdown-it-sub', 'markdown-it-sup', 'markdown-it-task-checkbox', 'mermaid', 'radix-vue', 'tailwind-merge', 'uuid', 'vue-i18n', 'katex'],
        output: {
          globals: {
            vue: 'Vue',
          },
          exports: 'named',
        },
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
