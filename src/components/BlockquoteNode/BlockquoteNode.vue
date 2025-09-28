<script setup lang="ts">
import NodeRenderer from '../NodeRenderer'

// child node shape used across many node components
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

interface BlockquoteNode {
  type: 'blockquote'
  children: NodeChild[]
  raw: string
  // optional citation/source for the blockquote
  cite?: string
}

defineProps<{
  node: BlockquoteNode
}>()

// typed emit for better DX and type-safety when forwarding copy events
defineEmits<{
  copy: [text: string]
}>()
</script>

<template>
  <blockquote class="blockquote" dir="auto" :cite="node.cite">
    <NodeRenderer :nodes="node.children || []" @copy="$emit('copy', $event)" />
  </blockquote>
</template>

<style scoped>
.blockquote {
  font-weight: 500;
  font-style: italic;
  color: var(--blockquote-text-color,#0f172a);
  border-left: 0.25rem solid var(--blockquote-border-color,#e2e8f0);
  quotes: "\201C" "\201D" "\2018" "\2019";
  margin-top: 1.6em;
  margin-bottom: 1.6em;
  padding-left: 1em;
}
</style>
