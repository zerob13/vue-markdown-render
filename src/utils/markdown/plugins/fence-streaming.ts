import type MarkdownIt from 'markdown-it'

// Replace the built-in fence rule to support streaming (unclosed) fences
// Behavior:
// - If a proper closing fence is found: meta.closed = true
// - If no closing fence yet (streaming): still emit a fence token with meta.closed = false
export function applyFenceStreaming(md: MarkdownIt) {
  md.block.ruler.at(
    'fence',
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      const startPos = state.bMarks[startLine] + state.tShift[startLine]
      const lineMax = state.eMarks[startLine]
      const line = state.src.slice(startPos, lineMax)

      // Detect opening fence (``` or ~~~) with length >= 3
      const headMatch = /^(?:`{3,}|~{3,})/.exec(line)
      if (!headMatch)
        return false
      const marker = headMatch[0]
      const info = line.slice(marker.length).trim()
      if (silent)
        return true

      // Scan forward for a closing fence with the same marker
      let nextLine = startLine + 1
      let closeLine: number | null = null
      while (nextLine < endLine) {
        const sPos = state.bMarks[nextLine] + state.tShift[nextLine]
        const ePos = state.eMarks[nextLine]
        const ln = state.src.slice(sPos, ePos).trim()
        // close if line is only marker with optional trailing spaces
        if (ln.length >= marker.length && ln.startsWith(marker) && /^(?:`{3,}|~{3,})\s*$/.test(ln)) {
          closeLine = nextLine
          break
        }
        nextLine++
      }

      // Emit fence token even if not closed yet (streaming)
      const token = state.push('fence', 'code', 0)
      token.info = info
      token.markup = marker

      if (closeLine != null) {
        token.content = state.getLines(startLine + 1, closeLine, state.tShift[startLine], true)
        token.map = [startLine, closeLine + 1]
        token.meta = { ...(token.meta || {}), closed: true }
        state.line = closeLine + 1
      }
      else {
        token.content = state.getLines(startLine + 1, endLine, state.tShift[startLine], true)
        token.map = [startLine, endLine]
        token.meta = { ...(token.meta || {}), closed: false }
        state.line = endLine
      }

      return true
    },
  )
}
