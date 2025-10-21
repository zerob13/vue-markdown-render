# @vue-markdown-renderer/parser

Framework-agnostic markdown parser that can be used with Vue, React, or any other framework.

## Features

- 🎯 **Framework Agnostic** - Pure TypeScript implementation, no framework dependencies
- 🚀 **High Performance** - Optimized parsing for large documents
- 📦 **Tree-shakeable** - Only bundle what you use
- 🔧 **Extensible** - Built on markdown-it with plugin support
- 💪 **TypeScript First** - Full type definitions included

## Installation

```bash
npm install @vue-markdown-renderer/parser
# or
pnpm add @vue-markdown-renderer/parser
# or
yarn add @vue-markdown-renderer/parser
```

## Usage

### Basic Parsing

```typescript
import { getMarkdown, parseMarkdownToStructure } from '@vue-markdown-renderer/parser'

// Create markdown-it instance
const md = getMarkdown()

// Parse markdown to structured nodes
const nodes = parseMarkdownToStructure('# Hello World', md)

console.log(nodes)
// [
//   {
//     type: 'heading',
//     level: 1,
//     text: 'Hello World',
//     children: [...]
//   }
// ]
```

### With Math Support

```typescript
import { getMarkdown, parseMarkdownToStructure } from '@vue-markdown-renderer/parser'

const md = getMarkdown({
  enableMath: true,
  mathOptions: {
    commands: ['text', 'frac', 'left', 'right']
  }
})

const markdown = `
## Math Example

Inline math: $E = mc^2$

Block math:
$$
\\frac{a}{b}
$$
`

const nodes = parseMarkdownToStructure(markdown, md)
```

### With Custom Containers

```typescript
import { getMarkdown, parseMarkdownToStructure } from '@vue-markdown-renderer/parser'

const md = getMarkdown({
  enableContainers: true
})

const markdown = `
::: tip
This is a tip
:::

::: warning
This is a warning
:::
`

const nodes = parseMarkdownToStructure(markdown, md)
```

### Process Tokens Directly

```typescript
import { processTokens } from '@vue-markdown-renderer/parser'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()
const tokens = md.parse('# Hello', {})

// Process tokens into structured nodes
const nodes = processTokens(tokens)
```

## API

### `getMarkdown(options?)`

Creates a configured markdown-it instance.

**Options:**
- `markdownItOptions` - Options to pass to markdown-it constructor
- `enableMath` - Enable math support (default: true)
- `enableContainers` - Enable container support (default: true)
- `mathOptions` - Math-specific options

### `parseMarkdownToStructure(markdown, md, options?)`

Parses markdown string into structured nodes.

**Parameters:**
- `markdown` - The markdown string to parse
- `md` - markdown-it instance
- `options` - Parse options

**Returns:** Array of `ParsedNode` objects

### `processTokens(tokens)`

Processes markdown-it tokens into structured nodes.

**Parameters:**
- `tokens` - Array of markdown-it tokens

**Returns:** Array of `ParsedNode` objects

### `parseInlineTokens(tokens)`

Parses inline tokens into structured nodes.

## Node Types

The parser produces typed nodes for all markdown elements:

- `HeadingNode`
- `ParagraphNode`
- `TextNode`
- `CodeBlockNode`
- `InlineCodeNode`
- `ListNode` / `ListItemNode`
- `TableNode` / `TableRowNode` / `TableCellNode`
- `LinkNode`
- `ImageNode`
- `BlockquoteNode`
- `MathInlineNode` / `MathBlockNode`
- And many more...

See the [type definitions](./src/types/index.ts) for complete details.

## Use with Different Frameworks

### With React

```typescript
import { getMarkdown, parseMarkdownToStructure } from '@vue-markdown-renderer/parser'

function MarkdownRenderer({ content }) {
  const md = getMarkdown()
  const nodes = parseMarkdownToStructure(content, md)

  // Render nodes with your React components
  return <div>{nodes.map(node => renderNode(node))}</div>
}
```

### With Vue

```typescript
import { getMarkdown, parseMarkdownToStructure } from '@vue-markdown-renderer/parser'

export default {
  setup(props) {
    const md = getMarkdown()
    const nodes = computed(() => parseMarkdownToStructure(props.content, md))

    return { nodes }
  }
}
```

### With Vanilla JS

```typescript
import { getMarkdown, parseMarkdownToStructure } from '@vue-markdown-renderer/parser'

const md = getMarkdown()
const nodes = parseMarkdownToStructure('# Hello', md)

// Convert to HTML or render with your own logic
nodes.forEach((node) => {
  // Your rendering logic
})
```

## License

MIT
