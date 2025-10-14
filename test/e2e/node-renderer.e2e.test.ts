import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

interface Scenario {
  name: string
  markdown: string
  expectedText?: string | string[]
  props?: Record<string, any>
  assert?: (wrapper: VueWrapper<any>) => void | Promise<void>
}

let MarkdownRender: any

async function flushAll() {
  await nextTick()
  await Promise.resolve()
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
}

async function mountMarkdown(markdown: string, props: Record<string, any> = {}) {
  const wrapper = mount(MarkdownRender, {
    props: {
      content: markdown,
      ...props,
    },
  })
  await flushAll()
  return wrapper
}

function normalizeText(input: string) {
  return input.replace(/\s+/g, ' ').trim()
}

function sanitizeSnapshotHtml(html: string, name: string) {
  if (name.includes('admonition'))
    return html.replace(/admonition-[a-z0-9]+/gi, 'admonition-stable')
  return html
}

describe('MarkdownRender node e2e coverage', () => {
  beforeAll(async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    MarkdownRender = (await import('../../src/components/NodeRenderer')).default
  })

  afterAll(() => {
    ;(Date.now as any).mockRestore?.()
  })

  const scenarios: Scenario[] = [
    {
      name: 'paragraph and text node',
      markdown: 'Simple paragraph content rendered as plain text.',
      expectedText: 'Simple paragraph content rendered as plain text.',
      assert: (wrapper) => {
        const paragraph = wrapper.find('p')
        expect(paragraph.exists()).toBe(true)
      },
    },
    {
      name: 'heading node',
      markdown: '# Heading Node Title',
      expectedText: 'Heading Node Title',
      assert: (wrapper) => {
        const heading = wrapper.find('h1')
        expect(heading.exists()).toBe(true)
      },
    },
    {
      name: 'blockquote node',
      markdown: '> Blockquote rendered content.',
      expectedText: 'Blockquote rendered content.',
      assert: (wrapper) => {
        const blockquote = wrapper.find('blockquote')
        expect(blockquote.exists()).toBe(true)
      },
    },
    {
      name: 'unordered list node',
      markdown: '- Item one\n- Item two',
      expectedText: ['Item one', 'Item two'],
      assert: (wrapper) => {
        const list = wrapper.find('ul')
        expect(list.exists()).toBe(true)
        expect(list.findAll('li')).toHaveLength(2)
      },
    },
    {
      name: 'ordered list node',
      markdown: '1. First entry\n2. Second entry',
      expectedText: ['First entry', 'Second entry'],
      assert: (wrapper) => {
        const list = wrapper.find('ol')
        expect(list.exists()).toBe(true)
        expect(list.findAll('li')).toHaveLength(2)
      },
    },
    {
      name: 'checkbox nodes',
      markdown: '- [x] Completed task\n- [ ] Pending task',
      expectedText: ['Completed task', 'Pending task'],
      assert: (wrapper) => {
        const inputs = wrapper.findAll('input[type="checkbox"]')
        expect(inputs).toHaveLength(2)
        expect((inputs[0].element as HTMLInputElement).checked).toBe(true)
        expect((inputs[1].element as HTMLInputElement).checked).toBe(false)
      },
    },
    {
      name: 'link node',
      markdown: 'Visit [Vue](https://vuejs.org) now.',
      expectedText: ['Visit', 'Vue', 'now.'],
      assert: (wrapper) => {
        const link = wrapper.find('a[href="https://vuejs.org"]')
        expect(link.exists()).toBe(true)
        expect(link.text()).toBe('Vue')
      },
    },
    {
      name: 'image node',
      markdown: '![Vue Logo](https://example.com/vue.png "Vue Logo")',
      assert: (wrapper) => {
        const figure = wrapper.find('figure')
        expect(figure.exists()).toBe(true)
        const img = figure.find('img')
        expect(img.exists()).toBe(true)
        expect(img.attributes('src')).toBe('https://example.com/vue.png')
        expect(img.attributes('alt')).toBe('Vue Logo')
        expect(figure.html()).toContain('Vue Logo')
      },
    },
    {
      name: 'inline code node',
      markdown: 'Here is `const answer = 42` inline.',
      expectedText: ['Here is', 'const answer = 42', 'inline.'],
      assert: (wrapper) => {
        const code = wrapper.find('code')
        expect(code.exists()).toBe(true)
        expect(code.text()).toBe('const answer = 42')
      },
    },
    {
      name: 'code block node',
      markdown: '```ts\nexport const sum = (a: number, b: number) => a + b\n```',
      props: { renderCodeBlocksAsPre: true },
      expectedText: ['export const sum = (a: number, b: number) => a + b'],
      assert: async (wrapper) => {
        await flushAll()
        const fallback = wrapper.find('pre code')
        expect(fallback.exists()).toBe(true)
        expect(fallback.text()).toContain('export const sum = (a: number, b: number) => a + b')
      },
    },
    {
      name: 'mermaid block node',
      markdown: '```mermaid\ngraph LR;A-->B;\n```',
      assert: async (wrapper) => {
        await flushAll()
        await flushAll()
        const mermaid = wrapper.find('._mermaid')
        expect(mermaid.exists()).toBe(true)
        expect(mermaid.html()).toContain('_mermaid')
      },
    },
    {
      name: 'table node',
      markdown: '| Name | Role |\n| --- | --- |\n| Alice | Developer |',
      expectedText: ['Name', 'Role', 'Alice', 'Developer'],
      assert: (wrapper) => {
        const table = wrapper.find('table')
        expect(table.exists()).toBe(true)
        expect(table.findAll('tbody tr')).toHaveLength(1)
      },
    },
    {
      name: 'definition list node',
      markdown: '',
      props: {
        nodes: [
          {
            type: 'definition_list',
            raw: 'Term: Definition details',
            items: [
              {
                type: 'definition_item',
                raw: 'Term: Definition details',
                term: [
                  {
                    type: 'text',
                    content: 'Term',
                    raw: 'Term',
                  },
                ],
                definition: [
                  {
                    type: 'paragraph',
                    raw: 'Definition details',
                    children: [
                      {
                        type: 'text',
                        content: 'Definition details',
                        raw: 'Definition details',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      expectedText: ['Term', 'Definition details'],
      assert: (wrapper) => {
        const dl = wrapper.find('dl')
        expect(dl.exists()).toBe(true)
        expect(dl.findAll('dt')).toHaveLength(1)
        expect(dl.findAll('dd')).toHaveLength(1)
      },
    },
    {
      name: 'footnote nodes',
      markdown: 'A footnote reference[^1].\n\n[^1]: Footnote explanation',
      expectedText: ['A footnote reference', 'Footnote explanation'],
      assert: (wrapper) => {
        const footnoteBlock = wrapper.find('[id="footnote-1"]')
        expect(footnoteBlock.exists()).toBe(true)
        expect(footnoteBlock.text()).toContain('Footnote explanation')
        expect(wrapper.html()).toContain('[1]')
      },
    },
    {
      name: 'footnote reference node',
      markdown: '',
      props: {
        nodes: [
          {
            type: 'footnote_reference',
            id: '1',
            raw: '[^1]',
          },
        ],
      },
      expectedText: [],
      assert: (wrapper) => {
        const reference = wrapper.find('sup.footnote-reference')
        expect(reference.exists()).toBe(true)
        expect(reference.text()).toContain('1')
      },
    },
    {
      name: 'admonition node',
      markdown: '::: warning\nAdmonition content\n:::',
      expectedText: 'Admonition content',
      assert: (wrapper) => {
        const admonition = wrapper.find('.admonition-warning')
        expect(admonition.exists()).toBe(true)
      },
    },
    {
      name: 'thematic break node',
      markdown: 'First section.\n\n---\n\nSecond section.',
      expectedText: ['First section.', 'Second section.'],
      assert: (wrapper) => {
        const hr = wrapper.find('hr')
        expect(hr.exists()).toBe(true)
      },
    },
    {
      name: 'hardbreak node',
      markdown: 'Line one  \nLine two',
      expectedText: ['Line one', 'Line two'],
      assert: (wrapper) => {
        expect(wrapper.findAll('br.hard-break').length).toBeGreaterThan(0)
      },
    },
    {
      name: 'strong node',
      markdown: 'This is **bold text**.',
      expectedText: ['This is', 'bold text'],
      assert: (wrapper) => {
        const strong = wrapper.find('strong')
        expect(strong.exists()).toBe(true)
        expect(strong.text()).toBe('bold text')
      },
    },
    {
      name: 'emphasis node',
      markdown: 'This is *italic text*.',
      expectedText: ['This is', 'italic text'],
      assert: (wrapper) => {
        const em = wrapper.find('em')
        expect(em.exists()).toBe(true)
        expect(em.text()).toBe('italic text')
      },
    },
    {
      name: 'strikethrough node',
      markdown: 'This is ~~deleted text~~.',
      expectedText: ['This is', 'deleted text'],
      assert: (wrapper) => {
        const del = wrapper.find('s, del')
        expect(del.exists()).toBe(true)
      },
    },
    {
      name: 'highlight node',
      markdown: 'Use ==highlighted text== for emphasis.',
      expectedText: ['Use', 'highlighted text', 'for emphasis.'],
      assert: (wrapper) => {
        const mark = wrapper.find('mark.highlight-node')
        expect(mark.exists()).toBe(true)
      },
    },
    {
      name: 'insert node',
      markdown: 'Here comes ++inserted text++ in the paragraph.',
      expectedText: ['Here comes', 'inserted text', 'in the paragraph.'],
      assert: (wrapper) => {
        const ins = wrapper.find('ins.insert-node')
        expect(ins.exists()).toBe(true)
      },
    },
    {
      name: 'subscript node',
      markdown: 'Chemical formula H~2~O is familiar.',
      expectedText: ['Chemical formula', 'H2O', 'is familiar.'],
      assert: (wrapper) => {
        const sub = wrapper.find('sub')
        expect(sub.exists()).toBe(true)
        expect(sub.text()).toBe('2')
      },
    },
    {
      name: 'superscript node',
      markdown: 'Math uses x^2^ frequently.',
      expectedText: ['Math uses', 'x2', 'frequently.'],
      assert: (wrapper) => {
        const sup = wrapper.find('sup')
        expect(sup.exists()).toBe(true)
        expect(sup.text()).toBe('2')
      },
    },
    {
      name: 'emoji node',
      markdown: 'Smile with :smile: emoji.',
      expectedText: ['Smile with', 'emoji.'],
      assert: (wrapper) => {
        const emoji = wrapper.find('span.emoji-node')
        expect(emoji.exists()).toBe(true)
        expect(emoji.text()).toBe('😄')
      },
    },
    {
      name: 'math inline node',
      markdown: 'Einstein wrote $E=mc^2$.',
      expectedText: ['Einstein wrote $E=mc^2$.'],
      assert: async (wrapper) => {
        await flushAll()
        await flushAll()
        const inline = wrapper.find('.math-inline')
        if (inline.exists())
          expect(wrapper.html()).toContain('katex')
        else
          expect(wrapper.text()).toContain('Einstein wrote $E=mc^2$.')
      },
    },
    {
      name: 'math block node',
      markdown: '$$\na^2 + b^2 = c^2\n$$',
      expectedText: ['a^2 + b^2 = c^2'],
      assert: (wrapper) => {
        const block = wrapper.find('.math-block')
        expect(block.exists()).toBe(true)
        expect(wrapper.html()).toContain('katex-display')
      },
    },
    {
      name: 'reference node',
      markdown: 'Cite research [1] for details.',
      expectedText: ['Cite research', 'for details.'],
      assert: (wrapper) => {
        const reference = wrapper.find('span.reference-node')
        expect(reference.exists()).toBe(true)
        expect(reference.text()).toBe('1')
      },
    },
  ]

  for (const scenario of scenarios) {
    it(`renders ${scenario.name}`, async () => {
      const wrapper = await mountMarkdown(scenario.markdown, scenario.props)
      try {
        if (scenario.assert)
          await scenario.assert(wrapper)

        const textContent = normalizeText(wrapper.text())
        if (Array.isArray(scenario.expectedText)) {
          for (const snippet of scenario.expectedText)
            expect(textContent).toContain(snippet)
        }
        else if (typeof scenario.expectedText === 'string' && scenario.expectedText.length > 0)
          expect(textContent).toContain(scenario.expectedText)

        const snapshotHtml = sanitizeSnapshotHtml(wrapper.html(), scenario.name)
        expect(snapshotHtml).toMatchSnapshot()
      }
      finally {
        wrapper.unmount()
      }
    })
  }
})
