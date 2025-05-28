import MarkdownIt from 'markdown-it'
import mathjax3 from 'markdown-it-mathjax3'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItMark from 'markdown-it-mark'
import { full as markdownItEmoji } from 'markdown-it-emoji'
import markdownItIns from 'markdown-it-ins'
import markdownItCheckbox from 'markdown-it-task-checkbox'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItContainer from 'markdown-it-container'
import { useI18n } from 'vue-i18n'
import {
  parseInlineTokens,
  parseMarkdownToStructure,
  processTokens,
} from './markdown-parser'

// Re-export the node types for backward compatibility
export * from '../types'
export { parseMarkdownToStructure, processTokens, parseInlineTokens }

export function getMarkdown(msgId: string) {
  // import footnote from 'markdown-it-footnote'
  // Create markdown-it instance with configuration
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
  })
  // 配置加粗标记
  md.inline.ruler.before('emphasis', 'strong', (state, silent) => {
    let found = false
    let token
    let pos = state.pos
    const max = state.posMax
    const start = pos
    const marker = state.src.charCodeAt(pos)

    if (silent)
      return false

    if (marker !== 0x2A /* * */ && marker !== 0x5F /* _ */)
      return false

    let scan = pos
    const mem = pos

    // 查找连续的星号或下划线
    while (scan < max && state.src.charCodeAt(scan) === marker) {
      scan++
    }

    const len = scan - pos
    if (len < 2)
      return false

    pos = scan
    const markerCount = len

    // 查找结束标记
    while (pos < max) {
      if (state.src.charCodeAt(pos) === marker) {
        if (state.src.slice(pos, pos + markerCount).length === markerCount) {
          found = true
          break
        }
      }
      pos++
    }

    if (!found) {
      state.pos = mem
      return false
    }

    if (!silent) {
      state.pos = start + markerCount
      token = state.push('strong_open', 'strong', 1)
      token.markup = marker === 0x2A ? '**' : '__'

      token = state.push('text', '', 0)
      token.content = state.src.slice(start + markerCount, pos)

      token = state.push('strong_close', 'strong', -1)
      token.markup = marker === 0x2A ? '**' : '__'
    }

    state.pos = pos + markerCount
    return true
  })

  // Apply additional plugins
  md.use(markdownItSub) // H~2~O -> subscript
  md.use(markdownItSup) // 2^10 -> superscript
  md.use(markdownItMark) // ==marked== -> highlighted text
  md.use(markdownItEmoji) // :smile: -> emoji
  md.use(markdownItCheckbox) // [ ] and [x] -> checkboxes
  md.use(markdownItIns) // ++inserted++ -> inserted text
  md.use(markdownItFootnote) // 添加脚注支持

  // 添加波浪号处理规则
  const waveRule = (state: any, silent: boolean) => {
    const start = state.pos

    if (state.src[start] !== '~')
      return false

    // 检查是否是数字之间的波浪号
    const prevChar = state.src[start - 1]
    const nextChar = state.src[start + 1]
    if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
      if (!silent) {
        const token = state.push('text', '', 0)
        token.content = '~'
      }
      state.pos += 1
      return true
    }

    return false
  }

  // 注册波浪号规则
  md.inline.ruler.before('sub', 'wave', waveRule)

  // 添加警告块支持
  const containers = ['note', 'tip', 'warning', 'danger', 'info', 'caution']
  containers.forEach((name) => {
    md.use(markdownItContainer, name)
  })

  // Custom math inline rule
  const mathInline = (state: any, silent: boolean) => {
    const delimiters: [string, string, boolean][] = [
      ['\\(', '\\)', true],
      ['\\[', '\\]', false],
      ['$$', '$$', true],
    ]

    for (const [open, close, isInline] of delimiters) {
      const start = state.pos
      if (state.src.slice(start, start + open.length) !== open)
        continue

      const end = state.src.indexOf(close, start + open.length)
      if (end === -1)
        continue

      if (!silent) {
        const token = state.push(isInline ? 'math_inline' : 'math_block', 'math', 0)
        token.content = state.src.slice(start + open.length, end)
        token.markup = isInline ? '\\(\\)' : open === '$$' ? '$$' : '\\[\\]'
      }

      state.pos = end + close.length
      return true
    }
    return false
  }

  // Custom math block rule
  const mathBlock = (
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean,
  ) => {
    const delimiters: [string, string][] = [
      ['\\[', '\\]'],
      ['$$', '$$'],
    ]

    // Check for math block at the current position
    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine])

    let matched = false
    let openDelim = ''
    let closeDelim = ''

    for (const [open, close] of delimiters) {
      if (lineText.startsWith(open)) {
        matched = true
        openDelim = open
        closeDelim = close
        break
      }
    }

    if (!matched)
      return false

    // Skip if in silent mode
    if (silent)
      return true

    // Find the closing delimiter
    let nextLine = startLine
    let content = ''
    let found = false

    for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
      const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
      const lineEnd = state.eMarks[nextLine]
      const currentLine = state.src.slice(lineStart, lineEnd)

      // Check if this line has the closing delimiter
      if (currentLine.includes(closeDelim)) {
        found = true
        content += state.src.slice(
          state.bMarks[nextLine] + state.tShift[nextLine],
          state.src.indexOf(closeDelim, state.bMarks[nextLine]),
        )
        break
      }

      content += `${currentLine}\n`
    }

    if (!found)
      return false

    // Create the token
    const token = state.push('math_block', 'math', 0)
    token.content = content.trim()
    token.markup = openDelim === '$$' ? '$$' : '\\[\\]'
    token.map = [startLine, nextLine + 1]
    token.block = true

    // Update parser position
    state.line = nextLine + 1
    return true
  }

  // Register custom rules
  md.inline.ruler.before('escape', 'math', mathInline)
  md.block.ruler.before('paragraph', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })

  // Add rendering rules
  md.renderer.rules.math_inline = (tokens, idx) => {
    const token = tokens[idx]
    return `<span class="math-inline">${token.content}</span>`
  }

  md.renderer.rules.math_block = (tokens, idx) => {
    const token = tokens[idx]
    return `<div class="math-block">${token.content}</div>`
  }
  md.renderer.rules.code_block = (tokens, idx) => tokens[idx].content

  // Configure MathJax
  md.use(mathjax3, {
    tex: {
      inlineMath: [
        ['\\(', '\\)'],
        ['$', '$'],
      ],
      displayMath: [
        ['$$', '$$'],
        ['\\[', '\\]'],
      ],
      processEscapes: true,
      processEnvironments: true,
      processRefs: true,
      digits: /^(?:\d+(?:\{,\}\d{3})*(?:\.\d*)?|\.\d+)/,
    },
  })

  // Disable default code highlighting
  md.options.highlight = null
  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]
    const src = token.attrGet('src') || ''
    const alt = token.content || ''
    const title = token.attrGet('title') || ''
    return `<img src="${src}" alt="${alt}" title="${title}" loading="lazy" class="deepseek-inline-image" />`
  }

  // Custom code block rendering
  md.renderer.rules.fence = (tokens, idx) => {
    const { t } = useI18n()
    const token = tokens[idx]
    const info = token.info ? token.info.trim() : ''
    const str = token.content
    const encodedCode = btoa(unescape(encodeURIComponent(str)))
    const language = info || 'text'
    const uniqueId = `editor-${msgId}-${idx}-${language}`

    return `<div class="code-block" data-code="${encodedCode}" data-lang="${language}" id="${uniqueId}">
      <div class="code-header">
        <span class="code-lang">${language.toUpperCase()}</span>
        <button class="copy-button" data-code="${encodedCode}">${t('common.copyCode')}</button>
      </div>
      <div class="code-editor"></div>
    </div>`
  }

  // Custom reference inline rule
  const referenceInline = (state: any, silent: boolean) => {
    if (state.src[state.pos] !== '[')
      return false

    const match = /^\[(\d+)\]/.exec(state.src.slice(state.pos))
    if (!match)
      return false

    if (!silent) {
      const id = match[1]
      const token = state.push('reference', 'span', 0)
      token.content = id
      token.markup = match[0]
    }

    state.pos += match[0].length
    return true
  }

  // Add rendering rule for references
  md.renderer.rules.reference = (tokens, idx) => {
    const id = tokens[idx].content
    return `<span class="reference-link"
    data-reference-id="${id}"
    role="button"
    tabindex="0"
    title="Click to view reference">${id}</span>`
  }

  // Register custom rule
  md.inline.ruler.before('escape', 'reference', referenceInline)
  return md
}

export function getCommonMarkdown() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
  })
  return md
}

export function renderMarkdown(md: MarkdownIt, content: string) {
  return md.render(content)
}
