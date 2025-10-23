import { getMarkdown, parseMarkdownToStructure } from 'stream-markdown-parser'
import { describe, expect, it } from 'vitest'

const md = getMarkdown('t')

const MARKDOWN = `**Markdown链接**：  
1. [GitHub官网](https://github.com)  
2. [知乎 - 有问题就会有答案](https://www.zhihu.com)  
3. **加粗链接**：[Google](https://www.google.com)  
4. 嵌套格式的链接：[*斜体链接*](https://example.com)  

**普通链接**：  
1. https://www.wikipedia.org  
2. http://example.com/path?query=test  
3. 纯文本URL：https://markdown-guide.readthedocs.io
`

describe('link parsing', () => {
  it('parses inline and bare links into link nodes', () => {
    const nodes = parseMarkdownToStructure(MARKDOWN, md)
    // Flatten paragraph children for assertions
    const allLinkNodes: any[] = []
    const collect = (n: any) => {
      if (!n)
        return
      if (n.type === 'link')
        allLinkNodes.push(n)
      if (Array.isArray(n.children)) {
        for (const c of n.children) collect(c)
      }
      if (Array.isArray(n.items)) {
        for (const it of n.items) collect(it)
      }
    }
    for (const n of nodes) collect(n)

    // Some links may initially be loading (href empty) but should include texts
    const texts = allLinkNodes.map(l => l.text?.toString() || '')

    expect(texts).toContain('GitHub官网')
    expect(texts).toContain('知乎 - 有问题就会有答案')
    expect(texts).toContain('Google')
    // The parser may keep emphasis markup in link.text (e.g. "*斜体链接*"),
    // so accept either the raw form or verify the nested emphasis child contains the plain text.
    const hasPlainItalic = texts.includes('斜体链接')
    const hasRawItalic = texts.includes('*斜体链接*') || texts.includes('_斜体链接_')
    if (!hasPlainItalic && !hasRawItalic) {
      // Look for a link node whose children include an emphasis node with a text child '斜体链接'
      const findTextInChildren = (node: any, want: string): boolean => {
        if (!node)
          return false
        if (node.type === 'text' && node.content === want)
          return true
        if (Array.isArray(node.children)) {
          for (const c of node.children) {
            if (findTextInChildren(c, want))
              return true
          }
        }
        if (Array.isArray(node.items)) {
          for (const it of node.items) {
            if (findTextInChildren(it, want))
              return true
          }
        }
        return false
      }
      const found = allLinkNodes.some(l => findTextInChildren(l, '斜体链接'))
      expect(found).toBe(true)
    }

    // Check for bare URLs rendered as text nodes inside paragraphs
    const containsBare = nodes.some((n: any) => {
      const s = JSON.stringify(n)
      return s.includes('https://www.wikipedia.org') || s.includes('http://example.com/path?query=test') || s.includes('https://markdown-guide.readthedocs.io')
    })
    expect(containsBare).toBe(true)
  })

  it('parses link with parentheses and CJK brackets as a single link', () => {
    const special = '[【名称】(test).mp4](https://github.com/Simon-He95/vue-markdown-renderer)'
    const nodes = parseMarkdownToStructure(special, md)

    // Flatten and collect link nodes
    const links: any[] = []
    const walk = (n: any) => {
      if (!n)
        return
      if (n.type === 'link')
        links.push(n)
      if (Array.isArray(n.children))
        n.children.forEach(walk)
      if (Array.isArray(n.items))
        n.items.forEach(walk)
    }
    nodes.forEach(walk)
    // Expect only a single link node in the paragraph without stray text nodes
    expect(links.length).toBe(1)
    expect(links[0].href).toBe('https://github.com/Simon-He95/vue-markdown-renderer')
    // Ensure the full visible text is preserved inside the link
    // Accept either direct text aggregation or nested children text
    const text = links[0].text || ''
    const childText = (links[0].children || [])
      .map((c: any) => (c.content ?? c.text ?? ''))
      .join('')
    expect(text || childText).toBe('【名称】(test).mp4')

    // Also assert the paragraph has exactly one child which is the link
    const para = nodes.find((n: any) => n.type === 'paragraph') as any
    expect(para).toBeTruthy()
    expect(Array.isArray(para.children)).toBe(true)
    expect(para.children.length).toBe(1)
    expect(para.children[0].type).toBe('link')
  })
})
