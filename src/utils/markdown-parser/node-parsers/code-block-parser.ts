import type { CodeBlockNode, MarkdownToken } from '../../../types'

export function parseCodeBlock(token: MarkdownToken): CodeBlockNode {
  const match = token.content.match(/ type="application\/vnd\.ant\.([^"]+)"/)
  if (match?.[1]) {
    // 需要把 <antArtifact> 标签去掉
    token.content = token.content
      .replace(/<antArtifact[^>]*>/g, '')
      .replace(/<\/antArtifact>/g, '')
  }
  return {
    type: 'code_block',
    language: match ? match[1] : '',
    code: token.content || '',
    raw: token.content || '',
  }
}

export function parseFence(token: MarkdownToken): CodeBlockNode {
  return {
    type: 'code_block',
    language: token.info || '',
    code: token.content || '',
    raw: token.content || '',
    loading: Boolean((token as any).meta?.unclosed),
  }
}
