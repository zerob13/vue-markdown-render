<script setup lang="ts">
import katex from 'katex'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderKaTeXInWorker, setKaTeXCache } from '../../workers/katexWorkerClient'

const props = defineProps<{
  node: {
    type: 'math_inline'
    content: string
    raw: string
    loading?: boolean
  }
}>()

const mathElement = ref<HTMLElement | null>(null)
let hasRenderedOnce = false
let currentRenderId = 0
let isUnmounted = false
let currentAbortController: AbortController | null = null

function renderMath() {
  if (!props.node.content || !mathElement.value || isUnmounted)
    return

  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }

  const renderId = ++currentRenderId
  const abortController = new AbortController()
  currentAbortController = abortController

  renderKaTeXInWorker(props.node.content, false, 1500, abortController.signal)
    .then((html) => {
      if (isUnmounted || renderId !== currentRenderId)
        return
      if (!mathElement.value)
        return
      mathElement.value.innerHTML = html
      hasRenderedOnce = true
    })
    .catch(() => {
      if (isUnmounted || renderId !== currentRenderId)
        return
      if (!mathElement.value)
        return
      // Try synchronous render as a fallback
      try {
        const html = katex.renderToString(props.node.content, {
          throwOnError: true,
          displayMode: false,
        })
        mathElement.value.innerHTML = html
        hasRenderedOnce = true
        try {
          setKaTeXCache(props.node.content, false, html)
        }
        catch {
          // ignore cache set errors
        }
      }
      catch {
        if (!hasRenderedOnce || !props.node.loading)
          mathElement.value.textContent = props.node.raw
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
  isUnmounted = true
  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }
})
</script>

<template>
  <span ref="mathElement" class="math-inline" />
</template>

<style>
.math-inline {
  display: inline-block;
  vertical-align: middle;
}
</style>
