import MarkdownIt from 'markdown-it'
import { applyContainers } from './plugins/containers'
import { applyMath } from './plugins/math'
import { applyRenderRules } from './renderers'

export interface GetMarkdownOptions extends Record<string, any> {
  markdownItOptions?: Record<string, any>
  enableMath?: boolean
  enableContainers?: boolean
}

export function getMarkdown(opts: GetMarkdownOptions = {}) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    ...(opts.markdownItOptions ?? {}),
  })

  if (opts.enableMath ?? true)
    applyMath(md)
  if (opts.enableContainers ?? true)
    applyContainers(md)
  applyRenderRules(md)

  return md
}
