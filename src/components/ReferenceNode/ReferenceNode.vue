<script setup lang="ts">
defineProps<{
  node: {
    type: 'reference'
    id: string
    raw: string
  }
  messageId?: string
  threadId?: string
}>()
defineEmits<{
  (e: 'click'): void
  (e: 'mouseLeave'): void
  (e: 'mouseEnter'): void
}>()
</script>

<template>
  <span
    class="reference-node cursor-pointer bg-accent text-xs rounded-md px-1.5 mx-0.5 hover:bg-secondary"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @mouseenter="$emit('mouseEnter')"
    @mouseleave="$emit('mouseLeave')"
  >
    {{ node.id }}
  </span>
</template>

<style scoped></style>
