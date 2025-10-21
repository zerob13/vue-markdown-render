import type { FootnoteReferenceNode, MarkdownToken } from '../../types'

export function parseFootnoteRefToken(
  token: MarkdownToken,
): FootnoteReferenceNode {
  return {
    type: 'footnote_reference',
    id: token.meta?.label || '',
    raw: `[^${token.meta?.label || ''}]`,
  }
}
