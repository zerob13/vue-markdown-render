import type { MarkdownToken } from '../../types'

// narrow helper to reduce non-null assertions on text tokens
function isTextToken(t?: MarkdownToken): t is MarkdownToken & { type: 'text', content: string } {
  return !!t && t.type === 'text' && typeof (t as any).content === 'string'
}

export function fixLinkToken(tokens: MarkdownToken[]): MarkdownToken[] {
  tokens = fixLinkToken4(fixLinkToken3(tokens))
  if (tokens.length < 5)
    return tokens
  const first = tokens[tokens.length - 5]
  // use OR and optional chaining to avoid unsafe access
  if (first.type !== 'text' || !(first as any).content?.endsWith('['))
    return fixLinkTokens2(tokens)
  const second = tokens[tokens.length - 4]
  if ((second as any).tag !== 'em')
    return fixLinkTokens2(tokens)
  const last = tokens[tokens.length - 1]
  if (last?.type === 'text' && !(last as any).content?.startsWith(']'))
    return fixLinkTokens2(tokens)

  const third = tokens[tokens.length - 3]
  const lastContent = (last as any).content ?? ''
  const href = lastContent.replace(/^\]\(*/, '')
  const loading = !lastContent.includes(')')
  ;(first as any).content = (first as any).content?.replace(/\[$/, '')
  tokens.splice(tokens.length - 3, 1, {
    type: 'link',
    href,
    text: (third as any).content,
    children: [
      {
        type: 'text',
        content: (third as any).content,
        raw: (third as any).content,
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
  if (first.type !== 'text')
    return tokens

  let href = (tokens[length - 2] as any).content ?? ''
  let count = 4
  if (length !== tokens.length) {
    // 合并 last 到 href
    href += (last as any).content || ''
    count++
  }
  tokens.splice(length - 4, count)
  const content = (third as any).content
  length -= 4
  ;(first as any).content = (first as any).content?.replace(/\[$/, '')
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

export function fixLinkToken3(tokens: MarkdownToken[]): MarkdownToken[] {
  const last = tokens[tokens.length - 1]
  const preLast = tokens[tokens.length - 2]
  const fixedTokens = [...tokens]
  if (last.type !== 'text' || !(last as any).content?.startsWith(')')) {
    return tokens
  }
  if (preLast.type !== 'link_close')
    return tokens

  if (isTextToken(tokens[tokens.length - 5]) && (tokens[tokens.length - 5] as any).content?.endsWith('(')) {
    const content = (tokens[tokens.length - 5] as any).content + (tokens[tokens.length - 3] as any).content + (last as any).content
    // delete exactly 5 tokens starting at length - 5
    fixedTokens.splice(tokens.length - 5, 5, {
      type: 'text',
      content,
      raw: content,
    })
  }
  else {
    // avoid mutating the original array, update the copy
    const lc = ((last as any).content ?? '').slice(1)
    fixedTokens[fixedTokens.length - 1] = { ...(last as any), content: lc }
  }
  return fixedTokens
}

export function fixLinkToken4(tokens: MarkdownToken[]): MarkdownToken[] {
  const fixedTokens = [...tokens]
  for (let i = tokens.length - 1; i >= 3; i--) {
    const token = tokens[i]
    if (token.type === 'link_close') {
      if (tokens[i - 3]?.content?.endsWith('(')) {
        const nextToken = tokens[i + 1]
        if (nextToken?.type === 'text') {
          if (tokens[i - 1].type === 'text' && tokens[i - 3].type === 'text') {
            const content = (tokens[i - 3] as any).content + (tokens[i - 1] as any).content + (nextToken as any).content
            fixedTokens.splice(i - 3, 5, {
              type: 'text',
              content,
              raw: content,
            })
            i -= 3
          }
        }
        else {
          if (tokens[i - 1].type === 'text' && tokens[i - 3].type === 'text') {
            const content = (tokens[i - 3] as any).content + (tokens[i - 1] as any).content
            fixedTokens.splice(i - 3, 4, {
              type: 'text',
              content,
              raw: content,
            })
          }
          i -= 3
        }
      }
    }
  }
  return fixedTokens
}
