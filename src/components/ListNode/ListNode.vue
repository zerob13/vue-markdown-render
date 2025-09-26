<script setup lang="ts">
import ListItemNode from '../ListItemNode'

// 节点子元素类型
interface NodeChild {
  type: string
  raw: string
  [key: string]: unknown
}

// 列表项类型
interface ListItem {
  type: 'list_item'
  children: NodeChild[]
  raw: string
}

const { node } = defineProps<{
  node: {
    type: 'list'
    ordered: boolean
    start?: number
    items: ListItem[]
    raw: string
  }
}>()

defineEmits(['copy'])
</script>

<template>
  <component
    :is="node.ordered ? 'ol' : 'ul'"
    class="list-node"
    :start="node.ordered && node.start && node.start !== 1 ? node.start : undefined"
  >
    <ListItemNode
      v-for="(item, index) in node.items"
      :key="index"
      :item="item"
      @copy="$emit('copy', $event)"
    />
  </component>
</template>

<style scoped>
.list-node {
  margin: 0 0 1rem 1.25rem;
  padding: 0;
}
</style>
