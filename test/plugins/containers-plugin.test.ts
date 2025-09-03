import { describe, expect, it } from 'vitest'
import { getMarkdown } from '../../src/utils/markdown'

describe('containers plugin', () => {
  it('renders admonition container via ::: admonition', () => {
    const md = getMarkdown('t')
    const content = `::: note\nThis is a note\n:::`
    const html = md.render(content)
    expect(html).toContain('vmr-container-note')
    expect(html).toContain('This is a note')
  })

  it('renders multiple container types', () => {
    const md = getMarkdown('t')
    const content = `::: warning\nWarn\n:::\n\n::: tip\nTip\n:::`
    const html = md.render(content)
    expect(html).toContain('vmr-container-warning')
    expect(html).toContain('vmr-container-tip')
  })

  it('renders warning block with expected HTML structure', () => {
    const md = getMarkdown('play')
    const content = `::: warning\n这是一个警告块。\n:::`
    const html = md.render(content)
    // exact wrapper class
    expect(html).toContain('class="vmr-container vmr-container-warning"')
    // contains paragraph with content
    expect(html).toContain('<p>这是一个警告块。</p>')
  })
})
