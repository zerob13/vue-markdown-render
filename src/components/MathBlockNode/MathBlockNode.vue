<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderKaTeXInWorker } from '../../workers/katexWorkerClient'

const props = defineProps<{
  node: {
    type: 'math_block'
    content: string
    raw: string
    loading?: boolean
  }
}>()

const mathBlockElement = ref<HTMLElement | null>(null)
let hasRenderedOnce = false
let currentRenderId = 0
let isUnmounted = false
let currentAbortController: AbortController | null = null

// Function to render math using KaTeX
function renderMath() {
  if (!props.node.content || !mathBlockElement.value || isUnmounted)
    return

  // cancel any previous in-flight render
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }

  // increment render id for this invocation; responses from older renders are ignored
  const renderId = ++currentRenderId
  const abortController = new AbortController()
  currentAbortController = abortController

  renderKaTeXInWorker(props.node.content, true, 3000, abortController.signal)
    .then((html) => {
      // ignore if a newer render was requested or component unmounted
      if (isUnmounted || renderId !== currentRenderId)
        return
      if (!mathBlockElement.value)
        return
      mathBlockElement.value.innerHTML = html
      hasRenderedOnce = true
    })
    .catch(() => {
      // ignore if a newer render was requested or component unmounted
      if (isUnmounted || renderId !== currentRenderId)
        return
      if (!mathBlockElement.value)
        return
      // show raw fallback when we never successfully rendered before or when loading flag is false
      if (!hasRenderedOnce || !props.node.loading) {
        mathBlockElement.value.textContent = props.node.raw
      }
    })
}

watch(
  () => props.node.content,
  () => {
    renderMath()
  },
)
onMounted(() => {
  renderMath()
})

onBeforeUnmount(() => {
  // prevent any pending worker responses from touching the DOM
  isUnmounted = true
  // increment id so any in-flight render is considered stale
  currentRenderId++
})
</script>

<template>
  <div ref="mathBlockElement" class="math-block text-center overflow-x-auto" />
</template>
