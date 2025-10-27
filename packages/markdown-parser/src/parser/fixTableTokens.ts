import type { MarkdownToken } from '../types'

function createStart() {
  return [
    {
      type: 'table_open',
      tag: 'table',
      attrs: null,
      map: null,
      children: null,
      content: '',
      markup: '',
      info: '',
      level: 0,
      loading: true,
      meta: null,
    },
    {
      type: 'thead_open',
      tag: 'thead',
      attrs: null,
      block: true,
      level: 1,
      children: null,
    },
    {
      type: 'tr_open',
      tag: 'tr',
      attrs: null,
      block: true,
      level: 2,
      children: null,
    },

  ]
}
function createEnd() {
  return [
    {
      type: 'tr_close',
      tag: 'tr',
      attrs: null,
      block: true,
      level: 2,
      children: null,
    },
    {
      type: 'thead_close',
      tag: 'thead',
      attrs: null,
      block: true,
      level: 1,
      children: null,
    },
    {
      type: 'table_close',
      tag: 'table',
      attrs: null,
      map: null,
      children: null,
      content: '',
      markup: '',
      info: '',
      level: 0,
      meta: null,
    },
  ]
}
function createTh(text: string) {
  return [{
    type: 'th_open',
    tag: 'th',
    attrs: null,
    block: true,
    level: 3,
    children: null,
  }, {
    type: 'inline',
    tag: '',
    children: [
      {
        tag: '',
        type: 'text',
        block: false,
        content: text,
        children: null,
      },
    ],
    content: text,
    level: 4,
    attrs: null,
    block: true,
  }, {
    type: 'th_close',
    tag: 'th',
    attrs: null,
    block: true,
    level: 3,
    children: null,
  }]
}
export function fixTableTokens(tokens: MarkdownToken[]): MarkdownToken[] {
  const fixedTokens = [...tokens]
  if (tokens.length < 3)
    return fixedTokens
  const i = tokens.length - 2
  const token = tokens[i]
  if (token.type === 'inline') {
    const tcontent = String(token.content ?? '')
    const childContent = String(token.children?.[0]?.content ?? '')

    if (/^\|(?:[^|\n]+\|?)+/.test(tcontent)) {
      // 解析 table
      const body = childContent.slice(1).split('|').map(i => i.trim()).filter(Boolean).flatMap(i => createTh(i))
      const insert = ([
        ...createStart(),
        ...body,
        ...createEnd(),
      ] as unknown) as MarkdownToken[]
      fixedTokens.splice(i - 1, 3, ...insert)
    }
    else if (/^\|(?:[^|\n]+\|)+\n\|:?-/.test(tcontent)) {
      // 解析 table
      const body = childContent.slice(1, -1).split('|').map(i => i.trim()).flatMap(i => createTh(i))
      const insert = ([
        ...createStart(),
        ...body,
        ...createEnd(),
      ] as unknown) as MarkdownToken[]
      fixedTokens.splice(i - 1, 3, ...insert)
    }
    else if (/^\|(?:[^|\n:]+\|)+\n\|:?$/.test(tcontent)) {
      token.content = tcontent.slice(0, -2)
      token.children!.splice(2, 1)
    }
  }

  return fixedTokens
}
