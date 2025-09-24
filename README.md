# vue-renderer-markdown

> Fast, streaming-friendly Markdown rendering for Vue 3 — progressive Mermaid, streaming diff code blocks, and real-time previews optimized for large documents.

[![NPM version](https://img.shields.io/npm/v/vue-renderer-markdown?color=a1b858&label=)](https://www.npmjs.com/package/vue-renderer-markdown)

## Why use it?

- Progressive Mermaid: diagrams render incrementally so users see results earlier.
- Streaming diff code blocks: show diffs as they arrive for instant feedback.
- Built for scale: optimized DOM updates and memory usage for very large documents.

## Compared to traditional Markdown renderers

Traditional Markdown renderers typically convert a finished Markdown string into a static HTML tree. This library is designed for streaming and interactive workflows and therefore provides capabilities you won't find in a classic renderer:

- Streaming-first rendering: render partial or incrementally-updated Markdown content without re-parsing the whole document each time. This enables live previews for AI outputs or editors that emit tokens progressively.
- Streaming-aware code blocks and "code-jump" UX: large code blocks are updated incrementally and the renderer can maintain cursor/selection context and fine-grained edits. This enables smooth code-editing experiences and programmatic "jump to" behaviors that traditional renderers do not support.
- Built-in diff/code-stream components: show diffs as they arrive (line-by-line or token-by-token) with minimal reflow. This is ideal for streaming AI edits or progressive code reviews — functionality that is not available in plain Markdown renderers.
- Progressive diagrams and editors: Mermaid diagrams and Monaco-based previews update progressively and render as soon as they become valid.
- Smooth, interactive UI: the renderer is optimized for minimal DOM churn and silky interactions (e.g. streaming diffs, incremental diagram updates, and editor integrations) so UX remains responsive even with very large documents.

These features make the library especially suited for real-time, AI-driven, and large-document scenarios where a conventional, static Markdown-to-HTML conversion would lag or break the user experience.

## 🚀 Live Demo

[Demo site](https://vue-markdown-renderer.netlify.app/) — try large Markdown files and progressive diagrams to feel the difference.

## Features

- ⚡ **Ultra-High Performance**: Optimized for real-time streaming with minimal re-renders and efficient DOM updates
- 🌊 **Streaming-First Design**: Built specifically to handle incomplete, rapidly updating, and tokenized Markdown content
- 🧠 **Monaco Streaming Updates**: High-performance Monaco integration with smooth, incremental updates for large code blocks
- 🪄 **Progressive Mermaid Rendering**: Diagrams render as they become valid and update incrementally without jank
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

### Install peer dependencies (important)

This package declares several peer dependencies. Some are required for core rendering and others are optional and enable extra features. Since the library now lazy-loads heavyweight optional peers at runtime, you can choose a minimal install for basic rendering or a full install to enable advanced features.

Minimal (core) peers — required for basic rendering:

pnpm (recommended):

```bash
pnpm add vue
```

Full install — enables diagrams, Monaco editor preview and icon UI (recommended if you want all features):

```bash
pnpm add vue @iconify/vue katex mermaid vue-use-monaco
```

npm equivalent:

```bash
npm install vue @iconify/vue katex mermaid vue-use-monaco
```

yarn equivalent:

```bash
yarn add vue @iconify/vue katex mermaid vue-use-monaco
```

Notes:

- The exact peer version ranges are declared in this package's `package.json` — consult it if you need specific versions.
- Optional peers and the features they enable:
  - `mermaid` — enables Mermaid diagram rendering (progressive rendering is supported). If absent, code blocks tagged `mermaid` fall back to showing the source text without runtime errors.
  - `vue-use-monaco` — enables Monaco Editor based previews/editing and advanced streaming updates for large code blocks. If absent, the component degrades to plain text rendering and no editor is created.
  - `@iconify/vue` — enables iconography in the UI (toolbar buttons). If absent, simple fallback elements are shown in place of icons so the UI remains functional.
- `vue-i18n` is optional: the library provides a synchronous fallback translator. If your app uses `vue-i18n`, the library will automatically wire into it at runtime when available.
- If you're installing this library inside a monorepo or using pnpm workspaces, install peers at the workspace root so they are available to consuming packages.

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
  }
  else {
    clearInterval(interval)
  }
}, 50)
</script>

