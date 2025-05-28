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
  <span class="whitespace-pre-wrap break-normal" style="font-weight: inherit;">{{ props.node.content }}</span>
</template>

<style scoped></style>
