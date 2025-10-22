import dts from 'rollup-plugin-dts'

// Bundle the generated declaration entry into a single dist/index.d.ts.
// Treat workspace deps as external so we don't try to resolve them during
// bundling (the consumer will have their own types for those packages).
export default [
  {
    // Vite emits declarations under dist/types
    input: './dist/types/exports.d.ts',
    plugins: [
      dts({
        // Leave external type imports in place
        respectExternal: true,
      }),
    ],
    external: [
      /^(?:stream-markdown-parser)(?:\/.*)?$/,
    ],
    output: [
      {
        file: 'dist/index.d.ts',
        format: 'es',
      },
    ],
  },
]
