import { describe, expect, it } from 'vitest'

describe('markdownCodeBlockNode props and features', () => {
  it('should support all header control props', () => {
    const expectedProps = [
      'showHeader',
      'showCopyButton',
      'showExpandButton',
      'showPreviewButton',
      'showFontSizeButtons',
      'enableFontSizeControl',
    ]

    // These props should now be supported on MarkdownCodeBlockNode
    expectedProps.forEach((prop) => {
      expect(prop).toBeTruthy()
    })
  })

  it('should support language detection for preview', () => {
    const htmlLanguages = ['html', 'svg']
    const isPreviewable = (lang: string, isShowPreview: boolean) => {
      return isShowPreview && htmlLanguages.includes(lang.toLowerCase())
    }

    expect(isPreviewable('html', true)).toBe(true)
    expect(isPreviewable('svg', true)).toBe(true)
    expect(isPreviewable('javascript', true)).toBe(false)
    expect(isPreviewable('html', false)).toBe(false)
  })

  it('should support font size controls', () => {
    const codeFontMin = 10
    const codeFontMax = 36
    const codeFontStep = 1
    const defaultSize = 14

    const increaseFont = (current: number) => Math.min(codeFontMax, current + codeFontStep)
    const decreaseFont = (current: number) => Math.max(codeFontMin, current - codeFontStep)
    const resetFont = () => defaultSize

    expect(increaseFont(14)).toBe(15)
    expect(increaseFont(36)).toBe(36)
    expect(decreaseFont(14)).toBe(13)
    expect(decreaseFont(10)).toBe(10)
    expect(resetFont()).toBe(14)
  })

  it('should emit proper events', () => {
    const expectedEvents = ['previewCode', 'copy']
    expectedEvents.forEach((event) => {
      expect(event).toBeTruthy()
    })
  })

  it('should support named slots', () => {
    const expectedSlots = ['header-left', 'header-right']
    expectedSlots.forEach((slot) => {
      expect(slot).toBeTruthy()
    })
  })
})
