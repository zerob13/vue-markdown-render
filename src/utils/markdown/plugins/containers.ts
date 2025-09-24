import type MarkdownIt from 'markdown-it'
import markdownItContainer from 'markdown-it-container'

export function applyContainers(md: MarkdownIt) {
  ;[
    'admonition',
    'info',
    'warning',
    'error',
    'tip',
    'danger',
    'note',
    'caution',
  ].forEach((name) => {
    md.use(markdownItContainer, name, {
      render(tokens: any, idx: number) {
        const token = tokens[idx]
        if (token.nesting === 1) {
          return `<div class="vmr-container vmr-container-${name}">`
        }
        else {
          return '</div>\n'
        }
      },
    })
  })

  // fallback for simple ::: blocks (kept for backwards compat)
  md.block.ruler.before(
    'fence',
    'vmr_container_fallback',
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      const startPos = state.bMarks[startLine] + state.tShift[startLine]
      const lineMax = state.eMarks[startLine]
      const markerMatch = state.src
        .slice(startPos, lineMax)
        .match(/^:::\s*(\w+)/)
      if (!markerMatch)
        return false
      if (silent)
        return true

      const name = markerMatch[1]
      let nextLine = startLine + 1
      let found = false
      while (nextLine <= endLine) {
        const sPos = state.bMarks[nextLine] + state.tShift[nextLine]
        const ePos = state.eMarks[nextLine]
        if (state.src.slice(sPos, ePos).trim() === ':::') {
          found = true
          break
        }
        nextLine++
      }
      if (!found)
        return false

      const tokenOpen = state.push('vmr_container_open', 'div', 1)
      tokenOpen.attrSet('class', `vmr-container vmr-container-${name}`)

      const contentLines: string[] = []
      for (let i = startLine + 1; i < nextLine; i++) {
        const sPos = state.bMarks[i] + state.tShift[i]
        const ePos = state.eMarks[i]
        contentLines.push(state.src.slice(sPos, ePos))
      }

      const inline = state.push('inline', '', 0)
      inline.content = contentLines.join('\n')
      inline.map = [startLine + 1, nextLine]
      state.push('paragraph_close', 'p', -1)

      state.push('vmr_container_close', 'div', -1)

      state.line = nextLine + 1
      return true
    },
  )
}
