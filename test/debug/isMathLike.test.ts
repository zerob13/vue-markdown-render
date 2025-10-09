import { expect, it } from 'vitest'
import { isMathLike } from '../../src/utils/markdown/plugins/math'

it('recognizes \"\\boldsymbol{...}\" as math-like', () => {
  expect(isMathLike('\\boldsymbol{\\beta}')).toBe(true)
})
