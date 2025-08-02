# vue-renderer-markdown

> A Vue 3 component that renders Markdown string content as HTML, supporting custom components and advanced markdown features.

[![NPM version](https://img.shields.io/npm/v/vue-renderer-markdown?color=a1b858&label=)](https://www.npmjs.com/package/vue-renderer-markdown)

## Features

- 📝 **Markdown to HTML**: Render Markdown string content directly as HTML in your Vue 3 app.
- 🧩 **Custom Components**: Support for custom Vue components inside Markdown.
- ⚡ **Advanced Markdown**: Supports tables, math, emoji, checkboxes, and more.
- ⌨️ **Typewriter Effect**: Built-in typewriter animation for streaming content with real-time cursor tracking.
- 📦 **TypeScript Support**: Full type definitions for props and usage.
- 🔌 **Easy Integration**: Plug-and-play with Vite, Vue CLI, or any Vue 3 project.

## Install

```bash
pnpm add vue-renderer-markdown
# or
npm install vue-renderer-markdown
# or
yarn add vue-renderer-markdown
```

## Usage

```vue
<script setup lang="ts">
import MarkdownRender from 'vue-renderer-markdown'

const markdownContent = `
# Hello Vue Markdown

This is **markdown** rendered as HTML!

- Supports lists
- [x] Checkboxes
- :smile: Emoji
`
</script>

<template>
  <MarkdownRender :content="markdownContent" />
</template>
```

### Typewriter Effect

Enable a typewriter animation effect perfect for streaming content or live markdown updates:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import MarkdownRender from 'vue-renderer-markdown'

const content = ref('')
const fullContent = `# Streaming Content\n\nThis text appears character by character...`

// Simulate streaming content
let index = 0
const interval = setInterval(() => {
  if (index < fullContent.length) {
    content.value += fullContent[index]
    index++
  } else {
    clearInterval(interval)
  }
}, 50)
</script>

<template>
  <MarkdownRender 
    :content="content" 
    :typewriterEffect="true" 
  />
</template>
```

The typewriter effect features:
- **Real-time cursor tracking**: Cursor follows the text as it appears
- **Smart positioning**: Automatically adjusts to different font sizes and line heights
- **Performance optimized**: Uses efficient DOM updates and animation frames
- **Auto-hiding cursor**: Cursor disappears after content stops updating

### Props

| Name              | Type                       | Required | Description                                      |
|-------------------|---------------------------|----------|--------------------------------------------------|
| `content`         | `string`                  | ✓        | Markdown string to render                        |
| `nodes`           | `BaseNode[]`              |          | Parsed markdown AST nodes (alternative to content)|
| `customComponents`| `Record<string, any>`     |          | Custom Vue components for rendering              |
| `typewriterEffect`| `boolean`                 |          | Enable typewriter animation effect (default: false)|

> Either `content` or `nodes` must be provided.

## Advanced

- **Custom Components**:
  Pass your own components via `customComponents` prop to render custom tags inside markdown.

- **TypeScript**:
  Full type support. Import types as needed:
  ```ts
  import type { MyMarkdownProps } from 'vue-markdown-to-html/dist/types'
  ```

## Monaco Editor Integration

If you are using Monaco Editor in your project, you need to configure `vite-plugin-monaco-editor-esm` to handle global injection of workers. On Windows, you may encounter issues during the build process. To resolve this, configure `customDistPath` to ensure successful packaging.

### Example Configuration

```ts
import path from 'node:path'
import monacoEditorPlugin from 'vite-plugin-monaco-editor-esm'

export default {
  plugins: [
    monacoEditorPlugin({
      languageWorkers: [
        'editorWorkerService',
        'typescript',
        'css',
        'html',
        'json',
      ],
      customDistPath(root, buildOutDir, base) {
        return path.resolve(buildOutDir, 'monacoeditorwork')
      },
    }),
  ],
}
```

This configuration ensures that Monaco Editor workers are correctly packaged and accessible in your project.

## Thanks

This project is built with the help of these awesome libraries:

- [vue-use-monaco](https://github.com/vueuse/vue-use-monaco) — Monaco Editor integration for Vue
- [shiki](https://github.com/shikijs/shiki) — Syntax highlighter powered by TextMate grammars and VS Code themes

Thanks to the authors and contributors of these projects!

## License

[MIT](./LICENSE) © [Simon He](https://github.com/Simon-He95)
