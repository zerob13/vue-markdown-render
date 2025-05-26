# vue-renderer-markdown

> A Vue 3 component that renders Markdown string content as HTML, supporting custom components and advanced markdown features.

[![NPM version](https://img.shields.io/npm/v/vue-markdown-to-html?color=a1b858&label=)](https://www.npmjs.com/package/vue-markdown-to-html)

## Features

- 📝 **Markdown to HTML**: Render Markdown string content directly as HTML in your Vue 3 app.
- 🧩 **Custom Components**: Support for custom Vue components inside Markdown.
- ⚡ **Advanced Markdown**: Supports tables, math, emoji, checkboxes, and more.
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

### Props

| Name              | Type                       | Required | Description                                      |
|-------------------|---------------------------|----------|--------------------------------------------------|
| `content`         | `string`                  | ✓        | Markdown string to render                        |
| `nodes`           | `BaseNode[]`              |          | Parsed markdown AST nodes (alternative to content)|
| `customComponents`| `Record<string, any>`     |          | Custom Vue components for rendering              |

> `content` 和 `nodes` 必须至少传递一个。

## Advanced

- **Custom Components**:
  Pass your own components via `customComponents` prop to render custom tags inside markdown.

- **TypeScript**:
  Full type support. Import types as needed:
  ```ts
  import type { MyMarkdownProps } from 'vue-markdown-to-html/dist/types'
  ```

## License

[MIT](./LICENSE) © [Simon He](https://github.com/Simon-He95)
