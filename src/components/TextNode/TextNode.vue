<script setup lang="ts">
const props = defineProps<{
  node: {
    type: 'text'
    content: string
    raw: string
  }
}>()

defineEmits(['copy'])
</script>

<template>
  <span
    class="text-node"
    style="font-weight: inherit; white-space: pre-wrap; word-break: break-word"
    >{{ props.node.content }}</span
  >
</template>

<style scoped>
.text-node {
  display: inline;
}
</style>
