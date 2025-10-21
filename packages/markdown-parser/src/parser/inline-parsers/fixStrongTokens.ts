import type { MarkdownToken } from '../../types'

export function fixStrongTokens(tokens: MarkdownToken[]): MarkdownToken[] {
  const fixedTokens = [...tokens]
  if (tokens.length < 4)
    return fixedTokens
  const i = tokens.length - 4
  const token = tokens[i]
  const nextToken = tokens[i + 1]
  if (token.type === 'text' && token.content.endsWith('*') && nextToken.type === 'em_open') {
    // 解析有问题，要合并 emphasis 和 前面的 * 为 strong
    const _nextToken = tokens[i + 2]
    const count = _nextToken?.type === 'text' ? 4 : 3
    const insert = [
      {
        type: 'strong_open',
        tag: 'strong',
        attrs: null,
        map: null,
        children: null,
        content: '',
        markup: '**',
        info: '',
        meta: null,
      },
      {
        type: 'text',
        content: _nextToken?.type === 'text' ? _nextToken.content : '',
      },
      {
        type: 'strong_close',
        tag: 'strong',
        attrs: null,
        map: null,
        children: null,
        content: '',
        markup: '**',
        info: '',
        meta: null,
      },
    ] as any
    const beforeText = token.content.slice(0, -1)
    if (beforeText) {
      insert.unshift({
        type: 'text',
        content: beforeText,
        raw: beforeText,
      })
    }
    fixedTokens.splice(i, count, ...insert)
    return fixedTokens
  }

  return fixedTokens
}
