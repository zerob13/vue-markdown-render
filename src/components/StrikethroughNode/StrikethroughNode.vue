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
    type: 'strikethrough'
    children: NodeChild[]
    raw: string
  }
}>()

// Available node components for child rendering
const nodeComponents = getNodeComponents()
</script>

<template>
  <del class="strikethrough-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </del>
</template>

<style scoped>
.strikethrough-node {
  text-decoration: line-through;
}
</style>
