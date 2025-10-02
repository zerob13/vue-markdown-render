import dts from 'rollup-plugin-dts'

export default [
  {
    input: './dist/types/exports.d.ts',
    plugins: [dts()],
    output: [
      {
        file: 'dist/index.d.ts',
        format: 'es',
      },
    ],
  },
]
