import { describe, expect, it } from 'vitest'
import { normalizeStandaloneBackslashT } from '../src/utils/markdown/plugins/math'

describe('normalizeStandaloneBackslashT direct tests', () => {
  it('escapes a raw tab to \\t', () => {
    const out = normalizeStandaloneBackslashT('A\tB')
    expect(out).toBe('A\\tB')
  })

  it('escapes raw newline to \\n', () => {
    const out = normalizeStandaloneBackslashT('line1\nline2')
    expect(out).toBe('line1\\nline2')
  })

  it('escapes exclamation to \\!', () => {
    const out = normalizeStandaloneBackslashT('a!b')
    expect(out).toBe('a\\!b')
  })
})
