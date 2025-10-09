import type MarkdownIt from 'markdown-it'
// Exported helper for direct testing and reuse
import type { MathOptions } from '../config'

import findMatchingClose from '../findMatchingClose'

// Heuristic to decide whether a piece of text is likely math.
// Matches common TeX commands, math operators, function-call patterns like f(x),
// superscripts/subscripts, and common math words.
// Common TeX formatting commands that take a brace argument, e.g. \boldsymbol{...}
// Keep this list in a single constant so it's easy to extend/test.
export const TEX_BRACE_COMMANDS = [
  'mathbf',
  'boldsymbol',
  'mathbb',
  'mathcal',
  'mathfrak',
  'mathrm',
  'mathit',
  'mathsf',
  'vec',
  'hat',
  'bar',
  'tilde',
  'overline',
  'underline',
  'mathscr',
  'mathnormal',
  'operatorname',
  'mathbf*',
]

// Precompute an escaped, |-joined string of TEX brace commands so we don't
// rebuild it on every call to `isMathLike`.
export const ESCAPED_TEX_BRACE_COMMANDS = TEX_BRACE_COMMANDS.map(c => c.replace(/[.*+?^${}()|[\\]"\]/g, '\\$&')).join('|')

// Common KaTeX/TeX command names that might lose their leading backslash.
// Keep this list conservative to avoid false-positives in normal text.
export const KATEX_COMMANDS = [
  'in',
  'infty',
  'perp',
  'mid',
  'operatorname',
  'to',
  'rightarrow',
  'leftarrow',
  'math',
  'mathrm',
  'mathbf',
  'mathit',
  'mathbb',
  'mathcal',
  'mathfrak',
  'alpha',
  'beta',
  'gamma',
  'delta',
  'epsilon',
  'lambda',
  'sum',
  'prod',
  'int',
  'sqrt',
  'cdot',
  'times',
  'pm',
  'le',
  'ge',
  'neq',
  'sin',
  'cos',
  'tan',
  'log',
  'ln',
  'exp',
  'lim',
  'frac',
]

// Precompute escaped KATEX commands and default regex used by
// `normalizeStandaloneBackslashT` when no custom commands are provided.
// Sort commands by length (desc) before joining so longer commands like
// 'operatorname' are preferred over shorter substrings like 'to'. This
// avoids accidental partial matches when building the regex.
export const ESCAPED_KATEX_COMMANDS = KATEX_COMMANDS
  .slice()
  .sort((a, b) => b.length - a.length)
  .map(c => c.replace(/[.*+?^${}()|[\\]\\\]/g, '\\$&'))
  .join('|')
const CONTROL_CHARS_CLASS = '[\t\r\b\f\v]'
const DEFAULT_KATEX_RE = new RegExp('(^|[^\\\\])(' + `(?:${ESCAPED_KATEX_COMMANDS})\\b|${CONTROL_CHARS_CLASS}` + ')', 'g')

// Precompiled regexes for isMathLike to avoid reconstructing them per-call
const TEX_CMD_RE = /\\[a-z]+/i
const PREFIX_CLASS = '(?:\\\\|\\u0008)'
const TEX_CMD_WITH_BRACES_RE = new RegExp(`${PREFIX_CLASS}(?:${ESCAPED_TEX_BRACE_COMMANDS})\\s*\\{[^}]+\\}`, 'i')
const TEX_SPECIFIC_RE = /\\(?:text|frac|left|right|times)/
const SUPER_SUB_RE = /\^|_/
const OPS_RE = /[=+\-*/^<>]|\\times|\\pm|\\cdot|\\le|\\ge|\\neq/
const FUNC_CALL_RE = /[A-Z]+\s*\([^)]+\)/i
const WORDS_RE = /\b(?:sin|cos|tan|log|ln|exp|sqrt|frac|sum|lim|int|prod)\b/

export function isMathLike(s: string) {
  if (!s)
    return false

  // Normalize accidental control characters that may appear if a single
  // backslash sequence was interpreted in a JS string literal (for example
  // '\\b' becoming a backspace U+0008). Convert such control characters
  // back into their two-character escaped forms so our regexes can match
  // TeX commands reliably.
  // eslint-disable-next-line no-control-regex
  const norm = s.replace(/\u0008/g, '\\b')
  const stripped = norm.trim()

  // quick bailouts
  if (stripped.length > 2000)
    return true // very long blocks likely math

  // TeX commands e.g. \frac, \alpha
  const texCmd = TEX_CMD_RE.test(norm)
  const texCmdWithBraces = TEX_CMD_WITH_BRACES_RE.test(norm)

  // Explicit common TeX tokens (keeps compatibility with previous heuristic)
  const texSpecific = TEX_SPECIFIC_RE.test(norm)
  // caret or underscore for super/subscripts
  const superSub = SUPER_SUB_RE.test(norm)
  // common math operator symbols or named commands
  const ops = OPS_RE.test(norm)
  // function-like patterns: f(x), sin(x)
  const funcCall = FUNC_CALL_RE.test(norm)
  // common math words
  const words = WORDS_RE.test(norm)

  return texCmd || texCmdWithBraces || texSpecific || superSub || ops || funcCall || words
}

export function normalizeStandaloneBackslashT(s: string, opts?: MathOptions) {
  // Map of characters or words that may have lost a leading backslash when
  // interpreted in JS string literals (for example "\b" -> backspace U+0008)
  // Keys may use backslash escapes in the source; the actual string keys
  // become the unescaped character/word (e.g. '\\t' -> '\t' -> tab char).
  // Keys are the actual control characters as they appear in JS strings when
  // an escape was interpreted (e.g. '\\t' -> actual tab char '\t').
  const controlMap: Record<string, string> = {
    '\t': 't',
    '\r': 'r',
    '\b': 'b',
    '\f': 'f',
    '\v': 'v',
    // Note: deliberately omitting \n since real newlines are structural and
    // shouldn't be collapsed into a two-character escape in most cases.
  }

  // use top-level KATEX_COMMANDS constant

  // Build a regex that matches either a lone control character (tab, etc.)
  // or one of the known command words that is NOT already prefixed by a
  // backslash. We ensure the matched word isn't part of a larger word by
  // using a word boundary where appropriate.
  const commands = opts?.commands ?? KATEX_COMMANDS
  const escapeExclamation = opts?.escapeExclamation ?? true

  // Choose a prebuilt regex when using default command set for performance,
  // otherwise build one from the provided commands.
  const re = (opts?.commands == null)
    ? DEFAULT_KATEX_RE
    : new RegExp('(^|[^\\\\])(' + `(?:${commands.slice().sort((a, b) => b.length - a.length).map(c => c.replace(/[.*+?^${}()|[\\]\\\]/g, '\\$&')).join('|')})\\b|${CONTROL_CHARS_CLASS}` + ')', 'g')

  let out = s.replace(re, (_m, p1, p2) => {
    // If p2 is a control character, map it to its escaped letter (t, r, ...)
    if (controlMap[p2] !== undefined) {
      return `${p1}\\${controlMap[p2]}`
    }

    // Otherwise if it's one of the katex command words, prefix with backslash
    if (commands.includes(p2))
      return `${p1}\\${p2}`

    return _m
  })

  // Escape standalone '!' but don't double-escape already escaped ones.
  if (escapeExclamation)
    out = out.replace(/(^|[^\\])!/g, '$1\\!')

  // Final pass: some TeX command names take a brace argument and may have
  // lost their leading backslash, e.g. "operatorname{span}". Ensure we
  // restore a backslash before known brace-taking commands when they are
  // followed by '{' and are not already escaped.
  // Use default escaped list when possible.
  const braceEscaped = (opts?.commands == null) ? ESCAPED_KATEX_COMMANDS : commands.map(c => c.replace(/[.*+?^${}()|[\\]\\\]/g, '\\$&')).join('|')
  if (braceEscaped) {
    const braceCmdRe = new RegExp(`(^|[^\\\\])(${braceEscaped})\\s*\\{`, 'g')
    out = out.replace(braceCmdRe, (_m, p1, p2) => `${p1}\\${p2}{`)
  }
  return out
}
export function applyMath(md: MarkdownIt, mathOpts?: MathOptions) {
  // Inline rule for \(...\) and $$...$$ and $...$
  const mathInline = (state: any, silent: boolean) => {
    const delimiters: [string, string][] = [
      ['$$', '$$'],
      ['\\(', '\\)'],
      ['(', ')'],
    ]
    let searchPos = 0
    // use findMatchingClose from util

    for (const [open, close] of delimiters) {
      // We'll scan the entire inline source and tokenize all occurrences
      const src = state.src
      let foundAny = false

      const pushText = (text: string) => {
        if (!text)
          return
        const t = state.push('text', '', 0)
        t.content = text
      }

      while (true) {
        if (searchPos >= src.length)
          break
        const index = src.indexOf(open, searchPos)
        if (index === -1)
          break

        // 有可能遇到 \((\operatorname{span}\\{\boldsymbol{\alpha}\\})^\perp\)
        // 这种情况，前面的 \( 是数学公式的开始，后面的 ( 是普通括号
        // endIndex 需要找到与 open 对应的 close
        // 不能简单地用 indexOf 找到第一个 close — 需要处理嵌套与转义字符
        const endIdx = findMatchingClose(src, index + open.length, open, close)
        if (endIdx === -1) {
          // no matching close for this opener; skip forward
          searchPos = index + open.length
          continue
        }

        const content = src.slice(index + open.length, endIdx)

        foundAny = true

        if (!silent) {
          // push text before this math
          const before = src.slice(0, index)
          // If we already consumed some content, avoid duplicating the prefix
          // Only push the portion from previous search position
          const prevConsumed = src.slice(0, searchPos)
          let isStrongPrefix = false
          let toPushBefore = prevConsumed ? src.slice(searchPos, index) : before
          if (isStrongPrefix = index !== 0 && /(?:^|[^\\])(?:__|\*\*)/.test(before.slice(state.pos))) {
            toPushBefore = before.slice(state.pos, index)
          }
          else {
            isStrongPrefix = index !== 0 && /(?:^|[^\\])(?:__|\*\*)/.test(toPushBefore)
          }
          // strong prefix handling (preserve previous behavior)
          pushText(isStrongPrefix ? toPushBefore.replace(/^\*+/, '') : toPushBefore)

          const token = state.push('math_inline', 'math', 0)
          token.content = normalizeStandaloneBackslashT(content, mathOpts)
          token.markup = open === '$$' ? '$$' : open === '\\(' ? '\\(\\)' : open === '$' ? '$' : '()'

          // we'll handle the trailing text after loop; but to preserve the
          // original behaviour when strong prefix was detected, mimic it here
          if (isStrongPrefix) {
            const textToken = state.push('strong_open', '', 0)
            textToken.markup = src.slice(0, index + 2)
            const textContentToken = state.push('text', '', 0)
            textContentToken.content = src.slice(endIdx + close.length).replace(/\*+$/, '')
            state.push('strong_close', '', 0)
            // since we've pushed the remainder as part of strong, we're done
            state.pos = src.length
            searchPos = src.length
            continue
          }

          // advance searchPos to continue scanning after this match
        }

        searchPos = endIdx + close.length
        // continue scanning for further matches
      }

      if (foundAny) {
        if (!silent) {
          // push remaining text after last match
          if (searchPos < src.length)
            pushText(src.slice(searchPos))
          // consume the full inline source
          state.pos = src.length
        }
        else {
          // in silent mode, advance position past what we scanned
          state.pos = searchPos
        }

        return true
      }
    }

    return false
  }

  // Block math rule similar to previous implementation
  const mathBlock = (
    state: any,
    startLine: number,
    endLine: number,
    silent: boolean,
  ) => {
    if (silent)
      return true

    const delimiters: [string, string][] = [
      ['\\[', '\\]'],
      ['$$', '$$'],
      ['[', ']'],
    ]

    const startPos = state.bMarks[startLine] + state.tShift[startLine]
    const lineText = state.src.slice(startPos, state.eMarks[startLine]).trim()
    let matched = false
    let openDelim = ''
    let closeDelim = ''

    for (const [open, close] of delimiters) {
      if (lineText === open || lineText.startsWith(open)) {
        if (open === '[') {
          if (lineText === '[') {
            if (startLine + 1 < endLine) {
              const nextLineStart
                = state.bMarks[startLine + 1] + state.tShift[startLine + 1]
              const nextLineText = state.src.slice(
                nextLineStart,
                state.eMarks[startLine + 1],
              )
              const hasMathContent = isMathLike(nextLineText)
              if (hasMathContent) {
                matched = true
                openDelim = open
                closeDelim = close
                break
              }
            }
            continue
          }
        }
        else {
          matched = true
          openDelim = open
          closeDelim = close
          break
        }
      }
    }

    if (!matched)
      return false
    if (
      lineText.includes(closeDelim)
      && lineText.indexOf(closeDelim) > openDelim.length
    ) {
      const startDelimIndex = lineText.indexOf(openDelim)
      const endDelimIndex = lineText.indexOf(
        closeDelim,
        startDelimIndex + openDelim.length,
      )
      const content = lineText.slice(
        startDelimIndex + openDelim.length,
        endDelimIndex,
      )

      // For the heuristic-only bracket delimiter '[', check content is math-like
      if (openDelim === '[' && !isMathLike(content))
        return false

      const token: any = state.push('math_block', 'math', 0)

      token.content = normalizeStandaloneBackslashT(content, mathOpts) // 规范化 \t -> \\\t
      token.markup
        = openDelim === '$$' ? '$$' : openDelim === '[' ? '[]' : '\\[\\]'
      token.map = [startLine, startLine + 1]
      token.block = true

      state.line = startLine + 1
      return true
    }

    let nextLine = startLine
    let content = ''
    let found = false

    const firstLineContent
      = lineText === openDelim ? '' : lineText.slice(openDelim.length)

    if (firstLineContent.includes(closeDelim)) {
      const endIndex = firstLineContent.indexOf(closeDelim)
      content = firstLineContent.slice(0, endIndex)
      found = true
      nextLine = startLine
    }
    else {
      if (firstLineContent)
        content = firstLineContent

      for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
        const lineStart = state.bMarks[nextLine] + state.tShift[nextLine] - 1
        const lineEnd = state.eMarks[nextLine]
        const currentLine = state.src.slice(lineStart, lineEnd)
        if (currentLine.trim() === closeDelim) {
          found = true
          break
        }
        else if (currentLine.includes(closeDelim)) {
          found = true
          const endIndex = currentLine.indexOf(closeDelim)
          content += (content ? '\n' : '') + currentLine.slice(0, endIndex)
          break
        }
        content += (content ? '\n' : '') + currentLine
      }
    }

    // For bracket-delimited math, ensure it's math-like before accepting
    if (openDelim === '[' && !isMathLike(content))
      return false

    const token: any = state.push('math_block', 'math', 0)
    token.content = normalizeStandaloneBackslashT(content, mathOpts) // 规范化 \t -> \\\t
    token.markup
      = openDelim === '$$' ? '$$' : openDelim === '[' ? '[]' : '\\[\\]'
    token.map = [startLine, nextLine + 1]
    token.block = true
    token.loading = !found

    state.line = nextLine + 1
    return true
  }

  // Register math before the escape rule so inline math is tokenized
  // before markdown-it processes backslash escapes. This preserves
  // backslashes inside math content (e.g. "\\{") instead of having
  // the escape rule remove them from the token content.
  md.inline.ruler.before('escape', 'math', mathInline)
  md.block.ruler.before('paragraph', 'math_block', mathBlock, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  })
}
