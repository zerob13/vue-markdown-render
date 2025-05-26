<script setup lang="ts">
import TextNode from '../TextNode'
import InlineCodeNode from '../InlineCodeNode'
import LinkNode from '../LinkNode'
import EmphasisNode from '../EmphasisNode'
import StrikethroughNode from '../StrikethroughNode'
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
    type: 'strong'
    children: NodeChild[]
    raw: string
  }
}>()

// Available node components for child rendering
const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  link: LinkNode,
  emphasis: EmphasisNode,
  strikethrough: StrikethroughNode,
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
  <strong class="strong-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </strong>
</template>

<style scoped>
.strong-node {
  font-weight: bold;
}
</style>
