<script setup lang="ts">
import type { MonacoTheme } from 'vue-use-monaco'
import type { BaseNode } from '../../utils'
import { computed, ref } from 'vue'
import { getMarkdown, parseMarkdownToStructure } from '../../utils/markdown'
import { getNodeComponents } from '../../utils/nodeComponents'
import FallbackComponent from './FallbackComponent.vue'

// 组件接收的 props
// 增加用于统一设置所有 code_block 主题和 Monaco 选项的外部 API
const props = defineProps<
  | {
    content: string
    nodes?: undefined
    // 全局传递到每个 CodeBlockNode 的主题（monaco theme 对象）
    codeBlockDarkTheme?: any
    codeBlockLightTheme?: any
    // 传递给 CodeBlockNode 的 monacoOptions（比如 fontSize, MAX_HEIGHT 等）
    codeBlockMonacoOptions?: Record<string, any>
    /** If true, render all `code_block` nodes as plain <pre><code> blocks instead of the full CodeBlockNode */
    renderCodeBlocksAsPre?: boolean
    /** Minimum width forwarded to CodeBlockNode (px or CSS unit) */
    codeBlockMinWidth?: string | number
    /** Maximum width forwarded to CodeBlockNode (px or CSS unit) */
    codeBlockMaxWidth?: string | number
    /** Arbitrary props to forward to every CodeBlockNode */
    codeBlockProps?: Record<string, any>
    themes?: MonacoTheme[]
  }
  | {
    content?: undefined
    nodes: BaseNode[]
    codeBlockDarkTheme?: any
    codeBlockLightTheme?: any
    codeBlockMonacoOptions?: Record<string, any>
    /** If true, render all `code_block` nodes as plain <pre><code> blocks instead of the full CodeBlockNode */
    renderCodeBlocksAsPre?: boolean
    /** Minimum width forwarded to CodeBlockNode (px or CSS unit) */
    codeBlockMinWidth?: string | number
    /** Maximum width forwarded to CodeBlockNode (px or CSS unit) */
    codeBlockMaxWidth?: string | number
    /** Arbitrary props to forward to every CodeBlockNode */
    codeBlockProps?: Record<string, any>
    themes?: MonacoTheme[]
  }
>()

// 定义事件
defineEmits(['copy', 'handleArtifactClick', 'click', 'mouseover', 'mouseout'])
const md = getMarkdown()
const containerRef = ref<HTMLElement>()
const parsedNodes = computed<BaseNode[]>(() => {
  // 解析 content 字符串为节点数组
  return props.nodes?.length
    ? props.nodes
    : props.content
      ? parseMarkdownToStructure(props.content, md)
      : []
})

// 组件映射表
const nodeComponents = getNodeComponents(props)
</script>

<template>
  <div ref="containerRef" class="markdown-renderer">
    <TransitionGroup name="typewriter" tag="div">
      <component
        :is="nodeComponents[node.type] || FallbackComponent"
        v-for="(node, index) in parsedNodes"
        :key="index"
        :node="node"
        :loading="node.loading"
        v-bind="(node.type === 'code_block' && !props.renderCodeBlocksAsPre) ? {
          darkTheme: props.codeBlockDarkTheme,
          lightTheme: props.codeBlockLightTheme,
          monacoOptions: props.codeBlockMonacoOptions,
          themes: props.themes,
          minWidth: props.codeBlockMinWidth,
          maxWidth: props.codeBlockMaxWidth,
          ...(props.codeBlockProps || {}),
        } : {}"
        @copy="$emit('copy', $event)"
        @handle-artifact-click="$emit('handleArtifactClick', $event)"
        @click="$emit('click', $event)"
        @mouseover="$emit('mouseover', $event)"
        @mouseout="$emit('mouseout', $event)"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.markdown-renderer {
  position: relative;
  /* 防止内容更新时的布局抖动 */
  contain: layout;
   /* 优化不可见时的渲染成本 */
  content-visibility: auto;
  contain-intrinsic-size: 800px 600px;
}

.unknown-node {
  color: #6a737d;
  font-style: italic;
  margin: 1rem 0;
}
</style>

<style>
/* Global (unscoped) CSS for TransitionGroup enter animations */
.typewriter-enter-from { opacity: 0; }
.typewriter-enter-active {
  transition: opacity var(--typewriter-fade-duration, 900ms)
    var(--typewriter-fade-ease, ease-out);
  will-change: opacity;
}
.typewriter-enter-to { opacity: 1; }
</style>
