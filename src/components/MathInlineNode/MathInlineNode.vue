<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { renderKaTeXInWorker } from '../../workers/katexWorkerClient'

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

function renderMath() {
  if (!props.node.content || !mathElement.value)
    return

  renderKaTeXInWorker(props.node.content, false, 1500)
    .then((html) => {
      mathElement.value.innerHTML = html
      hasRenderedOnce = true
    })
    .catch(() => {
      if (!hasRenderedOnce || !props.node.loading)
        mathElement.value.textContent = props.node.raw
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
  <span ref="mathElement" class="math-inline" />
</template>

<style>
.math-inline {
  display: inline-block;
  vertical-align: middle;
}
</style>
