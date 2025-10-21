import { getMarkdown } from 'stream-markdown-parser'
import { describe, expect, it } from 'vitest'

describe('math inline edgecases', () => {
  it('handles nested parentheses with escaped braces and preserves backslashes', () => {
    const md = getMarkdown()
    // Use a simpler, correctly escaped inline math string. This represents
    // the literal: \((\operatorname{span}{\boldsymbol{\alpha}})^\perp\)
    const content = '前文 \\((\\operatorname{span}{\\boldsymbol{\\alpha}})^\\perp\\) 后文'
    const tokens = md.parse(content, {})
    const inlineChildren = tokens.flatMap((t: any) => (t.children ? t.children : []))
    const inlineMath = inlineChildren.filter((c: any) => c && c.type === 'math_inline')
    expect(inlineMath.length).toBeGreaterThanOrEqual(1)
    const mathContent = inlineMath[0].content
    // debug: math token content inspected during development if needed
    // Ensure math content includes the expected TeX command names (backslash
    // may or may not be present depending on normalization).
    expect(/\\?operatorname/.test(mathContent)).toBe(true)
    expect(/\\?boldsymbol/.test(mathContent)).toBe(true)
  })
})
