<script setup lang="ts">
import katex from 'katex'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderKaTeXInWorker, setKaTeXCache } from '../../workers/katexWorkerClient'

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
      // Try a synchronous KaTeX render on the main thread as a fallback
      try {
        const html = katex.renderToString(props.node.content, {
          throwOnError: true,
          displayMode: true,
        })
        mathBlockElement.value.innerHTML = html
        hasRenderedOnce = true
        // populate worker client cache so future calls hit cache
        try {
          setKaTeXCache(props.node.content, true, html)
        }
        catch {
          // ignore cache set errors
        }
      }
      catch {
        // show raw fallback when we never successfully rendered before or when loading flag is false
        if (!hasRenderedOnce || !props.node.loading) {
          mathBlockElement.value.textContent = props.node.raw
        }
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
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
})
</script>

<template>
  <div ref="mathBlockElement" class="math-block text-center overflow-x-auto" />
</template>
