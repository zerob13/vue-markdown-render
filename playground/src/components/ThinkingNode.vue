<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{ node: any }>()
</script>

<template>
  <div class="thinking-node p-4 my-4 bg-blue-50 dark:bg-blue-900/40 rounded-md border-l-4 border-blue-400">
    <strong>Thinking:</strong>
    <div>{{ node.content }}</div>
  </div>
</template>

<style scoped>
.thinking-node {
  color: #0f172a;
}
.dark .thinking-node {
  color: #e6f0ff;
}
</style>
