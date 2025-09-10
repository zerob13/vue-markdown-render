# vue-renderer-markdown

> Rendering Markdown is straightforward, but when you need to stream and render it in real-time, new challenges emerge. vue-renderer-markdown is built specifically to handle the unique requirements of streaming Markdown content from AI models and live updates, providing seamless formatting even with incomplete or rapidly changing Markdown blocks.

[![NPM version](https://img.shields.io/npm/v/vue-renderer-markdown?color=a1b858&label=)](https://www.npmjs.com/package/vue-renderer-markdown)

## 🚀 [Live Demo](https://vue-markdown-renderer.netlify.app/)

Experience the power of high-performance streaming Markdown rendering in action!

## Features

- ⚡ **Ultra-High Performance**: Optimized for real-time streaming with minimal re-renders and efficient DOM updates
- 🌊 **Streaming-First Design**: Built specifically to handle incomplete, rapidly updating, and tokenized Markdown content
- ⌨️ **Smart Typewriter Effect**: Real-time cursor tracking with automatic positioning and performance-optimized animations
- 🧩 **Custom Components**: Seamlessly integrate your Vue components within Markdown content
- 📝 **Complete Markdown Support**: Tables, math formulas, emoji, checkboxes, code blocks, and more
- 🔄 **Real-Time Updates**: Handles partial content and incremental updates without breaking formatting
- 📦 **TypeScript First**: Full type definitions with intelligent auto-completion
- 🔌 **Zero Configuration**: Drop-in component that works with any Vue 3 project out of the box

## Install

```bash
pnpm add vue-renderer-markdown
# or
npm install vue-renderer-markdown
# or
yarn add vue-renderer-markdown
```

## Why vue-renderer-markdown?

Streaming Markdown content from AI models, live editors, or real-time updates presents unique challenges:

- **Incomplete syntax blocks** can break traditional parsers
- **Rapid content changes** cause excessive re-renders and performance issues
- **Cursor positioning** becomes complex with dynamic content
- **Partial tokens** need graceful handling without visual glitches

vue-renderer-markdown solves these challenges with a streaming-optimized architecture that maintains perfect formatting and performance, even with the most demanding real-time scenarios.

## Usage

### Streaming Markdown (Recommended)

Perfect for AI model responses, live content updates, or any scenario requiring real-time Markdown rendering:

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
  <MarkdownRender :content="content" :typewriter-effect="true" />
</template>
```

### Basic Usage

For static or pre-generated Markdown content:

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

## Performance Features

The streaming-optimized engine delivers:

- **Incremental Parsing Code Blocks**: Only processes changed content, not the entire code block
- **Efficient DOM Updates**: Minimal re-renders
- **Real-time Cursor Tracking**: Smooth cursor positioning
- **Memory Optimized**: Intelligent cleanup prevents memory leaks during long streaming sessions
- **Animation Frame Based**: Smooth animations
- **Graceful Degradation**: Handles malformed or incomplete Markdown without breaking

### Props

| Name               | Type                  | Required | Description                                         |
| ------------------ | --------------------- | -------- | --------------------------------------------------- |
| `content`          | `string`              | ✓        | Markdown string to render                           |
| `nodes`            | `BaseNode[]`          |          | Parsed markdown AST nodes (alternative to content)  |
| `customComponents` | `Record<string, any>` |          | Custom Vue components for rendering                 |
| `typewriterEffect` | `boolean`             |          | Enable typewriter animation effect (default: false) |

> Either `content` or `nodes` must be provided.

Note: when using the component in a Vue template, camelCase prop names should be written in kebab-case. For example, use `:typewriter-effect="true"` in templates (the prop name in JavaScript/TypeScript remains `typewriterEffect`).

## Advanced

- **Custom Components**:
  Pass your own components via `customComponents` prop to render custom tags inside markdown.

- **TypeScript**:
  Full type support. Import types as needed:
  ```ts
  import type { MyMarkdownProps } from 'vue-renderer-markdown/dist/types'
  ```

## Monaco Editor Integration

If you are using Monaco Editor in your project, you need to configure `vite-plugin-monaco-editor-esm` to handle global injection of workers. On Windows, you may encounter issues during the build process. To resolve this, configure `customDistPath` to ensure successful packaging.

> Note: If you only need to render a Monaco editor (for editing or previewing code) and don't require this library's full Markdown rendering pipeline, you can integrate Monaco directly using `vue-use-monaco` for a lighter, more direct integration.

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
