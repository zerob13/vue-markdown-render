import type { MathOptions } from './config'
import MarkdownIt from 'markdown-it'
import { getDefaultMathOptions } from './config'
import { applyContainers } from './plugins/containers'
import { applyMath } from './plugins/math'
import { applyRenderRules } from './renderers'

export interface FactoryOptions extends Record<string, unknown> {
  markdownItOptions?: Record<string, unknown>
  enableMath?: boolean
  enableContainers?: boolean
  mathOptions?: { commands?: string[], escapeExclamation?: boolean }
}

export function factory(opts: FactoryOptions = {}): MarkdownIt {
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

  return md
}
