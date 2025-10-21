import type MarkdownIt from 'markdown-it'

export function applyRenderRules(md: MarkdownIt) {
  const defaultImage
    = md.renderer.rules.image
      || function (tokens: any, idx: number, options: any, env: any, self: any) {
        return self.renderToken(tokens, idx, options)
      }

  md.renderer.rules.image = (
    tokens: any,
    idx: number,
    options: any,
    env: any,
    self: any,
  ) => {
    const token = tokens[idx]
    token.attrSet?.('loading', 'lazy')
    return defaultImage(tokens, idx, options, env, self)
  }

  md.renderer.rules.fence
    = md.renderer.rules.fence
      || ((tokens: any, idx: number) => {
        const token = tokens[idx]
        const info = token.info ? token.info.trim() : ''
        const langClass = info
          ? `language-${md.utils.escapeHtml(info.split(/\s+/g)[0])}`
          : ''
        const code = md.utils.escapeHtml(token.content)
        return `<pre class="${langClass}"><code>${code}</code></pre>`
      })
}
