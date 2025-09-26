import { defineAsyncComponent } from 'vue'
import AdmonitionNode from '../components/AdmonitionNode'
import BlockquoteNode from '../components/BlockquoteNode'
import CheckboxNode from '../components/CheckboxNode'
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
    const mod = await import('../components/CodeBlockNode')
    return mod.default
  }
  catch (e) {
    console.warn(
      '[vue-markdown-render] Optional peer dependencies for CodeBlockNode are missing. Falling back to inline-code rendering (no Monaco). To enable full code block features, please install "mermaid", "vue-use-monaco" and "@iconify/vue".',
      e,
    )
    return InlineCodeNode
  }
})
let code_block: any = null

// Backwards-compatible global holder. Historically callers used
// setNodeComponents(...) at app root and other components called
// getNodeComponents() with no args. Newer code passes `props` into
// getNodeComponents(props). To support both, expose setNodeComponents and
// accept an optional props argument in getNodeComponents.
let globalNodeComponents: Record<string, any> | null = null
preload()
export function setNodeComponents(component: Record<string, any> | null) {
  globalNodeComponents = component
}

export function getNodeComponents(props?: any) {
  // If a global mapping was set via setNodeComponents, prefer it when no
  // per-call props are provided. This preserves previous behavior.
  if (!props && globalNodeComponents)
    return globalNodeComponents

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
    // 可以添加更多节点类型
    // 例如:custom_node: CustomNode,
    ...(props.customComponents || {}),
  }
}
