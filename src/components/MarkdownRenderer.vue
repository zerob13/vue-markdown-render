<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type {
  ParsedNode,
} from '../utils'
import {
  getMarkdown,
  parseMarkdownToStructure,
} from '../utils'
import NodeRenderer from './NodeRenderer.vue'

const props = defineProps<{
  content: string
  messageId: string
  threadId?: string
  debug?: boolean
}>()

defineEmits(['copy'])

const id = ref(`editor-${uuidv4()}`)

const md = getMarkdown(id.value)

// Parse markdown into structured nodes
const parsedNodes = computed<ParsedNode[]>(() => {
  return parseMarkdownToStructure(props.content, md)
})
</script>

<template>
  <div class="prose prose-sm dark:prose-invert w-full max-w-none break-all">
    <pre v-if="debug">{{ JSON.stringify(parsedNodes, null, 2) }}</pre>
    1121212
    <!-- 使用结构化节点渲染 -->
    <NodeRenderer
      :nodes="parsedNodes"
      :message-id="messageId"
      :thread-id="threadId"
      @copy="$emit('copy', $event)"
    />
  </div>
</template>
