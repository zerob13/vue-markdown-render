<script setup lang="ts">
import { getNodeComponents } from '../../utils/nodeComponents'
// import ReferenceNode from '../ReferenceNode';

interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'highlight'
    children: NodeChild[]
    raw: string
  }
}>()

// Available node components for child rendering
const nodeComponents = getNodeComponents()
</script>

<template>
  <mark class="highlight-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </mark>
</template>

<style scoped>
.highlight-node {
  background-color: #ffff00;
  padding: 0 0.2rem;
}
</style>
