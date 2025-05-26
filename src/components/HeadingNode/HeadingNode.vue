<script setup lang="ts">
import TextNode from '../TextNode'
import InlineCodeNode from '../InlineCodeNode'
import LinkNode from '../LinkNode'
import ImageNode from '../ImageNode'
import StrongNode from '../StrongNode'
import EmphasisNode from '../EmphasisNode'
import StrikethroughNode from '../StrikethroughNode'
import HighlightNode from '../HighlightNode'
import InsertNode from '../InsertNode'
import SubscriptNode from '../SubscriptNode'
import SuperscriptNode from '../SuperscriptNode'
import EmojiNode from '../EmojiNode'
import CheckboxNode from '../CheckboxNode'
import FootnoteReferenceNode from '../FootnoteReferenceNode'
import HardBreakNode from '../HardBreakNode'
import MathInlineNode from '../MathInlineNode'
// import ReferenceNode from './ReferenceNode.vue';

// Define the type for the node children
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'heading'
    level: number
    text: string
    children: NodeChild[]
    raw: string
  }
  messageId: string
}>()

const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  link: LinkNode,
  image: ImageNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  checkbox: CheckboxNode,
  footnote_reference: FootnoteReferenceNode,
  hardbreak: HardBreakNode,
  math_inline: MathInlineNode,
  // reference: ReferenceNode
  // 添加其他内联元素组件
}
</script>

<template>
  <component
    :is="`h${node.level}`"
    class="heading-node"
    :class="[`heading-${node.level}`]"
  >
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
      :message-id="messageId"
    />
  </component>
</template>

<style scoped>
.heading-node {
  @apply font-semibold leading-tight;
}

.heading-1 {
  @apply mt-6 mb-2 text-4xl;
}

.heading-2 {
  @apply mt-5 mb-2 text-2xl;
}

.heading-3 {
  @apply mt-4 mb-2 text-xl;
}

.heading-4 {
  @apply mt-4 mb-2 text-base;
}

.heading-5 {
  @apply mt-3.5 mb-2 text-sm;
}

.heading-6 {
  @apply mt-3.5 mb-2 text-sm text-gray-600;
}
</style>
