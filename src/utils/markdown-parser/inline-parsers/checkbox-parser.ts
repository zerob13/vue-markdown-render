import type { CheckboxInputNode, CheckboxNode, MarkdownToken } from '../../../types'

export function parseCheckboxToken(token: MarkdownToken): CheckboxNode {
  return {
    type: 'checkbox',
    checked: token.meta?.checked === true,
    raw: token.meta?.checked ? '[x]' : '[ ]',
  }
}

export function parseCheckboxInputToken(token: any): CheckboxInputNode {
  return {
    type: 'checkbox_input',
    checked: token.attrGet('checked') === '' || token.attrGet('checked') === 'true',
    raw: token.attrGet('checked') === '' || token.attrGet('checked') === 'true' ? '[x]' : '[ ]',
  }
}
