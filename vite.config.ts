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
        safeList: ['rotate-90'],
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
        external: (id: string) => {
          // Only treat the actual 'mermaid' package (bare import or node_modules path)
          // as external. The previous regex matched any path segment named `mermaid`,
          // which accidentally externalized local files like
          // './components/MermaidBlockNode/mermaid'. That left runtime imports
          // to non-emitted local modules in the final bundle.
          if (id === 'mermaid' || id.startsWith('mermaid/'))
            return true
          // also match resolved node_modules paths that include /node_modules/mermaid
          if (/node_modules\/mermaid(?:\/|$)/.test(id))
            return true
          return [
            'vue',
            '@iconify/vue',
            '@lezer/highlight',
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
            'vue-i18n',
            'katex',
            'vue-use-monaco',
            'monaco-editor',
          ].includes(id)
        },
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
    worker: {
      // Ensure web workers are bundled as ESM; IIFE/UMD are invalid with code-splitting
      format: 'es',
      // Externalize mermaid in worker bundling as well (treat mermaid and mermaid/* as external)
      rollupOptions: {
        external: (id: string) => /(?:^|\/)mermaid(?:\/|$)/.test(id),
      },
    },
    css: {
      postcss: './postcss.config.cjs',
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})
