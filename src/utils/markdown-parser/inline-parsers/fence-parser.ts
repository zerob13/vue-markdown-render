import type { CodeBlockNode, MarkdownToken } from '../../../types'

function splitUnifiedDiff(content: string) {
  const orig: string[] = []
  const updated: string[] = []
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine
    // skip diff metadata lines
    if (/^(?:diff |index |--- |\+\+\+ |@@ )/.test(line))
      continue

    if (line.startsWith('- ')) {
      orig.push(` ${line.slice(1)}`)
    }
    else if (line.startsWith('+ ')) {
      updated.push(` ${line.slice(1)}`)
    }
    else {
      // fallback: treat as context (no prefix)
      orig.push(line)
      updated.push(line)
    }
  }
  return {
    original: orig.join('\n'),
    updated: updated.join('\n'),
  }
}

export function parseFenceToken(token: MarkdownToken): CodeBlockNode {
  const hasMap = Array.isArray(token.map) && token.map.length === 2
  const meta = (token as any).meta
  const closed = typeof meta?.closed === 'boolean' ? meta.closed : undefined
  const diff = token.info?.startsWith('diff') || false
  const language = diff ? token.info.split(' ')[1] || '' : token.info || ''
  if (isMermaid(language)) {
    return {
      type: 'mermaid',
      language,
      code: token.content || '',
      loading: closed === true ? false : closed === false ? true : !hasMap,
    } as unknown as CodeBlockNode
  }

  if (diff) {
    const { original, updated } = splitUnifiedDiff(token.content || '')
    // 返回时保留原来的 code 字段为 updated（编辑后代码），并额外附加原始与更新的文本
    return {
      type: 'code_block',
      language,
      code: updated || '',
      raw: token.content || '',
      diff,
      loading: closed === true ? false : closed === false ? true : !hasMap,
      originalCode: original,
      updatedCode: updated,
    }
  }

  return {
    type: 'code_block',
    language,
    code: token.content || '',
    raw: token.content || '',
    diff,
    loading: closed === true ? false : closed === false ? true : !hasMap,
  }
}

function isMermaid(language: string): boolean {
  if (!language)
    return false
  const str = 'mermaid'
  for (let i = 0; i < language.length; i++) {
    const char = language[i]
    if (char !== str[i]) {
      return false
    }
  }
  return true
}
