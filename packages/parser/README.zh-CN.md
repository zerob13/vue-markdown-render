# stream-markdown-parser

轻量化、框架无关的 Markdown 解析器，使用 TypeScript 编写。输出为强类型的节点树，方便在 Vue、React 或任何运行时中渲染。

[![NPM version](https://img.shields.io/npm/v/stream-markdown-parser?color=a1b858&label=)](https://www.npmjs.com/package/stream-markdown-parser)
[![English Docs](https://img.shields.io/badge/docs-English-blue)](README.md)
[![NPM downloads](https://img.shields.io/npm/dm/stream-markdown-parser)](https://www.npmjs.com/package/stream-markdown-parser)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/stream-markdown-parser)](https://bundlephobia.com/package/stream-markdown-parser)
[![License](https://img.shields.io/npm/l/stream-markdown-parser)](./LICENSE)

## 主要特点

- 框架无关：纯 TypeScript 实现，无运行时框架依赖
- 强类型输出：包含完整的 TypeScript 类型定义
- 可扩展：基于 markdown-it，支持插件（例如数学公式、容器等）
- 适用于流式或大文档解析场景

## 安装

```bash
pnpm add stream-markdown-parser
# 或
npm install stream-markdown-parser
```

## 快速开始

```ts
import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'

const md = getMarkdown()
const nodes = parseMarkdownToStructure('# Hello World', md)
console.log(nodes)
```

## 示例

基本解析、数学公式与自定义容器：

```ts
// 基本用法
const md = getMarkdown()
parseMarkdownToStructure('# 标题', md)

// 启用数学公式
const mdWithMath = getMarkdown({ enableMath: true })
parseMarkdownToStructure('行内 $x^2$ 与 块级公式:\n$$x^2$$', mdWithMath)

// 启用自定义容器
const mdWithContainers = getMarkdown({ enableContainers: true })
parseMarkdownToStructure('::: tip\n提示内容\n:::', mdWithContainers)
```

也可以直接处理 markdown-it 的 tokens：

```ts
import MarkdownIt from 'markdown-it'
import { processTokens } from 'stream-markdown-parser'

const md = new MarkdownIt()
const tokens = md.parse('# Hello', {})
const nodes = processTokens(tokens)
```

## API 概览

- `getMarkdown(options?)`：返回配置好的 `markdown-it` 实例
- `parseMarkdownToStructure(markdown, md, options?)`：将 markdown 字符串解析为类型化节点
- `processTokens(tokens)`：将 markdown-it tokens 转换为节点
- `parseInlineTokens(tokens)`：解析内联 tokens

完整的节点类型定义请查看 `src/types/index.ts`。

## 与不同框架的集成

解析出节点后，在 React / Vue / 或原生 JS 中用你的组件或渲染逻辑对节点进行渲染即可。

## 构建与开发

该包使用 Vite 构建，并通过 `vite-plugin-dts` 生成声明文件，在 monorepo 中位于 `packages/parser`。

本地构建：

```bash
pnpm --filter ./packages/parser build
```

类型检查：

```bash
pnpm --filter ./packages/parser -w -C . typecheck
```

## 许可证

MIT
