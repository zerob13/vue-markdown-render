<script setup lang="ts">
import NodeRenderer from '../NodeRenderer'

interface BlockquoteNode {
  type: 'blockquote'
  children: { type: string, raw: string }[]
  raw: string
}

defineProps<{
  node: BlockquoteNode
  messageId?: string
  threadId?: string
}>()

defineEmits(['copy'])
</script>

<template>
  <blockquote class="blockquote">
    <NodeRenderer
      :nodes="node.children"
      :message-id="messageId"
      :thread-id="threadId"
      @copy="$emit('copy', $event)"
    />
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