<template>
  <MarkdownRender :content="content" />
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
- **Monaco Streaming**: Fast, incremental updates for large code snippets without blocking the UI
- **Progressive Mermaid**: Diagrams render as soon as syntax is valid and refine as content streams in
- **Memory Optimized**: Intelligent cleanup prevents memory leaks during long streaming sessions
- **Animation Frame Based**: Smooth animations
- **Graceful Degradation**: Handles malformed or incomplete Markdown without breaking

### Props

| Name               | Type                  | Required | Description                                        |
| ------------------ | --------------------- | -------- | -------------------------------------------------- |
| `content`          | `string`              | ✓        | Markdown string to render                          |
| `nodes`            | `BaseNode[]`          |          | Parsed markdown AST nodes (alternative to content) |
| `customComponents` | `Record<string, any>` |          | Custom Vue components for rendering                |
| `renderCodeBlocksAsPre` | `boolean` | | When true, render all `code_block` nodes as simple `<pre><code>` blocks (uses `PreCodeNode`) instead of the full `CodeBlockNode`. Useful for lightweight, dependency-free rendering of multi-line text such as AI "thinking" outputs. Defaults to `false`. |

> Either `content` or `nodes` must be provided.

Note: when using the component in a Vue template, camelCase prop names should be written in kebab-case. For example, `customComponents` becomes `custom-components` in templates.

## 新增属性: `renderCodeBlocksAsPre`

- 类型: `boolean`
- 默认: `false`

描述:
- 当设置为 `true` 时，所有解析到的 `code_block` 节点会以简单的 `<pre><code>`（库内为 `PreCodeNode`）渲染，而不是使用带有可选依赖（如 Monaco、mermaid）的完整 `CodeBlockNode` 组件。
- 适用场景：需要以原始、轻量的预格式化文本展示代码或 AI 模型（例如“thinking”/推理输出）返回的多行文本与推理步骤时，建议开启此选项以保证格式保留且不依赖可选同伴库。

注意:
- 当 `renderCodeBlocksAsPre: true` 时，传递给 `CodeBlockNode` 的 `codeBlockDarkTheme`、`codeBlockMonacoOptions`、`themes`、`minWidth`、`maxWidth` 等属性不会生效（因为不再使用 `CodeBlockNode`）。
- 若需要完整代码块功能（语法高亮、折叠、复制按钮等），请保持默认 `false` 并安装可选依赖（`mermaid`, `vue-use-monaco`, `@iconify/vue`）。

示例（Vue 使用）:
```vue
<script setup lang="ts">
import MarkdownRender from 'vue-renderer-markdown'

const markdown = `Here is an AI thinking output:\n\n\`\`\`text\nStep 1...\nStep 2...\n\`\`\`\n`
</script>

<template>
  <MarkdownRender :content="markdown" :render-code-blocks-as-pre="true" />
</template>
```

## Advanced

- **Custom Components**:
  Pass your own components via `customComponents` prop to render custom tags inside markdown.

- **TypeScript**:
  Full type support. Import types as needed:
  ```ts
  import type { MyMarkdownProps } from 'vue-renderer-markdown/dist/types'
  ```

### Override Language Icons

Override how code language icons are resolved via the plugin option `getLanguageIcon`.
This keeps your usage unchanged and centralizes customization.

Plugin usage:

```ts
import { createApp } from 'vue'
import { VueRendererMarkdown } from 'vue-renderer-markdown'
import App from './App.vue'

const app = createApp(App)

// Example 1: replace shell/Shellscript icon with a remote SVG URL
const SHELL_ICON_URL = 'https://raw.githubusercontent.com/catppuccin/vscode-icons/refs/heads/main/icons/mocha/bash.svg'
app.use(VueRendererMarkdown, {
  getLanguageIcon(lang) {
    const l = (lang || '').toLowerCase()
    if (
      l === 'shell'
      || l === 'shellscript'
      || l === 'sh'
      || l === 'bash'
      || l === 'zsh'
      || l === 'powershell'
      || l === 'ps1'
      || l === 'bat'
      || l === 'batch'
    ) {
      return `<img src="${SHELL_ICON_URL}" alt="${l}" />`
    }
    // return empty/undefined to use the library default icon
    return undefined
  },
})
```

Local file example (import inline SVG):

```ts
import { createApp } from 'vue'
import { VueRendererMarkdown } from 'vue-renderer-markdown'
import App from './App.vue'
import JsIcon from './assets/javascript.svg?raw'

