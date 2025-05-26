<script setup lang="ts">
defineProps<{
  node: {
    type: 'emoji'
    emoji: string
    raw: string
  }
}>()
</script>

<template>
  <span class="emoji-node">{{ node.emoji }}</span>
</template>

<style scoped>
.emoji-node {
  display: inline-block;
}
</style>
