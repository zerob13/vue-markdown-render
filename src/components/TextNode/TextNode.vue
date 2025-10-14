<script setup lang="ts">
defineProps<{
  node: {
    type: 'text'
    content: string
    raw: string
    center?: boolean
  }
}>()

defineEmits(['copy'])
</script>

<template>
  <span
    :class="[node.center ? '!inline-flex !justify-center w-full' : '']"
    class="whitespace-pre-wrap break-words text-node"
  >
    {{ node.content }}
  </span>
</template>

<style scoped>
.text-node {
  display: inline;
  font-weight: inherit;
  vertical-align: baseline;
}
</style>
