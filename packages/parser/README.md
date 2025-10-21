
# stream-markdown-parser

Lightweight, framework-agnostic Markdown parser implemented in TypeScript. It focuses on producing a typed, structured representation of Markdown content so you can render it in Vue, React, or any other environment.

[![NPM version](https://img.shields.io/npm/v/stream-markdown-parser?color=a1b858&label=)](https://www.npmjs.com/package/stream-markdown-parser)
[![中文版](https://img.shields.io/badge/docs-中文文档-blue)](README.zh-CN.md)
[![NPM downloads](https://img.shields.io/npm/dm/stream-markdown-parser)](https://www.npmjs.com/package/stream-markdown-parser)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/stream-markdown-parser)](https://bundlephobia.com/package/stream-markdown-parser)
[![License](https://img.shields.io/npm/l/stream-markdown-parser)](./LICENSE)

## Highlights

- Framework-agnostic: pure TypeScript, no runtime framework dependency
- Typed output: full TypeScript definitions for the produced node tree
- Extensible: built on top of markdown-it and supports plugins (math, containers, etc.)
- Optimized for streaming / large documents

## Install

```bash
npm install stream-markdown-parser
# or
pnpm add stream-markdown-parser
```

## Quickstart

```ts
import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'

const md = getMarkdown()
const nodes = parseMarkdownToStructure('# Hello World', md)
console.log(nodes)
```

## Examples

Basic parsing, math and custom container usage:

```ts
// basic
const md = getMarkdown()
parseMarkdownToStructure('# Title', md)

// enable math
const mdWithMath = getMarkdown({ enableMath: true })
parseMarkdownToStructure('Inline $x^2$ and block math:\n$$x^2$$', mdWithMath)

// enable custom containers
const mdWithContainers = getMarkdown({ enableContainers: true })
parseMarkdownToStructure('::: tip\nHi\n:::', mdWithContainers)
```

You can also process tokens directly:

```ts
import { processTokens } from 'stream-markdown-parser'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()
const tokens = md.parse('# Hello', {})
const nodes = processTokens(tokens)
```

## API (overview)

- getMarkdown(options?): returns a configured markdown-it instance
- parseMarkdownToStructure(markdown, md, options?): parse a markdown string into typed nodes
- processTokens(tokens): convert markdown-it tokens into typed nodes
- parseInlineTokens(tokens): parse inline tokens

See `src/types/index.ts` for the full `ParsedNode` definitions.

## Integration

- React / Vue / Vanilla: parse to nodes, then render with your components

## Build & Dev

This package is built using Vite and `vite-plugin-dts` for types generation. In this monorepo the package is under `packages/parser`.

Build locally:

```bash
pnpm --filter ./packages/parser build
```

Typecheck:

```bash
pnpm --filter ./packages/parser -w -C . typecheck
```

## License

MIT
