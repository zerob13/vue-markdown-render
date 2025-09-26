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
    type: 'insert'
    children: NodeChild[]
    raw: string
  }
}>()

// Available node components for child rendering
const nodeComponents = getNodeComponents()
</script>

<template>
  <ins class="insert-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </ins>
</template>

<style scoped>
.insert-node {
  text-decoration: underline;
}
</style>
