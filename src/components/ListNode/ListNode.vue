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

defineProps<{
  node: {
    type: 'list'
    ordered: boolean
    items: ListItem[]
    raw: string
  }
}>()

defineEmits<{
  copy: [text: string]
}>()
</script>

<template>
  <component :is="node.ordered ? 'ol' : 'ul'" class="list-node">
    <ListItemNode
      v-for="(item, index) in node.items"
      :key="index"
      :item="item"
      @copy="$emit('copy', $event)"
    />
  </component>
</template>
