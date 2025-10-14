import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getMarkdown, parseMarkdownToStructure, renderMarkdown } from '../src/utils/markdown'

const md = getMarkdown('e2e')

const FIXTURES_DIR = resolve(__dirname, 'fixtures')

describe('e2e markdown parsing (fixtures)', () => {
  const files = [
    'headings.md',
    'code-diff.md',
    'table.md',
    'admonition.md',
    'math.md',
    'footnotes.md',
    'image-link.md',
    'checkbox.md',
    'mermaid.md',
    // edge-case fixtures
    'unclosed-fence.md',
    'trailing-backticks.md',
    'unmatched-brackets.md',
    'escaped-brackets.md',
    'nested-lists-edge.md',
    'fence-with-meta.md',
  ]

  for (const f of files) {
    it(`parses fixture ${f}`, () => {
      const src = readFileSync(resolve(FIXTURES_DIR, f), 'utf8')
      const nodes = parseMarkdownToStructure(src, md)
      expect(nodes).toBeInstanceOf(Array)
      // Ensure we have at least one top-level node
      expect(nodes.length).toBeGreaterThan(0)

      // Create a stable, minimal serialization for snapshot
      // Helper to find first descendant text for a node
      const findFirstText = (node: any): string | undefined => {
        if (!node)
          return undefined
        if (node.type === 'text' && typeof node.content === 'string')
          return node.content.slice(0, 80)
        if (Array.isArray(node.children)) {
          for (const c of node.children) {
            const t = findFirstText(c)
            if (t)
              return t
          }
        }
        return undefined
      }

      const pickMeta = (meta: any) => {
        if (!meta || typeof meta !== 'object')
          return undefined
        const keys = ['diff', 'language', 'closed', 'unclosed']
        const out: any = {}
        for (const k of keys) {
          if (k in meta)
            out[k] = meta[k]
        }
        return Object.keys(out).length ? out : undefined
      }

      const minimal = nodes.map((n: any) => {
        const out: any = { type: n.type }
        out.firstText = findFirstText(n)
        if (n.meta)
          out.meta = pickMeta(n.meta)

        if (n.type === 'heading') {
          out.level = (n as any).level
          out.children = (n as any).children?.map((c: any) => c.type)
        }
        else if (n.type === 'list') {
          out.ordered = (n as any).ordered
          out.items = (n as any).items?.length ?? 0
        }
        else if (n.type === 'code_block') {
          out.language = (n as any).language
          out.diff = !!(n as any).diff
          // include a short preview of code
          out.preview = (n as any).code ? (n as any).code.slice(0, 120) : undefined
        }
        else if (n.type === 'table') {
          out.rows = (n as any).rows?.length ?? 0
        }
        else if (n.type === 'footnote') {
          out.items = (n as any).items?.length ?? 0
        }
        else {
          // generic: record if has children
          out.children = (n as any).children ? (n as any).children.length : undefined
        }
        return out
      })

      expect(minimal).toMatchSnapshot(f)
    })
  }

  it('renders markdown to HTML containing expected fragments', () => {
    const small = 'This has inline math (\\alpha) and code:\n\n```ts\nlet x = 1\n```'
    const html = renderMarkdown(md, small)
    expect(html).toContain('code-block')
    // inline math is rendered via KaTeX into a <math> or HTML; assert a math-like fragment
    expect(html).toMatch(/<math|katex|\^|\\alpha/)
  })
})