const app = createApp(App)

app.use(VueRendererMarkdown, {
  getLanguageIcon(lang) {
    const l = (lang || '').toLowerCase()
    if (l === 'javascript' || l === 'js')
      return JsIcon // inline SVG string
    return undefined
  },
})
```

Notes:
- The resolver returns raw HTML/SVG string. Returning `undefined`/empty value defers to the built-in mapping.
- Works across all code blocks without changing component usage.
- Alignment: icons render inside a fixed-size slot; both `<svg>` and `<img>` align consistently, no inline styles needed.
- For local files, import with `?raw` and ensure the file is a pure SVG (not an HTML page). Download the raw SVG instead of GitHub’s HTML preview.
- The resolver receives the raw language string (e.g., `tsx:src/components/file.tsx`). The built-in fallback mapping uses only the base segment before `:`.

## Monaco Editor Integration

If you are using Monaco Editor in your project, configure `vite-plugin-monaco-editor-esm` to handle global injection of workers. Our renderer is optimized for streaming updates to large code blocks—when content changes incrementally, only the necessary parts are updated for smooth, responsive rendering. On Windows, you may encounter issues during the build process. To resolve this, configure `customDistPath` to ensure successful packaging.

> Note: If you only need to render a Monaco editor (for editing or previewing code) and don't require this library's full Markdown rendering pipeline, you can integrate Monaco directly using `vue-use-monaco` for a lighter, more direct integration.

```bash
pnpm add vite-plugin-monaco-editor-esm monaco-editor -d
```

npm equivalent:

```bash
npm install vite-plugin-monaco-editor-esm monaco-editor --save-dev
```

yarn equivalent:

```bash
yarn add vite-plugin-monaco-editor-esm monaco-editor -d
```

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

## Code block header customization

The code block component now exposes a flexible header API so consumers can:

- Toggle the entire header on/off.
- Show or hide built-in toolbar buttons (copy, expand, preview, font-size controls).
- Fully replace the left or right header content via named slots.

This makes it easy to adapt the header to your application's UX or to inject custom controls.

Props (new)

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `showHeader` | `boolean` | `true` | Toggle rendering of the header bar. |
| `showCopyButton` | `boolean` | `true` | Show the built-in copy button. |
| `showExpandButton` | `boolean` | `true` | Show the built-in expand/collapse button. |
| `showPreviewButton` | `boolean` | `true` | Show the built-in preview button (when preview is available). |
| `showFontSizeButtons` | `boolean` | `true` | Show the built-in font-size controls (also requires `enableFontSizeControl`). |

Slots

- `header-left` — Replace the left side of the header (language icon + label by default).
- `header-right` — Replace the right side of the header (built-in action buttons by default).

Example: hide the header

```vue
<CodeBlockNode
  :node="{ type: 'code_block', language: 'javascript', code: 'console.log(1)', raw: 'console.log(1)' }"
  :showHeader="false"
  :loading="false"
/>
```

Example: custom header via slots

```vue
<CodeBlockNode
  :node="{ type: 'code_block', language: 'html', code: '<div>Hello</div>', raw: '<div>Hello</div>' }"
  :loading="false"
  :showCopyButton="false"
>
  <template #header-left>
    <div class="flex items-center space-x-2">
      <!-- custom icon or label -->
      <span class="text-sm font-medium">My HTML</span>
    </div>
  </template>

  <template #header-right>
    <div class="flex items-center space-x-2">
      <button class="px-2 py-1 bg-blue-600 text-white rounded">Run</button>
      <button class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Inspect</button>
    </div>
  </template>
