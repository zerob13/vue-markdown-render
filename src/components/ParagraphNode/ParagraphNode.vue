<script setup lang="ts">
import { getNodeComponents } from '../../utils/nodeComponents'

// import ReferenceNode from './ReferenceNode.vue';
// Define the type for the node children
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'paragraph'
    children: NodeChild[]
    raw: string
  }
}>()
const nodeComponents = getNodeComponents()
</script>

<template>
  <p dir="auto">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </p>
</template>
