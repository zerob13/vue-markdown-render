<script setup lang="ts">
import { getNodeComponents } from '../../utils/nodeComponents'
// import ReferenceNode from './ReferenceNode.vue';

interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'superscript'
    children: NodeChild[]
    raw: string
  }
}>()

// Available node components for child rendering
const nodeComponents = getNodeComponents()
</script>

<template>
  <sup class="superscript-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </sup>
</template>

<style scoped>
.superscript-node {
  font-size: 0.8em;
  vertical-align: super;
}
</style>
