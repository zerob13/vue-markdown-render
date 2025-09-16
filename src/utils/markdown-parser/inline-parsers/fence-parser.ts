import type { CodeBlockNode, MarkdownToken } from '../../../types'

export function parseFenceToken(token: MarkdownToken): CodeBlockNode {
  const hasMap = Array.isArray(token.map) && token.map.length === 2
  const meta = (token as any).meta
  const closed = typeof meta?.closed === 'boolean' ? meta.closed : undefined
  return {
    type: 'code_block',
    language: token.info || '',
    code: token.content || '',
    raw: token.content || '',
    loading: closed === true ? false : closed === false ? true : !hasMap,
  }
}
