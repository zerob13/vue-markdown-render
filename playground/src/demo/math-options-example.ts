import { getMarkdown } from '../../../src/utils/markdown/getMarkdown'
import { KATEX_COMMANDS } from '../../../src/utils/markdown/plugins/math'

// Example: create a MarkdownIt instance with custom math options
export const mdWithMathOpts = getMarkdown({
  mathOptions: {
    commands: [...KATEX_COMMANDS, 'infty', 'perp'],
    escapeExclamation: false,
  },
})

export const rendered = mdWithMathOpts.render('Here is math: $infty$ and bang !')
