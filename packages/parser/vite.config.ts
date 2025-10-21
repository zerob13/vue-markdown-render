import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js'],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueMarkdownRendererParser',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['markdown-it', 'markdown-it-container'],
      output: {
        preserveModules: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  plugins: [
    dts({
      // Emit bundled declaration file directly into `dist` to avoid a nested `types/` folder
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
      // Let the plugin rollup the type declarations so we don't need a separate rollup step
      rollupTypes: true,
    }),
  ],
})
