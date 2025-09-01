<script setup lang="ts">
import { Icon } from '@iconify/vue'
import mermaid from 'mermaid'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isDark } from '../../utils/isDark'
import { Button } from '../button'

const props = defineProps<{
  node: {
    type: 'code_block'
    language: string
    code: string
  }
}>()

const { t } = useI18n()
const copyText = ref(t('common.copy'))
const mermaidContainer = ref<HTMLElement>()
const mermaidWrapper = ref<HTMLElement>()
const mermaidContent = ref<HTMLElement>()

// Zoom state
const zoom = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
// 避免直接渲染画面报错
const showSource = ref(true)
const isRendering = ref(false)
const renderQueue = ref<Promise<void> | null>(null)
const RENDER_DEBOUNCE_DELAY = 100

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

const transformStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${zoom.value})`,
}))

// Zoom controls
function zoomIn() {
  if (zoom.value < 3) {
    zoom.value += 0.1
  }
}

function zoomOut() {
  if (zoom.value > 0.5) {
    zoom.value -= 0.1
  }
}

function resetZoom() {
  zoom.value = 1
  translateX.value = 0
  translateY.value = 0
}

// Drag functionality
function startDrag(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  if (e instanceof MouseEvent) {
    dragStart.value = {
      x: e.clientX - translateX.value,
      y: e.clientY - translateY.value,
    }
  } else {
    dragStart.value = {
      x: e.touches[0].clientX - translateX.value,
      y: e.touches[0].clientY - translateY.value,
    }
  }
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value) return

  let clientX: number
  let clientY: number

  if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  } else {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  }

  translateX.value = clientX - dragStart.value.x
  translateY.value = clientY - dragStart.value.y
}

function stopDrag() {
  isDragging.value = false
}

// Wheel zoom functionality
function handleWheel(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    if (!mermaidContainer.value) return

    const rect = mermaidContainer.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const containerCenterX = rect.width / 2
    const containerCenterY = rect.height / 2
    const offsetX = mouseX - containerCenterX
    const offsetY = mouseY - containerCenterY
    const contentMouseX = (offsetX - translateX.value) / zoom.value
    const contentMouseY = (offsetY - translateY.value) / zoom.value
    const sensitivity = 0.01
    const delta = -event.deltaY * sensitivity
    const newZoom = Math.min(Math.max(zoom.value + delta, 0.5), 3)

    if (newZoom !== zoom.value) {
      translateX.value = offsetX - contentMouseX * newZoom
      translateY.value = offsetY - contentMouseY * newZoom
      zoom.value = newZoom
    }
  }
}

// Copy functionality
async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.node.code)
    copyText.value = t('common.copySuccess')
    setTimeout(() => {
      copyText.value = t('common.copy')
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Export SVG
async function exportSvg() {
  try {
    const svgElement = mermaidContent.value?.querySelector('svg')
    if (!svgElement) {
      console.error('SVG element not found')
      return
    }

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mermaid-diagram-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export SVG:', error)
  }
}

// 优化的 mermaid 渲染函数
async function initMermaid() {
  if (isRendering.value) {
    return renderQueue.value
  }

  if (!mermaidContent.value) {
    await nextTick()
    if (!mermaidContent.value) {
      console.warn('Mermaid container not ready')
      return
    }
  }

  isRendering.value = true

  renderQueue.value = (async () => {
    try {
      const id = `mermaid-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`

      mermaid.initialize({
        theme: isDark.value ? 'dark' : 'default',
        securityLevel: 'loose',
        startOnLoad: false,
      })

      const { svg, bindFunctions } = await mermaid.render(
        id,
        props.node.code,
        mermaidContent.value,
      )

      if (mermaidContent.value) {
        mermaidContent.value.innerHTML = svg
        bindFunctions?.(mermaidContent.value)
      }
    } catch (error) {
      console.error('Failed to render mermaid diagram:', error)
      if (mermaidContent.value) {
        const errorDiv = document.createElement('div')
        errorDiv.className = 'text-red-500 p-4'
        errorDiv.textContent = 'Failed to render diagram: '

        const errorSpan = document.createElement('span')
        errorSpan.textContent =
          error instanceof Error ? error.message : 'Unknown error'
        errorDiv.appendChild(errorSpan)

        mermaidContent.value.innerHTML = ''
        mermaidContent.value.appendChild(errorDiv)
      }
    } finally {
      isRendering.value = false
      renderQueue.value = null
    }
  })()

  return renderQueue.value
}

const debouncedInitMermaid = debounce(initMermaid, RENDER_DEBOUNCE_DELAY)

// Watch for code changes
watch(() => props.node.code, debouncedInitMermaid)

// Watch for dark mode changes with debounce
watch(isDark, debouncedInitMermaid)

// Watch for source toggle with proper timing
watch(
  () => showSource.value,
  async (newValue) => {
    if (!newValue) {
      await nextTick()
      await initMermaid()
    }
  },
)

onMounted(async () => {
  await nextTick()
  await initMermaid()
})
</script>

<template>
  <div class="my-4 rounded-lg border border-border overflow-hidden shadow-sm">
    <div
      class="flex justify-between items-center p-2 bg-gray-100 dark:bg-zinc-800 text-xs"
    >
      <span class="text-gray-600 dark:text-gray-400 font-mono font-bold"
        >Mermaid</span
      >
      <div class="flex items-center space-x-2">
        <button
          class="px-2 py-1 rounded-md transition-colors"
          :class="[
            !showSource
              ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700',
          ]"
          @click="showSource = false"
        >
          <div class="flex items-center space-x-1">
            <Icon icon="lucide:eye" class="w-4 h-4" />
            <span>Preview</span>
          </div>
        </button>
        <button
          class="px-2 py-1 rounded-md transition-colors"
          :class="[
            showSource
              ? 'bg-white dark:bg-zinc-700 text-foreground shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700',
          ]"
          @click="showSource = true"
        >
          <div class="flex items-center space-x-1">
            <Icon icon="lucide:code" class="w-4 h-4" />
            <span>Source</span>
          </div>
        </button>
      </div>
      <div class="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-4 h-3"
          @click="copyCode"
        >
          <Icon icon="lucide:copy" class="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-4 h-3"
          @click="exportSvg"
        >
          <Icon icon="lucide:download" class="w-3 h-3" />
        </Button>
      </div>
    </div>
    <div v-if="showSource" class="p-4 bg-gray-50 dark:bg-zinc-900">
      <pre class="text-sm font-mono whitespace-pre-wrap">{{ node.code }}</pre>
    </div>
    <div v-else class="relative">
      <div class="absolute top-2 right-2 z-10 rounded-lg">
        <div class="flex items-center gap-1 backdrop-blur rounded-lg">
          <button
            class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors"
            @click="zoomIn"
          >
            <Icon icon="lucide:zoom-in" class="w-3 h-3" />
          </button>
          <button
            class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors"
            @click="zoomOut"
          >
            <Icon icon="lucide:zoom-out" class="w-3 h-3" />
          </button>
          <button
            class="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-slate-200 dark:hover:bg-background transition-colors"
            @click="resetZoom"
          >
            {{ Math.round(zoom * 100) }}%
          </button>
        </div>
      </div>
      <div
        ref="mermaidContainer"
        class="min-h-[360px] max-h-[500px] overflow-auto bg-gray-50 dark:bg-zinc-900 relative"
        @wheel="handleWheel"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        @touchstart="startDrag"
        @touchmove="onDrag"
        @touchend="stopDrag"
      >
        <div
          ref="mermaidWrapper"
          class="absolute inset-0 cursor-grab"
          :class="{ 'cursor-grabbing': isDragging }"
          :style="transformStyle"
        >
          <div
            ref="mermaidContent"
            class="mermaid w-full text-center flex items-center justify-center min-h-full"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mermaid {
  font-family: inherit;
}

.mermaid :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
