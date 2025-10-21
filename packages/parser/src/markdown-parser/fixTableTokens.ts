import type { MarkdownToken } from '../types'

function createStart() {
  return [
    {
      type: 'table_open',
      tag: 'table',
      attrs: undefined,
      map: undefined,
      children: undefined,
      content: '',
      markup: '',
      info: '',
      level: 0,
      loading: true,
      meta: undefined,
    },
    {
      type: 'thead_open',
      tag: 'thead',
      attrs: undefined,
      block: true,
      level: 1,
      children: undefined,
    },
    {
      type: 'tr_open',
      tag: 'tr',
      attrs: undefined,
      block: true,
      level: 2,
      children: undefined,
    },

  ]
}
function createEnd() {
  return [
    {
      type: 'tr_close',
      tag: 'tr',
      attrs: undefined,
      block: true,
      level: 2,
      children: undefined,
    },
    {
      type: 'thead_close',
      tag: 'thead',
      attrs: undefined,
      block: true,
      level: 1,
      children: undefined,
    },
    {
      type: 'table_close',
      tag: 'table',
      attrs: undefined,
      map: undefined,
      children: undefined,
      content: '',
      markup: '',
      info: '',
      level: 0,
      meta: undefined,
    },
  ]
}
function createTh(text: string) {
  return [{
    type: 'th_open',
    tag: 'th',
    attrs: undefined,
    block: true,
    level: 3,
    children: undefined,
  }, {
    type: 'inline',
    tag: '',
    children: [
      {
        tag: '',
        type: 'text',
        block: false,
        content: text,
        children: undefined,
      },
    ],
    content: text,
    level: 4,
    attrs: undefined,
    block: true,
  }, {
    type: 'th_close',
    tag: 'th',
    attrs: undefined,
    block: true,
    level: 3,
    children: undefined,
  }]
}
export function fixTableTokens(tokens: MarkdownToken[]): MarkdownToken[] {
  const fixedTokens = [...tokens]
  if (tokens.length < 3)
    return fixedTokens
  const i = tokens.length - 2
  const token = tokens[i]

  if (token.type === 'inline') {
    const content = typeof token.content === 'string' ? token.content : ''
    const child0 = token.children && token.children[0]
    if (/^\|(?:[^|\n]+\|?)+/.test(content)) {
      // 解析 table
      const rowSource = child0 && typeof child0.content === 'string' ? child0.content.slice(1) : ''
      const body = rowSource.split('|').map(i => i.trim()).filter(Boolean).flatMap(i => createTh(i))
      const insert = [
        ...createStart(),
        ...body,
        ...createEnd(),
      ]
      fixedTokens.splice(i - 1, 3, ...insert)
    }
    else if (/^\|(?:[^|\n]+\|)+\n\|:?-/.test(content)) {
      // 解析 table
      const rowSource = child0 && typeof child0.content === 'string' ? child0.content.slice(1, -1) : ''
      const body = rowSource.split('|').map(i => i.trim()).flatMap(i => createTh(i))
      const insert = [
        ...createStart(),
        ...body,
        ...createEnd(),
      ]
      fixedTokens.splice(i - 1, 3, ...insert)
    }
    else if (/^\|(?:[^|\n:]+\|)+\n\|:?$/.test(content)) {
      if (typeof token.content === 'string')
        token.content = token.content.slice(0, -2)
      if (token.children)
        token.children.splice(2, 1)
    }
  }

  return fixedTokens
}
