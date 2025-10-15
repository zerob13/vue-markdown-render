import Vue from '@vitejs/plugin-vue'
/// <reference types="vitest" />

import UnpluginClassExtractor from 'unplugin-class-extractor/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { name } from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use an empty base for library (npm) builds so emitted asset URLs are relative.
  // If base is '/', Vite will emit absolute '/assets/...' paths which can break
  // consumers that bundle this package. Leaving base empty lets the consumer
  // resolve assets correctly during their build.
  const base = mode === 'npm' ? '' : '/'
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
      minify: true,
      lib: {
        entry: './src/exports.ts',
        formats: ['cjs', 'es'],
        name,
        fileName: 'index',
      },
      rollupOptions: {
        external: (id: string) => {
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
            'markdown-it-sub',
            'markdown-it-sup',
            'markdown-it-task-checkbox',
            'vue-i18n',
            'katex',
            'vue-use-monaco',
            'monaco-editor',
            'shiki',
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
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup/vitest.setup.ts'],
      restoreMocks: true,
    },
    worker: {
      // Ensure web workers are bundled as ESM; IIFE/UMD are invalid with code-splitting
      format: 'es',
      // Externalize mermaid in worker bundling as well (treat mermaid and mermaid/* as external)
      rollupOptions: {
        external: (id: string) => /(?:^|\/)(?:mermaid|katex)(?:\/|$)/.test(id),
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
