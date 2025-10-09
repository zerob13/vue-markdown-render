import { describe, expect, it } from 'vitest'
import findMatchingClose from '../src/utils/markdown/findMatchingClose'

describe('findMatchingClose', () => {
  it('finds matching close for nested parentheses with escaped braces', () => {
    const src = '\\((\\operatorname{span}\\\\{\\boldsymbol{\\alpha}\\\\})^\\perp\\)'
    // search for the open after the leading '\\('
    const openIdx = src.indexOf('\\(')
    // start looking after the opener
    const found = findMatchingClose(src, openIdx + 2, '\\(', '\\)')
    expect(found).toBeGreaterThan(openIdx)
    expect(src.slice(found, found + 2)).toBe('\\)')
  })

  it('finds matching close for $$ delimiter', () => {
    const src = '$$ E = mc^2 $$ and more'
    const openIdx = src.indexOf('$$')
    const found = findMatchingClose(src, openIdx + 2, '$$', '$$')
    expect(src.slice(found, found + 2)).toBe('$$')
  })

  it('returns -1 if no close found', () => {
    const src = '\\( unclosed math'
    const openIdx = src.indexOf('\\(')
    const found = findMatchingClose(src, openIdx + 2, '\\(', '\\)')
    expect(found).toBe(-1)
  })
})
