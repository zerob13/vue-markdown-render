<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSafeI18n } from '../../composables/useSafeI18n'

// 定义图片节点类型
interface ImageNode {
  type: 'image'
  src: string
  alt: string
  title: string | null
  raw: string
}

// 接收props：node 是必须，其他为可选配置（fallback、是否显示caption、是否启用lazy）
const props = withDefaults(defineProps<{
  node: ImageNode
  fallbackSrc?: string
  showCaption?: boolean
  lazy?: boolean
  svgMinHeight?: string
}>(), {
  fallbackSrc: '',
  showCaption: true,
  lazy: true,
  svgMinHeight: '12rem',
})

// 事件：load / error
const emit = defineEmits<{ (e: 'load', src: string): void, (e: 'error', src: string): void }>()

// 图片加载状态
const imageLoaded = ref(false)
const hasError = ref(false)
const fallbackTried = ref(false)

// 计算当前用于渲染的 src（当有 error 且提供 fallback 时使用 fallback）
const displaySrc = computed(() => {
  if (hasError.value && props.fallbackSrc && !fallbackTried.value) {
    // this case shouldn't normally happen because we flip fallbackTried in the handler,
    // but keep defensive: prefer fallback when available
    return props.fallbackSrc
  }
  if (hasError.value && props.fallbackSrc && fallbackTried.value) {
    return props.fallbackSrc
  }
  return props.node.src
})

// 是否为 svg 文件（可能没有内置尺寸）
const isSvg = computed(() => /\.svg(?:\?|$)/i.test(displaySrc.value))

// 处理图片加载错误：尝试一次 fallback，否则保留错误状态
function handleImageError() {
  if (props.fallbackSrc && !fallbackTried.value) {
    fallbackTried.value = true
    hasError.value = true
    // leave imageLoaded false so placeholder/spinner can show while fallback loads
  }
  else {
    hasError.value = true
    emit('error', props.node.src)
  }
}

// 处理图片加载完成
function handleImageLoad() {
  imageLoaded.value = true
  hasError.value = false
  emit('load', displaySrc.value)
}

// 当 node.src 改变时，重置状态以便重新加载
watch(
  () => props.node.src,
  () => {
    imageLoaded.value = false
    hasError.value = false
    fallbackTried.value = false
  },
)

const { t } = useSafeI18n()
</script>

<template>
  <figure class="text-center my-4">
    <div class="relative inline-block">
      <!-- 图片展示区域：当有错误且没有 fallback 时显示占位符 -->
      <img
        v-if="!hasError || (hasError && (fallbackTried || props.fallbackSrc))"
        :src="displaySrc"
        :alt="props.node.alt || props.node.title || ''"
        :title="props.node.title || props.node.alt"
        class="max-w-96 h-auto rounded-lg transition-opacity duration-150"
        :style="isSvg ? { minHeight: props.svgMinHeight, width: '100%', height: 'auto', objectFit: 'contain' } : undefined"
        :class="{ 'opacity-0': !imageLoaded, 'opacity-100': imageLoaded }"
        :loading="props.lazy ? 'lazy' : 'eager'"
        decoding="async"
        @error="handleImageError"
        @load="handleImageLoad"
      >

      <!-- 加载时的简单占位/骨架 -->
      <div v-if="!imageLoaded && !hasError" class="absolute inset-0 flex items-center justify-center">
        <div class="w-12 h-12 border-4 border-gray-200 border-t-gray-400 rounded-full animate-spin" aria-hidden="true" />
      </div>

      <!-- 无法加载且没有提供 fallback 的错误占位 -->
      <div v-if="hasError && !props.fallbackSrc" class="w-96 h-48 bg-gray-100 flex items-center justify-center rounded-lg text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm8.707 6.293a1 1 0 010 1.414L9.414 14H11a1 1 0 110 2H7a1 1 0 01-.707-1.707l6-6a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <span class="text-sm">{{ t('image.loadError') }}</span>
      </div>
    </div>

    <figcaption v-if="props.showCaption && props.node.alt" class="mt-2 text-sm text-gray-500 italic">
      {{ props.node.alt }}
    </figcaption>
  </figure>
</template>
