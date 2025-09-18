<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { computePosition, autoUpdate, offset, flip, shift } from '@floating-ui/dom'

const props = defineProps<{
  visible: boolean
  anchorEl: HTMLElement | null
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  offset?: number
}>()

const tooltip = ref<HTMLElement | null>(null)
const style = ref<Record<string, string>>({ left: '0px', top: '0px' })

let cleanupAutoUpdate: (() => void) | null = null

async function updatePosition() {
  if (!props.anchorEl || !tooltip.value)
    return
  const middleware = [offset(props.offset ?? 8), flip(), shift({ padding: 8 })]
  const { x, y } = await computePosition(props.anchorEl, tooltip.value, {
    placement: props.placement ?? 'top',
    middleware,
    strategy: 'fixed',
  })
  style.value.left = `${Math.round(x)}px`
  style.value.top = `${Math.round(y)}px`
}

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await nextTick()
      if (props.anchorEl && tooltip.value) {
        // compute initial position
        await updatePosition()
        // setup autoUpdate to reposition on scroll/resize/mutation; returns cleanup
        cleanupAutoUpdate = autoUpdate(props.anchorEl, tooltip.value, updatePosition)
      }
    }
    else {
      if (cleanupAutoUpdate) {
        cleanupAutoUpdate()
        cleanupAutoUpdate = null
      }
    }
  },
)

onBeforeUnmount(() => {
  if (cleanupAutoUpdate) cleanupAutoUpdate()
})
</script>

<template>
  <teleport to="body">
    <div
      v-if="visible"
      ref="tooltip"
      :style="{ position: 'fixed', left: style.left, top: style.top }"
      class="z-[9999] text-xs bg-gray-900 text-white py-1 px-2 rounded shadow-sm whitespace-nowrap pointer-events-auto"
      role="tooltip"
    >
      {{ content }}
    </div>
  </teleport>
</template>

<style scoped>
/* small fade-in */
.tooltip-enter-from { opacity: 0 }
.tooltip-enter-to { opacity: 1 }
</style>
