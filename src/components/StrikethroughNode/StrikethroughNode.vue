<script setup lang="ts">
import TextNode from '../TextNode'
import InlineCodeNode from '../InlineCodeNode'
import LinkNode from '../LinkNode'
import StrongNode from '../StrongNode'
import EmphasisNode from '../EmphasisNode'
import HighlightNode from '../HighlightNode'
import InsertNode from '../InsertNode'
import SubscriptNode from '../SubscriptNode'
import SuperscriptNode from '../SuperscriptNode'
import EmojiNode from '../EmojiNode'
import FootnoteReferenceNode from '../FootnoteReferenceNode'
import MathInlineNode from '../MathInlineNode'
// import ReferenceNode from './ReferenceNode.vue';
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'strikethrough'
    children: NodeChild[]
    raw: string
  }
  messageId: string
}>()

// Available node components for child rendering
const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  link: LinkNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  footnote_reference: FootnoteReferenceNode,
  math_inline: MathInlineNode,
  // reference: ReferenceNode
}
</script>

<template>
  <del class="strikethrough-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
      :message-id="messageId"
    />
  </del>
</template>

<style scoped>
.strikethrough-node {
  text-decoration: line-through;
}
</style>
