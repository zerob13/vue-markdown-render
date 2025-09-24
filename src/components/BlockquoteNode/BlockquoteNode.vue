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
    <!-- guard node.children at runtime to avoid passing undefined -->
    <NodeRenderer :nodes="node.children || []" @copy="$emit('copy', $event)" />
  </blockquote>
</template>

<style scoped>
.blockquote {
  margin: 0 0 1rem;
  padding: 0 1rem;
  color: #6a737d;
  border-left: 0.25rem solid #dfe2e5;
}
</style>
