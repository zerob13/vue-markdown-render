<script setup lang="ts">
import NodeRenderer from '../NodeRenderer'

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
  item: ListItem
}>()

defineEmits<{
  copy: [text: string]
}>()
</script>

<template>
  <li class="list-item pl-1.5 my-2" dir="auto">
    <NodeRenderer :nodes="item.children" @copy="$emit('copy', $event)" />
  </li>
</template>

<style scoped>
ol > .list-item::marker{
  color: var(--list-item-counter-marker,#64748b)
}
ul > .list-item::marker{
  color: var(--list-item-marker,#cbd5e1)
}
</style>
