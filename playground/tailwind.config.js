/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  safelist: [
    'border-gray-400/5',
    'hover:bg-[var(--vscode-editor-selectionBackground)]',
  ],
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}', './node_modules/vue-renderer-markdown/dist/tailwind.ts'],
  theme: {
    extend: {
    },
  },
  plugins: [],
}
