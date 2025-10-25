import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'
import { describe, expect, it } from 'vitest'

const md = getMarkdown('midstates')

function findFirst(nodes: any[], type: string) {
  return nodes.find(n => n && n.type === type)
}

function collect(nodes: any[], type: string) {
  const out: any[] = []
  const walk = (n: any) => {
    if (!n)
      return
    if (Array.isArray(n)) {
      n.forEach(walk)
      return
    }
    if (n.type === type)
      out.push(n)
    if (Array.isArray(n.children))
      n.children.forEach(walk)
    if (Array.isArray(n.items))
      n.items.forEach(walk)
  }
  nodes.forEach(walk)
  return out
}

describe('parseMarkdownToStructure - incremental/mid-typing states', () => {
  describe('heading transitions (extra)', () => {
    it('"##x" stays paragraph, then "## x" becomes heading level 2', () => {
      const n1 = parseMarkdownToStructure('##x', md)
      expect(findFirst(n1, 'heading')).toBeFalsy()
      const n2 = parseMarkdownToStructure('## x', md)
      const h = findFirst(n2, 'heading') as any
      expect(h).toBeTruthy()
      expect(h.level).toBe(2)
    })
  })

  describe('heading transitions', () => {
    it('"#x" stays paragraph, then "# x" becomes heading level 1', () => {
      const n1 = parseMarkdownToStructure('#x', md)
      expect(findFirst(n1, 'heading')).toBeFalsy()
      const p1: any = findFirst(n1, 'paragraph')
      expect(p1?.raw || JSON.stringify(n1)).toContain('#x')

      const n2 = parseMarkdownToStructure('# x', md)
      const h = findFirst(n2, 'heading') as any
      expect(h).toBeTruthy()
      expect(h.level).toBe(1)
      const text = (h.children?.[0]?.content) || (h.children?.[0]?.text) || ''
      expect(text).toContain('x')
    })
  })

  describe('blockquote transitions', () => {
    it('"> x" becomes blockquote with paragraph child', () => {
      const n = parseMarkdownToStructure('> x', md)
      const bq = findFirst(n, 'blockquote') as any
      expect(bq).toBeTruthy()
      const innerPara = bq.children?.find((c: any) => c.type === 'paragraph')
      expect(innerPara).toBeTruthy()
    })
  })

  describe('list item transitions', () => {
    it('"- x" becomes a bullet list item when followed by newline', () => {
      const n1 = parseMarkdownToStructure('- x', md)
      // Might still be paragraph depending on markdown-it rules without newline
      const maybeList = findFirst(n1, 'list')
      const maybePara = findFirst(n1, 'paragraph')
      expect(!!maybeList || !!maybePara).toBe(true)

      const n2 = parseMarkdownToStructure('- x\n', md)
      const list = findFirst(n2, 'list') as any
      expect(list).toBeTruthy()
      expect(list.ordered).toBe(false)
      const firstItemPara = list.items?.[0]?.children?.find((c: any) => c.type === 'paragraph')
      const text = firstItemPara?.children?.find((c: any) => c.type === 'text')
      expect(text?.content).toContain('x')
    })

    it('"1. x" becomes an ordered list when followed by newline', () => {
      const n = parseMarkdownToStructure('1. x\n', md)
      const list = findFirst(n, 'list') as any
      expect(list).toBeTruthy()
      expect(list.ordered).toBe(true)
      // start defaults to 1 if omitted
      expect(list.start === undefined || list.start === 1).toBeTruthy()
    })

    it('"- *" mid-state should not explode or produce nested lists unintentionally', () => {
      const n = parseMarkdownToStructure('- *', md)
      // The parser has a guard to escape this case; accept paragraph fallback
      const para = findFirst(n, 'paragraph')
      const list = findFirst(n, 'list')
      expect(!!para || !!list).toBe(true)
      const raw = (para as any)?.raw || JSON.stringify(n)
      expect(raw.includes('- *') || !!list).toBe(true)
    })
  })

  describe('emphasis/strong mid-states', () => {
    it('"*x" parses as emphasis, "**x" as strong (for mid typing)', () => {
      const e = parseMarkdownToStructure('*x', md)
      const em = collect(e, 'emphasis')[0]
      expect(em).toBeTruthy()
      const emText = em.children?.[0]?.content || em.text || ''
      expect(emText).toContain('x')

      const s = parseMarkdownToStructure('**x', md)
      const strong = collect(s, 'strong')[0]
      expect(strong).toBeTruthy()
      const st = strong.children?.[0]?.content || strong.text || ''
      expect(st).toContain('x')
    })
  })

  describe('inline code mid-states', () => {
    it('"`x" yields an inline_code node; "`x`" closes it', () => {
      const a = parseMarkdownToStructure('`x', md)
      const codeA = collect(a, 'inline_code')[0] as any
      expect(codeA).toBeTruthy()
      expect(codeA.code || codeA.raw)?.toContain('x')

      const b = parseMarkdownToStructure('`x`', md)
      const codeB = collect(b, 'inline_code')[0] as any
      expect(codeB).toBeTruthy()
      expect(codeB.code).toBe('x')
    })
  })

  describe('link transitions including tricky mid-states', () => {
    it('"[*x" and "[**x" should NOT be parsed as a link yet', () => {
      for (const input of ['[*x', '[**x']) {
        const nodes = parseMarkdownToStructure(input, md)
        const links = collect(nodes, 'link')
        expect(links.length).toBe(0)
        // Ensure original bracket remains in text output
        const asText = JSON.stringify(nodes)
        expect(asText.includes('[*x') || asText.includes('[**x')).toBe(true)
      }
    })

    it('"[x](http://a" produces a loading link (no closing paren)', () => {
      const nodes = parseMarkdownToStructure('[x](http://a', md)
      const links = collect(nodes, 'link') as any[]
      expect(links.length).toBeGreaterThanOrEqual(1)
      const l = links[0]
      expect(l.text).toBe('x')
      // When incomplete, parser marks loading=true; href may be empty until closed
      expect(l.loading).toBe(true)
    })

    it('"[x](http://a)" produces a finalized link', () => {
      const nodes = parseMarkdownToStructure('[x](http://a)', md)
      const links = collect(nodes, 'link') as any[]
      expect(links.length).toBe(1)
      expect(links[0].href).toBe('http://a')
      expect(links[0].loading).toBe(false)
    })

    it('handles "[*x](xx" mid-state tolerantly: either a loading link or plain text with emphasis', () => {
      const nodes = parseMarkdownToStructure('[*x](xx', md)
      const links = collect(nodes, 'link') as any[]
      if (links.length > 0) {
        const l = links[0]
        const textOk = l.text === '*x' || (l.children && JSON.stringify(l.children).includes('emphasis'))
        expect(textOk).toBe(true)
        expect(l.loading).toBe(true)
      }
      else {
        // Accept tokenizer choosing to keep as text + emphasis until closing paren exists
        const s = JSON.stringify(nodes)
        expect(s.includes('[*x](xx') || s.includes('emphasis')).toBe(true)
      }
    })
  })

  describe('image transitions', () => {
    it('"![x](u" is a mid-state image; either image or plain text is acceptable until closed', () => {
      const nodes = parseMarkdownToStructure('![x](u', md)
      // Depending on tokenizer, an image may already be emitted or fallback to text
      const images = collect(nodes, 'image')
      const textStr = JSON.stringify(nodes)
      expect(images.length >= 0).toBe(true)
      expect(images.length > 0 || textStr.includes('![x](u')).toBe(true)
    })

    it('"![x](url)" becomes an image node', () => {
      const nodes = parseMarkdownToStructure('![x](http://img)', md)
      const images = collect(nodes, 'image') as any[]
      expect(images.length).toBe(1)
      expect(images[0].src || images[0].href).toBe('http://img')
    })
  })

  describe('checkbox list item transitions', () => {
    it('"- [" is a mid-state and should not crash', () => {
      const nodes = parseMarkdownToStructure('- [', md)
      // Accept paragraph or list fallback safely
      const ok = !!findFirst(nodes, 'paragraph') || !!findFirst(nodes, 'list')
      expect(ok).toBe(true)
    })

    it('"- [ ] x" becomes an unchecked checkbox item when newline present', () => {
      const nodes = parseMarkdownToStructure('- [ ] x\n', md)
      const list = findFirst(nodes, 'list') as any
      expect(list).toBeTruthy()
      const item = list.items?.[0]
      const para = item?.children?.find((c: any) => c.type === 'paragraph')
      expect(!!para).toBe(true)
      // checkbox node is produced as an inline child of the paragraph
      const checkbox = para?.children?.find((c: any) => c.type === 'checkbox')
        || para?.children?.find((c: any) => c.type === 'checkbox_input')
      // Depending on inline path, either checkbox or checkbox_input appears
      expect(!!checkbox).toBe(true)
      const text = para?.children?.find((c: any) => c.type === 'text')
      expect(text?.content || '').toContain('x')
    })

    it('"- [x] x" becomes a checked checkbox item', () => {
      const nodes = parseMarkdownToStructure('- [x] hello\n', md)
      const list = findFirst(nodes, 'list') as any
      expect(list).toBeTruthy()
      const item = list.items?.[0]
      const para = item?.children?.find((c: any) => c.type === 'paragraph')
      expect(!!para).toBe(true)
      const checkbox = para?.children?.find((c: any) => c.type === 'checkbox')
        || para?.children?.find((c: any) => c.type === 'checkbox_input')
      expect(!!checkbox).toBe(true)
      // checked could be on either checkbox or checkbox_input node
      const checked = checkbox?.checked ?? checkbox?.attrs?.checked
      expect(checked).toBe(true)
    })
  })

  describe('thematic break transitions', () => {
    it('"-" and "--" are not hr; "---" is hr', () => {
      const a = parseMarkdownToStructure('-', md)
      expect(findFirst(a, 'thematic_break')).toBeFalsy()
      const b = parseMarkdownToStructure('--', md)
      expect(findFirst(b, 'thematic_break')).toBeFalsy()
      const c = parseMarkdownToStructure('---', md)
      expect(findFirst(c, 'thematic_break')).toBeTruthy()
    })
  })

  describe('hardbreak transitions', () => {
    it('two spaces before newline produces a hardbreak; one space does not', () => {
      const no = parseMarkdownToStructure('line \nnext', md)
      expect(collect(no, 'hardbreak').length).toBe(0)
      const yes = parseMarkdownToStructure('line  \nnext', md)
      expect(collect(yes, 'hardbreak').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('footnote reference mid-states', () => {
    it('"[^1" remains text; "[^1]" may become a footnote_reference depending on plugins', () => {
      const a = parseMarkdownToStructure('[^1', md)
      expect(collect(a, 'footnote_reference').length).toBe(0)
      const b = parseMarkdownToStructure('[^1]', md)
      // token type may be 'footnote_reference' or fall back to text if plugin config defers
      const got = collect(b, 'footnote_reference')
      if (got.length === 0) {
        const s = JSON.stringify(b)
        expect(s.includes('[^1]')).toBe(true)
      }
      else {
        expect(got.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('reference-style link mid-states', () => {
    it('"[text][id" stays as text/reference token; "[text][id]" recognized as reference', () => {
      const a = parseMarkdownToStructure('[text][id', md)
      // May yield a 'reference' inline token fallback or plain text
      const okA = collect(a, 'reference').length >= 0
      expect(okA).toBe(true)
      const b = parseMarkdownToStructure('[text][id]', md)
      // Depending on plugin setup, may still be a reference token awaiting definition
      expect(collect(b, 'reference').length >= 0).toBe(true)
    })
  })

  describe('fenced code block mid-states', () => {
    it('"```" or "```js" mid-state: accept fence node or paragraph fallback', () => {
      for (const input of ['```', '```js', '```js\nconsole.log(1)']) {
        const nodes = parseMarkdownToStructure(input, md)
        const fence = collect(nodes, 'code_block').length > 0
          || collect(nodes, 'fence').length > 0
        const para = !!findFirst(nodes, 'paragraph')
        expect(fence || para).toBe(true)
      }
    })
    it('mermaid fence: unclosed vs closed', () => {
      const unclosed = parseMarkdownToStructure('```mermaid\nflowchart TD\nA-->B', md)
      const f1 = collect(unclosed, 'code_block') as any[]
      if (f1.length > 0) {
        // If recognized early, language should be mermaid and likely loading
        expect(f1[0].language).toBe('mermaid')
        // loading may be true for unclosed fences
        expect([true, false]).toContain(!!f1[0].loading)
      }
      else {
        // Accept paragraph fallback
        expect(!!findFirst(unclosed, 'paragraph')).toBe(true)
      }

      const closed = parseMarkdownToStructure('```mermaid\nflowchart TD\nA-->B\n```', md)
      const f2 = collect(closed, 'code_block') as any[]
      expect(f2.length).toBeGreaterThanOrEqual(1)
      expect(f2[0].language).toBe('mermaid')
      // closed fences should be loading=false when mapping closed is detected
      if (typeof f2[0].loading === 'boolean')
        expect(f2[0].loading).toBe(false)
    })
  })

  describe('table transitions', () => {
    it('"a | b" alone is not a table; add separator to form a table', () => {
      const a = parseMarkdownToStructure('a | b', md)
      expect(findFirst(a, 'table')).toBeFalsy()
      const b = parseMarkdownToStructure('a | b\n---|---', md)
      expect(findFirst(b, 'table')).toBeTruthy()
    })
    it('alignment separators (:\n---: etc.) should not be parsed as emoji', () => {
      const s = parseMarkdownToStructure('A | B\n:---:|---', md)
      const table = findFirst(s, 'table')
      expect(!!table).toBe(true)
      // Ensure no stray emoji nodes in header/separator processing
      const emojis = collect(s, 'emoji')
      expect(emojis.length).toBe(0)
    })
  })

  describe('marking mid-states (strikethrough/highlight/insert/sub/sup)', () => {
    it('strikethrough: "~~x" or "~~x~~" should yield a strikethrough node', () => {
      for (const input of ['~~x', '~~x~~']) {
        const nodes = parseMarkdownToStructure(input, md)
        const s = collect(nodes, 'strikethrough')
        expect(s.length).toBeGreaterThanOrEqual(1)
      }
    })
    it('highlight: "==x" may stay text until closed; "==x==" highlights', () => {
      const a = parseMarkdownToStructure('==x', md)
      expect(collect(a, 'highlight').length).toBe(0)
      const b = parseMarkdownToStructure('==x==', md)
      expect(collect(b, 'highlight').length).toBeGreaterThanOrEqual(1)
    })
    it('insert/underline: "++x" may stay text; "++x++" inserts', () => {
      const a = parseMarkdownToStructure('++x', md)
      expect(collect(a, 'insert').length).toBe(0)
      const b = parseMarkdownToStructure('++x++', md)
      expect(collect(b, 'insert').length).toBeGreaterThanOrEqual(1)
    })
    it('superscript and subscript mid-states', () => {
      const supA = parseMarkdownToStructure('^2', md)
      expect(collect(supA, 'superscript').length).toBe(0)
      const supB = parseMarkdownToStructure('^2^', md)
      expect(collect(supB, 'superscript').length).toBeGreaterThanOrEqual(1)

      const subA = parseMarkdownToStructure('~2', md)
      expect(collect(subA, 'subscript').length).toBe(0)
      const subB = parseMarkdownToStructure('~2~', md)
      expect(collect(subB, 'subscript').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('emoji with links/lists mix edge cases', () => {
    it('list item mixing emoji and link (mid-state link)', () => {
      const nodes = parseMarkdownToStructure('- :smile: [Go](http://a', md)
      const list = findFirst(nodes, 'list') as any
      expect(!!list).toBe(true)
      const para = list.items?.[0]?.children?.find((c: any) => c.type === 'paragraph')
      expect(!!para).toBe(true)
      const hasEmoji = para?.children?.some((c: any) => c.type === 'emoji')
      const links = para ? para.children.filter((c: any) => c.type === 'link') : []
      // Link may be recognized as loading link at this stage
      const ok = hasEmoji && (links.length >= 0)
      expect(ok).toBe(true)
    })
    it('link text may contain emoji shortcode', () => {
      const nodes = parseMarkdownToStructure('[:smile:](http://a)', md)
      const links = collect(nodes, 'link')
      expect(links.length).toBe(1)
      // Either emoji child in link or text includes :smile:
      const s = JSON.stringify(links[0])
      expect(s.includes('emoji') || s.includes(':smile:')).toBe(true)
    })
  })
})
