<script setup lang="ts">
// 定义链接节点
interface LinkNode {
  type: 'link'
  href: string
  title: string | null
  text: string
  children: { type: string, raw: string }[]
  raw: string
  loading?: boolean
}

// 接收props
const { node } = defineProps<{
  node: LinkNode
}>()
</script>

<template>
  <a
    v-show="!node.loading"
    class="link-node"
    :href="node.href"
    :title="node.title || ''"
    :aria-hidden="node.loading ? 'true' : 'false'"
    target="_blank"
    rel="noopener noreferrer"
  >
    {{ node.text }}
  </a>
  <span v-show="node.loading" class="link-loading inline-flex items-baseline gap-1.5" :aria-hidden="!node.loading ? 'true' : 'false'">
    <span class="link-text-wrapper relative inline-block">
      <span class="leading-[normal] link-text">{{ node.text }}</span>
      <span class="underline-anim" aria-hidden="true" />
    </span>
  </span>
</template>

<style scoped>
.link-node {
  color: #0366d6;
  text-decoration: none;
  display: inline-flex;
}

.link-node:hover {
  text-decoration: underline;
  text-underline-offset: .2rem
}
</style>

<style scoped>
.link-loading .link-text-wrapper {
  position: relative;
  display: inline-block;
}

.link-loading .link-text {
  position: relative;
  z-index: 2;
}

.underline-anim {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  bottom: -3px; /* a little below text */
  background: currentColor;
  /* grow symmetrically from the center */
  transform-origin: center center;
  will-change: transform, opacity;
  opacity: 0.9;
  transform: scaleX(0);
  /* animate: draw from left to right (0.6s), hold (0.15s), fade out quickly (0.05s) */
  /* keep previous total duration (0.8s) but grow from center and pause ~200ms after fully drawn */
  animation: underlineLoop 0.8s linear infinite;
}

@keyframes underlineLoop {
  0% { transform: scaleX(0); opacity: 0.9; }
  /* draw to full width by 75% (0.6s) */
  75% { transform: scaleX(1); opacity: 0.9; }
  /* hold at full width until ~99% (~0.2s pause) */
  99% { transform: scaleX(1); opacity: 0.9; }
  /* collapse quickly back to center right at the end */
  100% { transform: scaleX(0); opacity: 0; }
}
</style>
