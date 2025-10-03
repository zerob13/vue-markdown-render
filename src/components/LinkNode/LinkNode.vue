<script setup lang="ts">
import { computed, useAttrs } from 'vue'

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

// 接收props — 把动画/颜色相关配置暴露为props，并通过CSS变量注入样式
const props = defineProps<{
  node: LinkNode
  /** link text / underline color (CSS color string) */
  color?: string
  /** underline height in px */
  underlineHeight?: number
  /** underline bottom offset (px). Can be negative. */
  underlineBottom?: number | string
  /** total animation duration in seconds */
  animationDuration?: number
  /** underline opacity */
  animationOpacity?: number
  /** animation timing function */
  animationTiming?: string
  /** animation iteration (e.g. 'infinite' or a number) */
  animationIteration?: string | number
}>()

const cssVars = computed(() => {
  const bottom = props.underlineBottom !== undefined
    ? (typeof props.underlineBottom === 'number' ? `${props.underlineBottom}px` : String(props.underlineBottom))
    : '-3px'

  return {
    '--link-color': props.color ?? '#0366d6',
    '--underline-height': `${props.underlineHeight ?? 2}px`,
    '--underline-bottom': bottom,
    '--underline-opacity': String(props.animationOpacity ?? 0.9),
    '--underline-duration': `${props.animationDuration ?? 0.8}s`,
    '--underline-timing': props.animationTiming ?? 'linear',
    '--underline-iteration': typeof props.animationIteration === 'number' ? String(props.animationIteration) : (props.animationIteration ?? 'infinite'),
  } as Record<string, string>
})

// forward any non-prop attributes (e.g. custom-id) to the rendered element
const attrs = useAttrs()
</script>

<template>
  <a
    v-if="!node.loading"
    class="link-node"
    :href="node.href"
    :title="node.title || ''"
    :aria-hidden="node.loading ? 'true' : 'false'"
    target="_blank"
    rel="noopener noreferrer"
    v-bind="attrs"
    :style="cssVars"
  >
    {{ node.text }}
  </a>
  <span v-else class="link-loading inline-flex items-baseline gap-1.5" :aria-hidden="!node.loading ? 'true' : 'false'" v-bind="attrs" :style="cssVars">
    <span class="link-text-wrapper relative inline-flex">
      <span class="leading-[normal] link-text">{{ node.text }}</span>
      <span class="underline-anim" aria-hidden="true" />
    </span>
  </span>
</template>

<style scoped>
.link-node {
  color: var(--link-color, #0366d6);
  text-decoration: none;
  display: inline-flex;
}

.link-node:hover {
  text-decoration: underline;
  text-underline-offset: .2rem
}
.link-loading .link-text-wrapper {
  position: relative;
}

.link-loading .link-text {
  position: relative;
  z-index: 2;
}

.underline-anim {
  position: absolute;
  left: 0;
  right: 0;
  height: var(--underline-height, 2px);
  bottom: var(--underline-bottom, -3px); /* a little below text */
  background: currentColor;
  /* grow symmetrically from the center */
  transform-origin: center center;
  will-change: transform, opacity;
  opacity: var(--underline-opacity, 0.9);
  transform: scaleX(0);
  animation: underlineLoop var(--underline-duration, 0.8s) var(--underline-timing, linear) var(--underline-iteration, infinite);
}

@keyframes underlineLoop {
  0% { transform: scaleX(0); opacity: var(--underline-opacity, 0.9); }
  /* draw to full width by 75% (0.6s) */
  75% { transform: scaleX(1); opacity: var(--underline-opacity, 0.9); }
  /* hold at full width until ~99% (~0.2s pause) */
  99% { transform: scaleX(1); opacity: var(--underline-opacity, 0.9); }
  /* collapse quickly back to center right at the end */
  100% { transform: scaleX(0); opacity: 0; }
}
</style>
