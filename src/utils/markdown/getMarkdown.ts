import type { MathOptions } from './config'
import MarkdownIt from 'markdown-it'
import { getDefaultMathOptions } from './config'
import { applyContainers } from './plugins/containers'
import { applyMath } from './plugins/math'
import { applyRenderRules } from './renderers'

export interface GetMarkdownOptions extends Record<string, any> {
  markdownItOptions?: Record<string, any>
  enableMath?: boolean
  enableContainers?: boolean
  mathOptions?: { commands?: string[], escapeExclamation?: boolean }
}

export function getMarkdown(opts: GetMarkdownOptions = {}) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    ...(opts.markdownItOptions ?? {}),
  })

  if (opts.enableMath ?? true) {
    const mergedMathOptions: MathOptions = { ...(getDefaultMathOptions() ?? {}), ...(opts.mathOptions ?? {}) }
    applyMath(md, mergedMathOptions)
  }
  if (opts.enableContainers ?? true)
    applyContainers(md)
  applyRenderRules(md)

  // Sanitize any inline child tokens created by plugins that accidentally
  // insert the string 'undefined' as content. This is defensive and keeps
  // downstream parsers stable when a plugin mis-assigns token.content.
  md.core.ruler.after('inline', 'sanitize_undefined_text', (state: any) => {
    if (!state || !Array.isArray(state.tokens))
      return
    for (const token of state.tokens) {
      if (token && token.type === 'inline' && Array.isArray(token.children)) {
        const filtered: any[] = []
        for (const c of token.children) {
          if (!c)
            continue
          if (c.type === 'text' && (c.content === 'undefined' || c.content == null)) {
            continue
          }
          filtered.push(c)
        }
        token.children = filtered
      }
    }
  })

  return md
}
