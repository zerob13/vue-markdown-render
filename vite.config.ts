import Vue from '@vitejs/plugin-vue'
/// <reference types="vitest" />

import UnpluginClassExtractor from 'unplugin-class-extractor/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { name } from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const base = '/'
  let plugins = [Vue(), Components()]

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
        include: [/\/src\/components\/(?:[^/]+\/)*[^/]+\.vue(\?.*)?$/],
      }) as any,
    ]
    build = {
      target: 'es2015',
      cssTarget: 'chrome61',
      copyPublicDir: false,
      minify: false,
      lib: {
        entry: './src/exports.ts',
        formats: ['cjs', 'es'],
        name,
        fileName: 'index',
      },
      rollupOptions: {
        external: [
          'vue',
          '@iconify/vue',
          '@lezer/highlight',
          '@vueuse/core',
          'class-variance-authority',
          'clsx',
          'markdown-it',
          'markdown-it-container',
          'markdown-it-emoji',
          'markdown-it-footnote',
          'markdown-it-ins',
          'markdown-it-mark',
          'markdown-it-mathjax3',
          'markdown-it-sub',
          'markdown-it-sup',
          'markdown-it-task-checkbox',
          'mermaid',
          'radix-vue',
          'tailwind-merge',
          'vue-i18n',
          'katex',
          'vue-use-monaco',
          'monaco-editor',
        ],
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
    css: {
      postcss: mode === 'npm' ? './postcss.config.cjs' : undefined,
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})
