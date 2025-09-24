<script setup lang="ts">
import katex from 'katex'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  node: {
    type: 'math_block'
    content: string
    raw: string
  }
}>()

const mathElement = ref<HTMLElement | null>(null)

// Function to render math using KaTeX. We use renderToString to produce
// HTML once and set innerHTML to reduce DOM thrash.
function renderMath() {
  const el = mathElement.value
  const content = props.node?.content ?? ''

  if (!el)
    return

  // If there's no content, fall back to showing the raw text (safe textContent)
  if (!content) {
    el.textContent = props.node?.raw ?? ''
    return
  }

  try {
    const html = katex.renderToString(content, {
      throwOnError: false,
      displayMode: true,
      // Provide MathML as well for better accessibility
      output: 'htmlAndMathml',
      strict: 'ignore',
    })

    // Replace contents with KaTeX output
    el.innerHTML = html
  }
  catch (error) {
    // Keep the error visible for debugging, but don't break the UI
    // Fallback to plain text

    console.error('KaTeX rendering error:', error)
    el.textContent = props.node?.raw ?? ''
  }
}

// Watch the node content and render immediately on mount. Use flush: 'post'
// so rendering runs after DOM updates.
watch(
  () => props.node.content,
  renderMath,
  { immediate: true, flush: 'post' },
)

// Cleanup on unmount
onUnmounted(() => {
  if (mathElement.value)
    mathElement.value.innerHTML = ''
})
</script>

<template>
  <div ref="mathElement" class="math-block text-center overflow-x-auto" />
</template>
