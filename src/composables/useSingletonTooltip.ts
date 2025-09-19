import { createApp, h, ref } from 'vue'
import Tooltip from '../components/Tooltip/Tooltip.vue'

const visible = ref(false)
const content = ref('')
const placement = ref<'top' | 'bottom' | 'left' | 'right'>('top')
const anchorEl = ref<HTMLElement | null>(null)
let tooltipId: string | null = null

let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null

function clearTimers() {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

// Mount singleton Tooltip once
let mounted = false
function ensureMounted() {
  if (mounted)
    return
  if (typeof document === 'undefined')
    return
  mounted = true
  const container = document.createElement('div')
  container.setAttribute('data-singleton-tooltip', '1')
  document.body.appendChild(container)

  const App = {
    setup() {
      return () => h(Tooltip as any, {
        'visible': visible.value,
        'anchor-el': anchorEl.value,
        'content': content.value,
        'placement': placement.value,
      })
    },
  }

  createApp(App).mount(container)
}

export function showTooltipForAnchor(el: HTMLElement | null, text: string, place: typeof placement.value = 'top', immediate = false) {
  if (!el)
    return
  ensureMounted()
  clearTimers()
  const doShow = () => {
    tooltipId = `tooltip-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    anchorEl.value = el
    content.value = text
    placement.value = place
    visible.value = true
    try {
      el.setAttribute('aria-describedby', tooltipId!)
    }
    catch {}
  }
  if (immediate)
    doShow()
  else showTimer = setTimeout(doShow, 80)
}

export function hideTooltip(immediate = false) {
  ensureMounted()
  clearTimers()
  const doHide = () => {
    if (anchorEl.value && tooltipId) {
      try {
        anchorEl.value.removeAttribute('aria-describedby')
      }
      catch {}
    }
    visible.value = false
    anchorEl.value = null
    tooltipId = null
  }
  if (immediate)
    doHide()
  else hideTimer = setTimeout(doHide, 120)
}

export default {
  showTooltipForAnchor,
  hideTooltip,
}
