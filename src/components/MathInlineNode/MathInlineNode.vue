<script setup lang="ts">
import katex from 'katex'
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  node: {
    type: 'math_inline'
    content: string
    raw: string
  }
}>()

const mathElement = ref<HTMLElement | null>(null)

function renderMath() {
  const el = mathElement.value
  const content = props.node?.content ?? ''

  if (!el)
    return

  if (!content) {
    el.textContent = props.node?.raw ?? ''
    return
  }

  try {
    const html = katex.renderToString(content, {
      throwOnError: false,
      displayMode: false,
      output: 'htmlAndMathml',
      strict: 'ignore',
    })

    el.innerHTML = html
  }
  catch (error) {
    console.error('KaTeX rendering error:', error)
    el.textContent = props.node?.raw ?? ''
  }
}

watch(
  () => props.node.content,
  renderMath,
  { immediate: true, flush: 'post' },
)

onUnmounted(() => {
  if (mathElement.value)
    mathElement.value.innerHTML = ''
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
