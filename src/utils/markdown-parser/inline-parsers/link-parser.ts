import type { LinkNode, MarkdownToken } from '../../../types'
import { parseInlineTokens } from '../index'

export function parseLinkToken(
  tokens: MarkdownToken[],
  startIndex: number,
): {
  node: LinkNode
  nextIndex: number
} {
  const openToken = tokens[startIndex]
  const href = openToken.attrs?.find(attr => attr[0] === 'href')?.[1] || ''
  const title
    = openToken.attrs?.find(attr => attr[0] === 'title')?.[1] || null

  let i = startIndex + 1
  const linkTokens: MarkdownToken[] = []
  const loading = true

  // Collect all tokens between link_open and link_close
  while (i < tokens.length && tokens[i].type !== 'link_close') {
    // Validate: ensure no block-level elements inside link
    // if (isBlockLevelToken(tokens[i].type)) {
    //   throw new Error(`Block-level element "${tokens[i].type}" is not allowed inside a link`)
    // }
    linkTokens.push(tokens[i])
    i++
  }

  // Parse the collected tokens as inline content
  const children = parseInlineTokens(linkTokens)
  const linkText = children
    .map((node) => {
      if ('content' in node)
        return node.content
      return node.raw
    })
    .join('')

  const node: LinkNode = {
    type: 'link',
    href,
    title,
    text: linkText,
    children,
    raw: `[${linkText}](${href}${title ? ` "${title}"` : ''})`,
    loading,
  }

  // Skip to after link_close
  const nextIndex = i < tokens.length ? i + 1 : tokens.length

  return { node, nextIndex }
}
