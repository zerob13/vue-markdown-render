<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderKaTeXWithBackpressure, WORKER_BUSY_CODE } from '../../workers/katexWorkerClient'
import { getKatex } from './katex'
import { useViewportPriority } from '../../composables/viewportPriority'

const props = defineProps<{
  node: {
    type: 'math_inline'
    content: string
    raw: string
    loading?: boolean
  }
}>()
let katex = null
getKatex().then((k) => {
  katex = k
})

const mathElement = ref<HTMLElement | null>(null)
let hasRenderedOnce = false
let currentRenderId = 0
let isUnmounted = false
let currentAbortController: AbortController | null = null
const renderingLoading = ref(true)
const registerVisibility = useViewportPriority()
let visibilityHandle: ReturnType<typeof registerVisibility> | null = null

async function renderMath() {
  if (!props.node.content || !mathElement.value || isUnmounted)
    return

  if (currentAbortController) {
    currentAbortController.abort()
    currentAbortController = null
  }

  const renderId = ++currentRenderId
  const abortController = new AbortController()
  currentAbortController = abortController

  // Defer heavy work until visible on first render
  if (!hasRenderedOnce) {
    try {
      if (!visibilityHandle && mathElement.value) {
        visibilityHandle = registerVisibility(mathElement.value)
      }
      await visibilityHandle?.whenVisible
    }
    catch {}
  }

  renderKaTeXWithBackpressure(props.node.content, false, {
    timeout: 1500,
    waitTimeout: 1500,
    maxRetries: 1,
    signal: abortController.signal,
  })
    .then((html) => {
      if (isUnmounted || renderId !== currentRenderId)
        return
      if (!mathElement.value)
        return
      renderingLoading.value = false
      mathElement.value.innerHTML = html
      hasRenderedOnce = true
    })
    .catch(async (err: any) => {
      if (isUnmounted || renderId !== currentRenderId)
        return
      if (!mathElement.value)
        return
      // Fallback cases:
      // 1) Worker failed to initialize -> try sync render
      // 2) Worker is busy/timeout under heavy concurrency -> try sync render to avoid perpetual loading
      //    (inline math is usually cheap to render on main thread)
      const code = err?.code || err?.name
      const isWorkerInitFailure = code === 'WORKER_INIT_ERROR' || err?.fallbackToRenderer
      const isBusyOrTimeout = code === WORKER_BUSY_CODE || code === 'WORKER_TIMEOUT'
      if (katex && (isWorkerInitFailure || isBusyOrTimeout)) {
        try {
          const html = katex.renderToString(props.node.content, { throwOnError: true, displayMode: false })
          renderingLoading.value = false
          mathElement.value.innerHTML = html
          hasRenderedOnce = true
          return
        }
        catch {
          // fall through to existing loading/raw behaviour
        }
      }
      // If we reach here, the worker render failed and sync fallback was not possible.
      // Stop the spinner and show raw text when we have not rendered once yet
      // or the node isn't in loading mode.
      if (!hasRenderedOnce || !props.node.loading) {
        renderingLoading.value = false
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
  visibilityHandle?.destroy?.()
  visibilityHandle = null
})
</script>

<template>
  <span class="math-inline-wrapper">
    <span v-show="!renderingLoading" ref="mathElement" class="math-inline" />
    <transition v-if="renderingLoading" name="table-node-fade">
      <span
        class="math-inline__loading"
        role="status"
        aria-live="polite"
      >
        <slot name="loading" :is-loading="renderingLoading">
          <span class="math-inline__spinner animate-spin" aria-hidden="true" />
          <span class="sr-only">Loading</span>
        </slot>
      </span>
    </transition>
  </span>
</template>

<style scoped>
.math-inline-wrapper {
  position: relative;
  display: inline-block;
}

.math-inline {
  display: inline-block;
  vertical-align: middle;
}

.math-inline__loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.math-inline__spinner {
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid rgba(94, 104, 121, 0.25);
  border-top-color: rgba(94, 104, 121, 0.8);
  will-change: transform;
}

.table-node-fade-enter-active,
.table-node-fade-leave-active {
  transition: opacity 0.18s ease;
}

.table-node-fade-enter-from,
.table-node-fade-leave-to {
  opacity: 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
