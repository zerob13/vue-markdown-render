import type { MarkdownToken, MathInlineNode } from '../../../types'

// Parse a math_inline token (inline math expressions)
export function parseMathInlineToken(token: MarkdownToken): MathInlineNode {
  return {
    type: 'math_inline',
    content: token.content || '',
    loading: !!token.loading,
    raw:
      token.markup.replace(/\\/g, '') === '()'
        ? `\(${token.content}\)`
        : `$$${token.content}$$`,
  }
}
