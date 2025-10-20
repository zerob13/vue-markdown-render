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
      // emit assets at dist root (no assets/ folder)
      assetsDir: '',
      copyPublicDir: false,
      // Use Vite's default minifier (esbuild) to avoid adding an external terser dependency
      minify: true,
      sourcemap: false,
      lib: {
        entry: './src/exports.ts',
        // produce both ESM and CJS builds
        formats: ['es', 'cjs'],
        name,
        fileName: (format: string) => (format === 'cjs' ? 'index.cjs' : 'index'),
      },
      rollupOptions: {
        // add worker files as explicit entry points so Rollup emits them deterministically
        input: {
          'index': './src/exports.ts',
          'workers/katexRenderer.worker': './src/workers/katexRenderer.worker.ts',
          'workers/mermaidParser.worker': './src/workers/mermaidParser.worker.ts',
        },
        external: (id: string) => {
          if (id === 'mermaid' || id.startsWith('mermaid/'))
            return true
          // also match resolved node_modules paths that include /node_modules/mermaid
          if (/node_modules\/mermaid(?:\/|$)/.test(id))
            return true
          return [
            'vue',
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
        // Use Rollup output naming to place worker bundles into dist/workers
        output: {
          globals: {
            vue: 'Vue',
          },
          exports: 'named',
          // Emit deterministic names: entries use their input key as [name]
          // We declared worker input keys as 'workers/...', so they will be emitted into workers/
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: (assetInfo: any) => {
            try {
              const fname = (assetInfo && ((assetInfo as any).name || (assetInfo as any).fileName || '')) as string
              if (fname && fname.endsWith('.css'))
                return 'index.css'
            }
            catch {}
            return '[name][extname]'
          },
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
