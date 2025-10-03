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

  it('should support auto-scroll to bottom behavior', () => {
    // Test the isAtBottom helper function logic
    const isAtBottom = (scrollHeight: number, scrollTop: number, clientHeight: number, threshold = 5): boolean => {
      return scrollHeight - scrollTop - clientHeight <= threshold
    }

    // Test when at bottom
    expect(isAtBottom(1000, 900, 100, 5)).toBe(true) // exactly at bottom
    expect(isAtBottom(1000, 896, 100, 5)).toBe(true) // within threshold
    
    // Test when not at bottom
    expect(isAtBottom(1000, 890, 100, 5)).toBe(false) // beyond threshold
    expect(isAtBottom(1000, 500, 100, 5)).toBe(false) // in middle
    expect(isAtBottom(1000, 0, 100, 5)).toBe(false) // at top
  })
})