</CodeBlockNode>
```

Notes

- The new `showFontSizeButtons` prop provides an additional toggle; the existing `enableFontSizeControl` prop still controls whether the font-size feature is enabled at all. Keep both in mind when hiding/showing font controls.
- Existing behavior is unchanged by default — all new props default to `true` to preserve the original UI.

This configuration ensures that Monaco Editor workers are correctly packaged and accessible in your project.

### Webpack — monaco-editor-webpack-plugin

如果你的项目使用 Webpack 而不是 Vite，可以使用官方的 `monaco-editor-webpack-plugin` 来打包并注入 Monaco 的 worker 文件。下面给出一个简单示例（Webpack 5）：

安装：

```bash
pnpm add -D monaco-editor monaco-editor-webpack-plugin
# 或
npm install --save-dev monaco-editor monaco-editor-webpack-plugin
```

示例 `webpack.config.js`：

```js
const path = require('node:path')
const MonacoEditorPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  // ...你的其他配置...
  output: {
    // 确保 worker 文件被正确放置，可按需调整 publicPath/filename
    publicPath: '/',
  },
  plugins: [
    new MonacoEditorPlugin({
      // 指定需要的语言/功能以减小体积
      languages: ['javascript', 'typescript', 'css', 'html', 'json'],
      // 可选项：调整输出 worker 文件名模式
      filename: 'static/[name].worker.js',
    }),
  ],
}
```

说明：
- 对于使用 `monaco-editor` 的项目，务必将对应 worker 交由插件处理，否则运行时会在浏览器尝试加载缺失的 worker 文件（类似于 Vite 的 dep optimizer 错误）。
- 如果你在构建后看到了类似 “file does not exist” 的错误（例如某些 worker 在依赖优化目录中找不到），请确保通过插件或构建输出将 worker 打包到可访问的位置。

## Mermaid: Progressive Rendering Example

Mermaid diagrams can be streamed progressively. The diagram renders as soon as the syntax becomes valid and refines as more content arrives.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import MarkdownRender from 'vue-renderer-markdown'

const content = ref('')
const steps = [
  '```mermaid\n',
  'graph TD\n',
  'A[Start]-->B{Is valid?}\n',
  'B -- Yes --> C[Render]\n',
  'B -- No  --> D[Wait]\n',
  '```\n',
]

let i = 0
const id = setInterval(() => {
  content.value += steps[i] || ''
  i++
  if (i >= steps.length)
    clearInterval(id)
}, 120)
</script>

<template>
  <MarkdownRender :content="content" />
  <!-- Diagram progressively appears as content streams in -->
  <!-- Mermaid must be installed as a peer dependency -->
</template>
```

## Tailwind (例如 shadcn) — 解决样式层级问题

如果你在项目中使用像 shadcn 这样的 Tailwind 组件库，可能会遇到样式层级/覆盖问题。推荐在你的全局样式文件中通过 Tailwind 的 layer 把库样式以受控顺序导入。例如，在你的主样式文件（例如 `src/styles/index.css` 或 `src/main.css`）中：

```css
/* main.css 或 index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 推荐：将库样式放入 components 层，方便项目组件覆盖它们 */
@layer components {
  @import 'vue-renderer-markdown/index.css';
}

/* 备选：如需库样式优先于 Tailwind 的 components 覆盖，可放入 base 层：
@layer base {
  @import 'vue-renderer-markdown/index.css';
}
*/
```

选择放入 `components`（常用）或 `base`（当你希望库样式更“基础”且不易被覆盖时）取决于你希望的覆盖优先级。调整后运行你的构建/开发命令（例如 pnpm dev）以验证样式顺序是否符合预期。

## Thanks

This project is built with the help of these awesome libraries:

- [vue-use-monaco](https://github.com/vueuse/vue-use-monaco) — Monaco Editor integration for Vue
- [shiki](https://github.com/shikijs/shiki) — Syntax highlighter powered by TextMate grammars and VS Code themes

Thanks to the authors and contributors of these projects!

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Simon-He95/vue-markdown-render&type=Date)](https://www.star-history.com/#Simon-He95/vue-markdown-render&Date)

## License

[MIT](./LICENSE) © [Simon He](https://github.com/Simon-He95)
