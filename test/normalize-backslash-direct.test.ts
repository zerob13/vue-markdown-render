import { describe, expect, it } from 'vitest'
import { normalizeStandaloneBackslashT } from '../src/utils/markdown/plugins/math'

describe('normalizeStandaloneBackslashT direct tests', () => {
  it('escapes a raw tab to \\t', () => {
    const out = normalizeStandaloneBackslashT('A\tB')
    expect(out).toBe('A\\tB')
  })

  it('escapes exclamation to \\!', () => {
    const out = normalizeStandaloneBackslashT('a!b')
    expect(out).toBe('a\\!b')
  })
})
