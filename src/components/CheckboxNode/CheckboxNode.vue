<script setup lang="ts">
defineProps<{
  node: {
    type: 'checkbox'
    checked: boolean
    raw: string
  }
}>()
</script>

<template>
  <span class="checkbox-node">
    <input
      type="checkbox"
      :checked="node.checked"
      disabled
      class="checkbox-input"
    >
  </span>
</template>

<style scoped>
.checkbox-node {
  display: inline-flex;
  align-items: center;
  margin-right: 0.5rem;
  height: 1.2rem;
  vertical-align: middle;
}

.checkbox-input {
  margin: 0;
  cursor: default;
}
</style>
