<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
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

// Function to render math using KaTeX
function renderMath() {
  if (!props.node.content || !mathBlockElement.value)
    return

  renderKaTeXInWorker(props.node.content, true, 3000)
    .then((html) => {
      mathBlockElement.value.innerHTML = html
      hasRenderedOnce = true
    })
    .catch(() => {
      if (!mathBlockElement.value)
        return
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
</script>

<template>
  <div ref="mathBlockElement" class="math-block text-center overflow-x-auto" />
</template>
