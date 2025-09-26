<script setup lang="ts">
import { getNodeComponents } from '../../utils/nodeComponents'

interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'emphasis'
    children: NodeChild[]
    raw: string
  }
}>()

// Available node components for child rendering
const nodeComponents = getNodeComponents()
</script>

<template>
  <em class="emphasis-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </em>
</template>

<style scoped>
.emphasis-node {
  font-style: italic;
}
</style>
