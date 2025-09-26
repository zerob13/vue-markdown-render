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
    type: 'heading'
    level: number
    text: string
    children: NodeChild[]
    raw: string
  }
}>()

const nodeComponents = getNodeComponents()
</script>

<template>
  <component
    :is="`h${node.level}`"
    class="heading-node"
    :class="[`heading-${node.level}`]"
    dir="auto"
  >
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </component>
</template>

<style scoped>
.heading-node {
  @apply font-medium leading-tight;
}

.heading-1 {
  @apply mt-6 mb-2 text-xl;
}

.heading-2 {
  @apply mt-5 mb-2 text-lg;
}

.heading-3 {
  @apply mt-4 mb-2 text-base;
}

.heading-4 {
  @apply mt-4 mb-2 text-base;
}

.heading-5 {
  @apply mt-3.5 mb-2 text-sm;
}

.heading-6 {
  @apply mt-3.5 mb-2 text-sm text-gray-600;
}
</style>
