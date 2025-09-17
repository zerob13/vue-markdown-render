<script setup lang="ts">
import type { BaseNode } from '../../utils'

import { computed, ref } from 'vue'
import { preloadMonacoWorkers } from 'vue-use-monaco'
import { getMarkdown, parseMarkdownToStructure } from '../../utils/markdown'
import { setNodeComponents } from '../../utils/nodeComponents'
import AdmonitionNode from '../AdmonitionNode'
import BlockquoteNode from '../BlockquoteNode'
import CheckboxNode from '../CheckboxNode'
import CodeBlockNode from '../CodeBlockNode'
import DefinitionListNode from '../DefinitionListNode'
import EmojiNode from '../EmojiNode'
import EmphasisNode from '../EmphasisNode'
import FootnoteNode from '../FootnoteNode'
import FootnoteReferenceNode from '../FootnoteReferenceNode'
import HardBreakNode from '../HardBreakNode'
import HeadingNode from '../HeadingNode'
import HighlightNode from '../HighlightNode'
import ImageNode from '../ImageNode'
import InlineCodeNode from '../InlineCodeNode'
import InsertNode from '../InsertNode'
import LinkNode from '../LinkNode'
import ListNode from '../ListNode'
import MathBlockNode from '../MathBlockNode'
import MathInlineNode from '../MathInlineNode'
import ParagraphNode from '../ParagraphNode'
import StrikethroughNode from '../StrikethroughNode'
import StrongNode from '../StrongNode'
import SubscriptNode from '../SubscriptNode'

import SuperscriptNode from '../SuperscriptNode'
import TableNode from '../TableNode'
import TextNode from '../TextNode'
import ThematicBreakNode from '../ThematicBreakNode'
import FallbackComponent from './FallbackComponent.vue'

// 组件接收的 props
const props = defineProps<
  | {
    content: string
    nodes?: undefined
    customComponents?: Record<string, any>
  }
  | {
    content?: undefined
    nodes: BaseNode[]
    customComponents?: Record<string, any>
  }
>()

// 定义事件
defineEmits(['copy', 'handleArtifactClick', 'click', 'mouseover', 'mouseout'])
const id = ref(`editor-${Date.now()}`)
const md = getMarkdown(id.value)
const containerRef = ref<HTMLElement>()
// 延迟按需预加载 Monaco（仅在检测到代码块时）
preloadMonacoWorkers()
const parsedNodes = computed<BaseNode[]>(() => {
  // 解析 content 字符串为节点数组
  return props.nodes?.length
    ? props.nodes
    : props.content
      ? parseMarkdownToStructure(props.content, md)
      : []
})

// 组件映射表
const nodeComponents = {
  text: TextNode,
  paragraph: ParagraphNode,
  heading: HeadingNode,
  code_block: CodeBlockNode,
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
  // 可以添加更多节点类型
  // 例如:custom_node: CustomNode,
  ...(props.customComponents || {}),
}
setNodeComponents(nodeComponents)
</script>

<template>
  <div ref="containerRef" class="markdown-renderer">
    <TransitionGroup name="typewriter" tag="div">
      <component
        :is="nodeComponents[node.type] || FallbackComponent"
        v-for="(node, index) in parsedNodes"
        :key="index"
        :node="node"
        :loading="node.loading"
        @copy="$emit('copy', $event)"
        @handle-artifact-click="$emit('handleArtifactClick', $event)"
        @click="$emit('click', $event)"
        @mouseover="$emit('mouseover', $event)"
        @mouseout="$emit('mouseout', $event)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.markdown-renderer {
  position: relative;
  /* 防止内容更新时的布局抖动 */
  contain: layout;
   /* 优化不可见时的渲染成本 */
  content-visibility: auto;
  contain-intrinsic-size: 800px 600px;
}

.unknown-node {
  color: #6a737d;
  font-style: italic;
  margin: 1rem 0;
}
</style>

<style>
/* Global (unscoped) CSS for TransitionGroup enter animations */
.typewriter-enter-from { opacity: 0; }
.typewriter-enter-active {
  transition: opacity var(--typewriter-fade-duration, 900ms)
    var(--typewriter-fade-ease, ease-out);
  will-change: opacity;
}
.typewriter-enter-to { opacity: 1; }
</style>
