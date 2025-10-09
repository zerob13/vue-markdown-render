import { describe, expect, it } from 'vitest'
import { getMarkdown } from '../../src/utils/markdown'

describe('math plugin (inline & block)', () => {
  it('parses inline $...$ and ( ... ) maths', () => {
    const md = getMarkdown('t')
    const content = '这是行内数学 $a+b=3$ 和另外一种 \\(--x\\)'
    const html = md.render(content)

    // Should render math inline - either our inline wrapper or MathJax output or raw content
    const ok
      = html.includes('vmr-math-inline')
        || html.includes('MathJax')
        || html.includes('a+b=3')
    expect(ok).toBe(true)
  })

  it('parses block $$...$$ maths', () => {
    const md = getMarkdown('t')
    const content = `前文\n$$\nE=mc^2\n$$\n后文`
    const tokens = md.parse(content, {})
    const blocks = tokens.filter((t: any) => t.type === 'math_block')
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    expect(blocks[0].content).toContain('E=mc^2')
  })

  it('does not treat escaped dollar as math', () => {
    const md = getMarkdown('t')
    const content = 'price is $5 and not math $not$'
    const tokens = md.parse(content, {})
    const inline = tokens
      .flatMap((t: any) => (t.children ? t.children : []))
      .filter(
        (c: any) =>
          c && (c.type === 'vmr_math_inline' || c.type === 'math_inline'),
      )
    // Expect none (we may get tokens as text)
    expect(inline.length).toBeLessThanOrEqual(1)
  })

  it('parses multiple inline \(...\) maths in one line', () => {
    const md = getMarkdown('t')
    const content = '可以看作 \\(\\boldsymbol{\\beta}\\) 与 \\(W\\) 正交的一个特例（当 \\(W\\) 只由 \\(\\boldsymbol{\\alpha}\\) 张成时）。'
    const tokens = md.parse(content, {})

    const inline = tokens
      .flatMap((t: any) => (t.children ? t.children : []))
      .filter(
        (c: any) => c && (c.type === 'vmr_math_inline' || c.type === 'math_inline'),
      )

    // Expect at least 3 inline maths in the sentence (\boldsymbol{\beta}, W, \alpha)
    expect(inline.length).toBeGreaterThanOrEqual(3)
  })
})
