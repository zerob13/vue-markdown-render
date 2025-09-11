<script setup lang="ts">
import NodeRenderer from '../NodeRenderer'

// 定义警告块节点
interface AdmonitionNode {
  type: 'admonition'
  kind: string
  title: string
  children: { type: string, raw: string }[]
  raw: string
}

// 接收props
defineProps<{
  node: AdmonitionNode
}>()

// 定义事件
defineEmits(['copy'])

// 不同类型的警告块图标
const iconMap = {
  note: 'ℹ️',
  info: 'ℹ️',
  tip: '💡',
  warning: '⚠️',
  danger: '❗',
  caution: '⚠️',
}
</script>

<template>
  <div class="admonition" :class="`admonition-${node.kind}`">
    <div class="admonition-header">
      <span v-if="iconMap[node.kind]" class="admonition-icon">{{
        iconMap[node.kind]
      }}</span>
      <span class="admonition-title">{{ node.title }}</span>
    </div>
    <div class="admonition-content">
      <NodeRenderer :nodes="node.children" @copy="$emit('copy', $event)" />
    </div>
  </div>
</template>

<style scoped>
/* 变量默认（浅色主题）*/
.admonition {
  --admonition-bg: #f8f8f8;
  --admonition-border: #eaecef;
  --admonition-header-bg: rgba(0, 0, 0, 0.03);
  --admonition-text: #111827;
  --admonition-muted: #374151;

  --admonition-note-color: #448aff;
  --admonition-tip-color: #00bfa5;
  --admonition-warning-color: #ff9100;
  --admonition-danger-color: #ff5252;

  margin: 1rem 0;
  padding: 0;
  border-radius: 4px;
  border-left: 4px solid var(--admonition-border);
  background-color: var(--admonition-bg);
  color: var(--admonition-text);
  overflow: hidden;
}

.admonition-header {
  padding: 0.5rem 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  background-color: var(--admonition-header-bg);
  color: var(--admonition-muted);
}

.admonition-icon {
  margin-right: 0.5rem;
  color: inherit;
}

.admonition-content {
  padding: 0.5rem 1rem 1rem;
  color: var(--admonition-text);
}

/* 各种类型只控制边框与 header 颜色（使用更轻的 header 背景，以免过于抢眼） */
.admonition-note {
  border-left-color: var(--admonition-note-color);
}
.admonition-note .admonition-header {
  background-color: rgba(68, 138, 255, 0.06);
  color: var(--admonition-note-color);
}

.admonition-info {
  border-left-color: var(--admonition-note-color);
}
.admonition-info .admonition-header {
  background-color: rgba(68, 138, 255, 0.06);
  color: var(--admonition-note-color);
}

.admonition-tip {
  border-left-color: var(--admonition-tip-color);
}
.admonition-tip .admonition-header {
  background-color: rgba(0, 191, 165, 0.06);
  color: var(--admonition-tip-color);
}

.admonition-warning {
  border-left-color: var(--admonition-warning-color);
}
.admonition-warning .admonition-header {
  background-color: rgba(255, 145, 0, 0.06);
  color: var(--admonition-warning-color);
}

.admonition-danger {
  border-left-color: var(--admonition-danger-color);
}
.admonition-danger .admonition-header {
  background-color: rgba(255, 82, 82, 0.06);
  color: var(--admonition-danger-color);
}

.admonition-caution {
  border-left-color: var(--admonition-warning-color);
}
.admonition-caution .admonition-header {
  background-color: rgba(255, 145, 0, 0.06);
  color: var(--admonition-warning-color);
}

/* 深色模式支持：支持 .dark 类切换与系统偏好 */
.dark .admonition {
  --admonition-bg: #0b1220;
  --admonition-border: rgba(255, 255, 255, 0.06);
  --admonition-header-bg: rgba(255, 255, 255, 0.03);
  --admonition-text: #e6eef8;
  --admonition-muted: #cbd5e1;
}

@media (prefers-color-scheme: dark) {
  .admonition {
    --admonition-bg: #0b1220;
    --admonition-border: rgba(255, 255, 255, 0.06);
    --admonition-header-bg: rgba(255, 255, 255, 0.03);
    --admonition-text: #e6eef8;
    --admonition-muted: #cbd5e1;
  }

  /* 在暗色里稍微增强 header 的语义色块 */
  .admonition-note .admonition-header,
  .admonition-info .admonition-header {
    background-color: rgba(68, 138, 255, 0.12);
    color: var(--admonition-note-color);
  }
  .admonition-tip .admonition-header {
    background-color: rgba(0, 191, 165, 0.12);
    color: var(--admonition-tip-color);
  }
  .admonition-warning .admonition-header {
    background-color: rgba(255, 145, 0, 0.12);
    color: var(--admonition-warning-color);
  }
  .admonition-danger .admonition-header {
    background-color: rgba(255, 82, 82, 0.12);
    color: var(--admonition-danger-color);
  }
}
</style>
