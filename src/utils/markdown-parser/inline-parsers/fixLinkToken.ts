import type { MarkdownToken } from '../../../types'

export function fixLinkToken(tokens: MarkdownToken[]): MarkdownToken[] {
  if (tokens.length < 5)
    return tokens
  const first = tokens[tokens.length - 5]
  if (first.type !== 'text' && !first.content.endsWith('['))
    return fixLinkTokens2(tokens)
  const second = tokens[tokens.length - 4]
  if (second.tag !== 'em')
    return fixLinkTokens2(tokens)
  const last = tokens[tokens.length - 1]
  if (!last.content.startsWith(']'))
    return fixLinkTokens2(tokens)

  const third = tokens[tokens.length - 3]
  const href = last.content.replace(/^\]\(*/, '')
  const loading = !last.content.includes(')')
  first.content = first.content.replace(/\[$/, '')
  tokens.splice(tokens.length - 3, 1, {
    type: 'link',
    href,
    text: third.content,
    children: [
      {
        type: 'text',
        content: third.content,
        raw: third.content,
      },
    ],
    loading,
  } as any)
  tokens.splice(tokens.length - 1, 1)
  return tokens
}

export function fixLinkTokens2(tokens: MarkdownToken[]): MarkdownToken[] {
  if (tokens.length < 8)
    return tokens
  let length = tokens.length
  let last = tokens[length - 1]
  if (last.type !== 'link_close') {
    length--
    last = tokens[length - 1]
    if (last.type !== 'link_close')
      return tokens
  }
  const second = tokens[length - 7]
  if (second.type !== 'em_open')
    return tokens
  const third = tokens[length - 6]
  const first = tokens[length - 8]

  let href = tokens[length - 2].content
  let count = 4
  if (length !== tokens.length) {
    // 合并 last 到 href
    href += last.content
    count++
  }
  tokens.splice(length - 4, count)
  const content = third.content
  length -= 4
  first.content = first.content.replace(/\[$/, '')
  tokens.splice(length - 2, 1, {
    type: 'link',
    href,
    text: content,
    children: [
      {
        type: 'text',
        content,
        raw: content,
      },
    ],
    loading: true,
  } as any)
  return tokens
}
