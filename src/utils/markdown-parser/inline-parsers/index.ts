import type { MarkdownToken, ParsedNode, TextNode } from '../../../types'
import { parseCheckboxInputToken, parseCheckboxToken } from './checkbox-parser'
import { parseEmojiToken } from './emoji-parser'
import { parseEmphasisToken } from './emphasis-parser'
import { parseFenceToken } from './fence-parser'
import { fixStrongTokens } from './fixStrongTokens'
import { parseFootnoteRefToken } from './footnote-ref-parser'
import { parseHardbreakToken } from './hardbreak-parser'
import { parseHighlightToken } from './highlight-parser'
import { parseImageToken } from './image-parser'
import { parseInlineCodeToken } from './inline-code-parser'
import { parseInsertToken } from './insert-parser'
import { parseLinkToken } from './link-parser'
import { parseMathInlineToken } from './math-inline-parser'
import { parseReferenceToken } from './reference-parser'
import { parseStrikethroughToken } from './strikethrough-parser'
import { parseStrongToken } from './strong-parser'
import { parseSubscriptToken } from './subscript-parser'
import { parseSuperscriptToken } from './superscript-parser'
import { parseTextToken } from './text-parser'

// Process inline tokens (for text inside paragraphs, headings, etc.)
export function parseInlineTokens(tokens: MarkdownToken[], raw?: string): ParsedNode[] {
  if (!tokens || tokens.length === 0)
    return []

  const result: ParsedNode[] = []
  let currentTextNode: TextNode | null = null

  let i = 0
  tokens = fixStrongTokens(tokens)

  while (i < tokens.length) {
    const token = tokens[i]
    switch (token.type) {
      case 'text': {
        const content = token.content || ''
        if (content === '`' || content === '|') {
          i++
          break
        }
        if (/`[^`]*/.test(content)) {
          // 包含了 `， 需要特殊处理 code
          currentTextNode = null // Reset current text node

          result.push({
            type: 'inline_code',
            code: content.replace(/`/g, ''),
            raw: content || '',
          })
          i++
          break
        }
        if (content === '[') {
          i++
          break
        }
        if (/[^~]*~+[^~]+/.test(content)) {
          // 处理成 parseStrikethroughToken
          const index = content.indexOf('~') || 0
          const _text = content.slice(0, index)
          if (_text) {
            if (currentTextNode) {
              // Merge with the previous text node
              currentTextNode.content += _text
              currentTextNode.raw += _text
            }
            else {
              // Start a new text node
              currentTextNode = {
                type: 'text',
                content: _text || '',
                raw: token.content || '',
              }
              result.push(currentTextNode)
            }
          }
          const strikethroughContent = content.slice(index)
          // 处理成 strikethrough parseStrikethroughToken
          currentTextNode = null // Reset current text node
          // 如果 * 是一个用 parseStrikethroughToken， 否则应该用 parseStrongToken
          // 将 text 包装成 strikethrough token 进行处理
          const { node } = parseStrikethroughToken([
            {
              type: 's_open',
              tag: 's',
              attrs: null,
              map: null,
              children: null,
              content: '',
              markup: '*',
              info: '',
              meta: null,
            },
            {
              type: 'text',
              tag: '',
              attrs: null,
              map: null,
              children: null,
              content: strikethroughContent.replace(/~/g, ''),
              markup: '',
              info: '',
              meta: null,
            },
            {
              type: 's_close',
              tag: 's',
              attrs: null,
              map: null,
              children: null,
              content: '',
              markup: '*',
              info: '',
              meta: null,
            },
          ], 0)
          result.push(node)
          i++
          break
        }
        if (/[^*]*\*\*[^*]+/.test(content)) {
          const index = content.indexOf('*') || 0
          const _text = content.slice(0, index)
          if (_text) {
            if (currentTextNode) {
              // Merge with the previous text node
              currentTextNode.content += _text
              currentTextNode.raw += _text
            }
            else {
              // Start a new text node
              currentTextNode = {
                type: 'text',
                content: _text || '',
                raw: token.content || '',
              }
              result.push(currentTextNode)
            }
          }
          const strongContent = content.slice(index)
          // 处理成 em parseEmphasisToken
          currentTextNode = null // Reset current text node
          // 如果 * 是一个用 parseEmphasisToken， 否则应该用 parseStrongToken
          // 将 text 包装成 emphasis token 进行处理
          const { node } = parseStrongToken([
            {
              type: 'strong_open',
              tag: 'strong',
              attrs: null,
              map: null,
              children: null,
              content: '',
              markup: '*',
              info: '',
              meta: null,
            },
            {
              type: 'text',
              tag: '',
              attrs: null,
              map: null,
              children: null,
              content: strongContent.replace(/\*/g, ''),
              markup: '',
              info: '',
              meta: null,
            },
            {
              type: 'strong_close',
              tag: 'strong',
              attrs: null,
              map: null,
              children: null,
              content: '',
              markup: '*',
              info: '',
              meta: null,
            },
          ], 0, raw)
          result.push(node)
          i++
          break
        }
        else if (/[^*]*\*[^*]+/.test(content)) {
          const index = content.indexOf('*') || 0
          const _text = content.slice(0, index)
          if (_text) {
            if (currentTextNode) {
              // Merge with the previous text node
              currentTextNode.content += _text
              currentTextNode.raw += _text
            }
            else {
              // Start a new text node
              currentTextNode = {
                type: 'text',
                content: _text || '',
                raw: token.content || '',
              }
              result.push(currentTextNode)
            }
          }
          const emphasisContent = content.slice(index)
          // 处理成 em parseEmphasisToken
          currentTextNode = null // Reset current text node
          // 如果 * 是一个用 parseEmphasisToken， 否则应该用 parseStrongToken
          // 将 text 包装成 emphasis token 进行处理
          const { node } = parseEmphasisToken([
            {
              type: 'em_open',
              tag: 'em',
              attrs: null,
              map: null,
              children: null,
              content: '',
              markup: '*',
              info: '',
              meta: null,
            },
            {
              type: 'text',
              tag: '',
              attrs: null,
              map: null,
              children: null,
              content: emphasisContent.replace(/\*/g, ''),
              markup: '',
              info: '',
              meta: null,
            },
            {
              type: 'em_close',
              tag: 'em',
              attrs: null,
              map: null,
              children: null,
              content: '',
              markup: '*',
              info: '',
              meta: null,
            },
          ], 0)
          result.push(node)
          i++
          break
        }
        const imageStart = content.indexOf('![')
        if (imageStart !== -1) {
          const textNodeContent = content.slice(0, imageStart)
          if (!currentTextNode) {
            currentTextNode = {
              type: 'text',
              content: textNodeContent,
              raw: textNodeContent,
            }
          }
          else {
            currentTextNode.content += textNodeContent
          }
          result.push(currentTextNode)
          currentTextNode = null // Reset current text node
          result.push(parseImageToken(token, true))
          i++
          break
        }
        const linkStart = content.indexOf('[')
        if (token.content.endsWith('undefined') && !raw.endsWith('undefined')) {
          token.content = token.content.slice(0, -9)
        }
        const textNode = parseTextToken(token)

        if (linkStart !== -1) {
          const textNodeContent = content.slice(0, linkStart)
          const linkEnd = content.indexOf('](', linkStart)
          if (linkEnd !== -1) {
            result.push({
              type: 'text',
              content: textNodeContent,
              raw: textNodeContent,
            })
            result.push({
              type: 'link',
              href: '',
              text: content.slice(linkStart + 1, linkEnd),
              loading: true,
            } as any)
            i++
            break
          }
        }
        const preToken = tokens[i - 1]
        const maybeMath = preToken?.tag === 'br' && tokens[i - 2]?.content === '['
        if (currentTextNode) {
          // Merge with the previous text node
          currentTextNode.content += textNode.content.replace(/(\*+|\(|\\)$/, '')
          currentTextNode.raw += textNode.raw
          currentTextNode.center = maybeMath
        }
        else {
          // Start a new text node
          textNode.content = textNode.content.replace(/(\*+|\(|\\)$/, '')
          currentTextNode = textNode
          currentTextNode.center = maybeMath
          result.push(currentTextNode)
        }
        i++
        break
      }

      case 'softbreak':
        if (currentTextNode) {
          // Append newline to the current text node
          currentTextNode.content += '\n'
          currentTextNode.raw += '\n' // Assuming raw should also reflect the newline
        }
        // Don't create a node for softbreak itself, just modify text
        i++
        break

      case 'code_inline':
        currentTextNode = null // Reset current text node
        result.push(parseInlineCodeToken(token))
        i++
        break

      case 'link_open': {
        currentTextNode = null // Reset current text node
        const pre = result.length > 0 ? result[result.length - 1] : null
        const { node, nextIndex } = parseLinkToken(tokens, i)
        i = nextIndex
        if (pre?.type === 'link' && pre.loading) {
          break
        }
        node.loading = false
        result.push(node)
        break
      }

      case 'image':
        currentTextNode = null // Reset current text node
        result.push(parseImageToken(token))
        i++
        break

      case 'strong_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseStrongToken(tokens, i, token.content)
        result.push(node)
        i = nextIndex
        break
      }

      case 'em_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseEmphasisToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 's_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseStrikethroughToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'mark_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseHighlightToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'ins_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseInsertToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'sub_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseSubscriptToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'sup_open': {
        currentTextNode = null // Reset current text node
        const { node, nextIndex } = parseSuperscriptToken(tokens, i)
        result.push(node)
        i = nextIndex
        break
      }

      case 'sub':
        currentTextNode = null // Reset current text node
        result.push({
          type: 'subscript',
          children: [
            {
              type: 'text',
              content: token.content || '',
              raw: token.content || '',
            },
          ],
          raw: `~${token.content || ''}~`,
        })
        i++
        break

      case 'sup':
        currentTextNode = null // Reset current text node
        result.push({
          type: 'superscript',
          children: [
            {
              type: 'text',
              content: token.content || '',
              raw: token.content || '',
            },
          ],
          raw: `^${token.content || ''}^`,
        })
        i++
        break

      case 'emoji': {
        currentTextNode = null // Reset current text node

        const preToken = tokens[i - 1]
        if (preToken?.type === 'text' && /\|:-+/.test(preToken.content)) {
          // 处理表格中的 emoji，跳过
          result.push({
            type: 'text',
            content: '',
            raw: '',
          })
        }
        else {
          result.push(parseEmojiToken(token))
        }
        i++
        break
      }
      case 'checkbox':
        currentTextNode = null // Reset current text node
        result.push(parseCheckboxToken(token))
        i++
        break
      case 'checkbox_input':
        currentTextNode = null // Reset current text node
        result.push(parseCheckboxInputToken(token))
        i++
        break
      case 'footnote_ref':
        currentTextNode = null // Reset current text node
        result.push(parseFootnoteRefToken(token))
        i++
        break

      case 'hardbreak':
        currentTextNode = null // Reset current text node
        result.push(parseHardbreakToken())
        i++
        break

      case 'fence': {
        currentTextNode = null // Reset current text node
        // Handle fenced code blocks with language specifications
        result.push(parseFenceToken(tokens[i]))
        i++
        break
      }

      case 'math_inline': {
        currentTextNode = null // Reset current text node
        result.push(parseMathInlineToken(token))
        i++
        break
      }

      case 'reference': {
        currentTextNode = null // Reset current text node
        result.push(parseReferenceToken(token))
        i++
        break
      }

      default:
        // Skip unknown token types, ensure text merging stops
        currentTextNode = null // Reset current text node
        i++
        break
    }
  }

  return result
}
