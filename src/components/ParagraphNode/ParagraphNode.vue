<script setup lang="ts">
import TextNode from '../TextNode'
import InlineCodeNode from '../InlineCodeNode'
import ImageNode from '../ImageNode'
import LinkNode from '../LinkNode'
import HardBreakNode from '../HardBreakNode'
import EmphasisNode from '../EmphasisNode'
import StrongNode from '../StrongNode'
import StrikethroughNode from '../StrikethroughNode'
import HighlightNode from '../HighlightNode'
import InsertNode from '../InsertNode'
import SubscriptNode from '../SubscriptNode'
import SuperscriptNode from '../SuperscriptNode'
import EmojiNode from '../EmojiNode'
import CheckboxNode from '../CheckboxNode'
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
    type: 'paragraph'
    children: NodeChild[]
    raw: string
  }
  messageId: string
  threadId?: string
}>()

const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  image: ImageNode,
  link: LinkNode,
  hardbreak: HardBreakNode,
  emphasis: EmphasisNode,
  strong: StrongNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  checkbox: CheckboxNode,
  math_inline: MathInlineNode,
  // reference: ReferenceNode
  // 添加其他内联元素组件
}
</script>

<template>
  <p>
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
      :message-id="messageId"
      :thread-id="threadId"
    />
  </p>
</template>
