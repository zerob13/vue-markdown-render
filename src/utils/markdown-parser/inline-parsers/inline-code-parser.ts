import type { InlineCodeNode, MarkdownToken } from '../types'

export function parseInlineCodeToken(token: MarkdownToken): InlineCodeNode {
  return {
    type: 'inline_code',
    code: token.content || '',
    raw: token.content || '',
  }
}
