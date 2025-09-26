import { defineAsyncComponent } from 'vue'
import AdmonitionNode from '../components/AdmonitionNode'
import BlockquoteNode from '../components/BlockquoteNode'
import CheckboxNode from '../components/CheckboxNode'
import { getUseMonaco } from '../components/CodeBlockNode/utils'
import DefinitionListNode from '../components/DefinitionListNode'
import EmojiNode from '../components/EmojiNode'
import EmphasisNode from '../components/EmphasisNode'
import FootnoteNode from '../components/FootnoteNode'
import FootnoteReferenceNode from '../components/FootnoteReferenceNode'
import HardBreakNode from '../components/HardBreakNode'
import HeadingNode from '../components/HeadingNode'
import HighlightNode from '../components/HighlightNode'
import ImageNode from '../components/ImageNode'
import InlineCodeNode from '../components/InlineCodeNode'
import InsertNode from '../components/InsertNode'
import LinkNode from '../components/LinkNode'
import ListNode from '../components/ListNode'
import MathBlockNode from '../components/MathBlockNode'
import MathInlineNode from '../components/MathInlineNode'
import { getMermaid } from '../components/MermaidBlockNode/mermaid'
import ParagraphNode from '../components/ParagraphNode'
import PreCodeNode from '../components/PreCodeNode'
import ReferenceNode from '../components/ReferenceNode'

import StrikethroughNode from '../components/StrikethroughNode'
import StrongNode from '../components/StrongNode'
import SubscriptNode from '../components/SubscriptNode'
import SuperscriptNode from '../components/SuperscriptNode'
import TableNode from '../components/TableNode'
import TextNode from '../components/TextNode'
import ThematicBreakNode from '../components/ThematicBreakNode'
import { preload } from './preloadMonaco'

// 异步按需加载 CodeBlock 组件；失败时退回为 InlineCodeNode（内联代码渲染）
const CodeBlockNodeAsync = defineAsyncComponent(async () => {
  try {
    await getUseMonaco()
    const mod = await import('../components/CodeBlockNode')
    return mod.default
  }
  catch (e) {
    console.warn(
      '[vue-markdown-render] Optional peer dependencies for CodeBlockNode are missing. Falling back to inline-code rendering (no Monaco). To enable full code block features, please install "vue-use-monaco" and "@iconify/vue".',
      e,
    )
    return PreCodeNode
  }
})

const MermaidBlockNodeAsync = defineAsyncComponent(async () => {
  try {
    await getMermaid()
    const mod = await import('../components/MermaidBlockNode')
    return mod.default
  }
  catch (e) {
    console.warn(
      '[mermaid] Optional peer dependencies for MermaidBlockNode are missing. Falling back to inline-code rendering (no Mermaid). To enable full mermaid features, please install "mermaid" and "@iconify/vue".',
      e,
    )
    return PreCodeNode
  }
})
let code_block: any = null

const globalNodeComponents: Record<string, any> | null = null
preload()
let customComponents: Record<string, any> | null = null
interface CustomComponents {
  text: any
  paragraph: any
  heading: any
  code_block: any
  list: any
  blockquote: any
  table: any
  definition_list: any
  footnote: any
  footnote_reference: any
  admonition: any
  hardbreak: any
  link: any
  image: any
  thematic_break: any
  math_inline: any
  math_block: any
  strong: any
  emphasis: any
  strikethrough: any
  highlight: any
  insert: any
  subscript: any
  superscript: any
  emoji: any
  checkbox: any
  inline_code: any
  reference: any
  [key: string]: any
}
export function setCustomComponents(_customComponents: Partial<CustomComponents>) {
  customComponents = _customComponents
}

export function getNodeComponents(props?: any) {
  // If a global mapping was set via setNodeComponents, prefer it when no
  // per-call props are provided. This preserves previous behavior.
  if (!props && globalNodeComponents)
    return Object.assign(globalNodeComponents, (customComponents || {}))

  props = props || {}

  if (props.renderCodeBlocksAsPre) {
    code_block = PreCodeNode
  }
  else {
    code_block = CodeBlockNodeAsync
  }

  return {
    text: TextNode,
    paragraph: ParagraphNode,
    heading: HeadingNode,
    code_block,
    list: ListNode,
    blockquote: BlockquoteNode,
    table: TableNode,
    definition_list: DefinitionListNode,
    footnote: FootnoteNode,
    footnote_reference: FootnoteReferenceNode,
    admonition: AdmonitionNode,
    hardbreak: HardBreakNode,
    link: LinkNode,
    image: ImageNode,
    thematic_break: ThematicBreakNode,
    math_inline: MathInlineNode,
    math_block: MathBlockNode,
    strong: StrongNode,
    emphasis: EmphasisNode,
    strikethrough: StrikethroughNode,
    highlight: HighlightNode,
    insert: InsertNode,
    subscript: SubscriptNode,
    superscript: SuperscriptNode,
    emoji: EmojiNode,
    checkbox: CheckboxNode,
    inline_code: InlineCodeNode,
    reference: ReferenceNode,
    mermaid: MermaidBlockNodeAsync,
    // 可以添加更多节点类型
    // 例如:custom_node: CustomNode,
    ...(customComponents || {}),
  }
}
