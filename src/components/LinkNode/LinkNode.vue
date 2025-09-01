<script setup lang="ts">
import NodeRenderer from '../NodeRenderer'

// 定义链接节点
interface LinkNode {
  type: 'link'
  href: string
  title: string | null
  text: string
  children: { type: string; raw: string }[]
  raw: string
}

// 接收props
defineProps<{
  node: LinkNode
}>()

// 定义事件
defineEmits(['copy'])
</script>

<template>
  <a
    class="link-node"
    :href="node.href"
    :title="node.title || ''"
    target="_blank"
    rel="noopener noreferrer"
  >
    <NodeRenderer :nodes="node.children" @copy="$emit('copy', $event)" />
  </a>
</template>

<style scoped>
.link-node {
  color: #0366d6;
  text-decoration: none;
}

.link-node:hover {
  text-decoration: underline;
}
</style>
