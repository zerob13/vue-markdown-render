<script setup lang="ts">
import TextNode from '../TextNode'
import InlineCodeNode from '../InlineCodeNode'
import LinkNode from '../LinkNode'
import StrongNode from '../StrongNode'
import EmphasisNode from '../EmphasisNode'
import FootnoteReferenceNode from '../FootnoteReferenceNode'
import StrikethroughNode from '../StrikethroughNode'
import HighlightNode from '../HighlightNode'
import InsertNode from '../InsertNode'
import SuperscriptNode from '../SuperscriptNode'
import EmojiNode from '../EmojiNode'
// import MathInlineNode from '../MathInlineNode'
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'subscript'
    children: NodeChild[]
    raw: string
  }
}>()

// Available node components for child rendering
const nodeComponents = {
  text: TextNode,
  inline_code: InlineCodeNode,
  link: LinkNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  footnote_reference: FootnoteReferenceNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  math_inline: MathInlineNode,
  // reference: ReferenceNode
}
</script>

<template>
  <sub class="subscript-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </sub>
</template>

<style scoped>
.subscript-node {
  font-size: 0.8em;
  vertical-align: sub;
}
</style>
