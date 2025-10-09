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
    class="whitespace-pre-wrap break-words text-node"
  >
    {{ props.node.content }}
  </span>
</template>

<style scoped>
.text-node {
  display: inline;
  font-weight: inherit;
  vertical-align: middle;
}
</style>
