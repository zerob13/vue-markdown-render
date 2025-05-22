import type { EmojiNode, MarkdownToken } from '../types'

export function parseEmojiToken(token: MarkdownToken): EmojiNode {
  return {
    type: 'emoji',
    name: token.content || '',
    raw: `:${token.content || ''}:`,
  }
}
