<script setup lang="ts">
import { getNodeComponents } from '../../utils/nodeComponents'
// import MathInlineNode from '../MathInlineNode'
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

defineProps<{
  node: {
    type: 'subscript'
    children: NodeChild[]
    raw: string
  }
}>()

const nodeComponents = getNodeComponents()
</script>

<template>
  <sub class="subscript-node">
    <component
      :is="nodeComponents[child.type]"
      v-for="(child, index) in node.children"
      :key="index"
      :node="child"
    />
  </sub>
</template>

<style scoped>
.subscript-node {
  font-size: 0.8em;
  vertical-align: sub;
}
</style>
