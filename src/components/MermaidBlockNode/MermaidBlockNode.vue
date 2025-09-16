<script setup lang="ts">
import { Icon } from '@iconify/vue'
import mermaid from 'mermaid'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import mermaidIconUrl from '../../icon/mermaid.svg'
import { isDark } from '../../utils/isDark'
import parserWorkerUrl from '../../workers/mermaidParser.worker?worker&url'

const props = withDefaults(
  // 全屏按钮禁用状态
  defineProps<{
    node: {
      type: 'code_block'
      language: string
      code: string
    }
    maxHeight?: string | null
    loading?: boolean
  }>(),
  {
    maxHeight: '500px',
    loading: true,
  },
)

const emits = defineEmits(['copy'])
const copyText = ref(false)
const mermaidContainer = ref<HTMLElement>()
const mermaidWrapper = ref<HTMLElement>()
const mermaidContent = ref<HTMLElement>()
const modalContent = ref<HTMLElement>()
const modalCloneWrapper = ref<HTMLElement | null>(null)
const baseFixedCode = computed(() => {
  return props.node.code
    .replace(/\]::([^:])/g, ']:::$1') // 将 :: 更改为 ::: 来应用类样式
    .replace(/:::subgraphNode$/gm, '::subgraphNode')
})

// get the code with the theme configuration
function getCodeWithTheme(theme: 'light' | 'dark') {
  const baseCode = baseFixedCode.value
  const themeValue = theme === 'dark' ? 'dark' : 'default'
  const themeConfig = `%%{init: {"theme": "${themeValue}"}}%%\n`
  if (baseCode.trim().startsWith('%%{')) {
    return baseCode
  }
  return themeConfig + baseCode
}

// Zoom state
const zoom = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const showSource = ref(false)
const isRendering = ref(false)
const renderQueue = ref<Promise<void> | null>(null)
const RENDER_DEBOUNCE_DELAY = 300
const CONTENT_STABLE_DELAY = 500
const lastContentLength = ref(0)
const isContentGenerating = ref(false)
let contentStableTimer: number | null = null

const containerHeight = ref<string>('360px') // 初始值与 min-h 保持一致
let resizeObserver: ResizeObserver | null = null

// rendering state management
const hasRenderedOnce = ref(false)
const isThemeRendering = ref(false)
const svgCache = ref<{
  light?: string
  dark?: string
}>({})

const lastSvgSnapshot = ref<string | null>(null)
const renderToken = ref(0)
// Abort/cancellation state for ongoing progressive work
let currentWorkController: AbortController | null = null
const savedTransformState = ref({
  zoom: 1,
  translateX: 0,
  translateY: 0,
  containerHeight: '360px',
})

// Timeouts (ms)
const WORKER_TIMEOUT_MS = 1400
const PARSE_TIMEOUT_MS = 1800
const RENDER_TIMEOUT_MS = 2500
const FULL_RENDER_TIMEOUT_MS = 4000

// Helper: wrap an async operation with timeout and AbortSignal support
function withTimeoutSignal<T>(
  run: () => Promise<T>,
  opts?: { timeoutMs?: number, signal?: AbortSignal },
): Promise<T> {
  const timeoutMs = opts?.timeoutMs
  const signal = opts?.signal

  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'))
  }

  let timer: number | null = null
  let settled = false
  let abortHandler: ((this: AbortSignal, ev: Event) => any) | null = null

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      if (timer != null)
        clearTimeout(timer)
      if (abortHandler && signal)
        signal.removeEventListener('abort', abortHandler)
    }

    if (timeoutMs && timeoutMs > 0) {
      timer = window.setTimeout(() => {
        if (settled)
          return
        settled = true
        cleanup()
        reject(new Error('Operation timed out'))
      }, timeoutMs)
    }

    if (signal) {
      abortHandler = () => {
        if (settled)
          return
        settled = true
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
      }
      signal.addEventListener('abort', abortHandler)
    }

    run()
      .then((res) => {
        if (settled)
          return
        settled = true
        cleanup()
        resolve(res)
      })
      .catch((err) => {
        if (settled)
          return
        settled = true
        cleanup()
        reject(err)
      })
  })
}

// Unified error renderer (only used when props.loading === false)
function renderErrorToContainer(error: unknown) {
  if (!mermaidContent.value)
    return
  const errorDiv = document.createElement('div')
  errorDiv.className = 'text-red-500 p-4'
  errorDiv.textContent = 'Failed to render diagram: '
  const errorSpan = document.createElement('span')
  errorSpan.textContent = error instanceof Error ? error.message : 'Unknown error'
  errorDiv.appendChild(errorSpan)
  mermaidContent.value.innerHTML = ''
  mermaidContent.value.appendChild(errorDiv)
  containerHeight.value = '360px'
}

// Worker-backed off-thread parsing (to reduce main-thread jank)
let parserWorker: Worker | null = null
const rpcMap = new Map<string, { resolve: (v: any) => void, reject: (e: any) => void }>()
function ensureParserWorker() {
  if (parserWorker)
    return
  try {
    parserWorker = new Worker(parserWorkerUrl, { type: 'module' })
    parserWorker.onmessage = (ev: MessageEvent<any>) => {
      const { id, ok, result, error } = ev.data || {}
      const entry = rpcMap.get(id)
      if (!entry)
        return
      if (ok)
        entry.resolve(result)
      else entry.reject(new Error(error ?? 'Worker error'))
      rpcMap.delete(id)
    }
  }
  catch (e) {
    console.warn('Parser worker unavailable, will fall back to main thread:', e)
    parserWorker = null
  }
}
function callWorker<T>(
  action: 'canParse' | 'findPrefix',
  payload: any,
  options?: { signal?: AbortSignal, timeoutMs?: number },
) {
  ensureParserWorker()
  return new Promise<T>((resolve, reject) => {
    if (!parserWorker)
      return reject(new Error('worker not available'))
    const id = Math.random().toString(36).slice(2)
    rpcMap.set(id, { resolve, reject })
    parserWorker.postMessage({ id, action, payload })

    let timeoutId: number | null = null
    const onAbort = () => {
      if (rpcMap.has(id))
        rpcMap.delete(id)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    if (options?.timeoutMs && options.timeoutMs > 0) {
      timeoutId = window.setTimeout(() => {
        if (rpcMap.has(id))
          rpcMap.delete(id)
        reject(new Error('Worker call timed out'))
      }, options.timeoutMs)
    }
    if (options?.signal) {
      if (options.signal.aborted) {
        if (timeoutId)
          clearTimeout(timeoutId)
        if (rpcMap.has(id))
          rpcMap.delete(id)
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      const handler = () => {
        if (timeoutId)
          clearTimeout(timeoutId)
        onAbort()
      }
      options.signal.addEventListener('abort', handler, { once: true })
    }
  })
}

// Apply theme header to arbitrary code snippet
function applyThemeTo(code: string, theme: 'light' | 'dark') {
  const themeValue = theme === 'dark' ? 'dark' : 'default'
  const themeConfig = `%%{init: {"theme": "${themeValue}"}}%%\n`
  const trimmed = code.trimStart()
  if (trimmed.startsWith('%%{'))
    return code
  return themeConfig + code
}

// Main-thread fallback parse when worker not available
async function canParseOnMain(
  code: string,
  theme: 'light' | 'dark',
  opts?: { signal?: AbortSignal, timeoutMs?: number },
) {
  const anyMermaid = mermaid as any
  const themed = applyThemeTo(code, theme)
  if (typeof anyMermaid.parse === 'function') {
    await withTimeoutSignal(() => anyMermaid.parse(themed), {
      timeoutMs: opts?.timeoutMs ?? PARSE_TIMEOUT_MS,
      signal: opts?.signal,
    })
    return true
  }
  // Fallback: try a headless render (no target element) just to validate
  const id = `mermaid-parse-${Math.random().toString(36).slice(2, 9)}`
  await withTimeoutSignal(() => mermaid.render(id, themed), {
    timeoutMs: opts?.timeoutMs ?? RENDER_TIMEOUT_MS,
    signal: opts?.signal,
  })
  return true
}

async function canParseOffthread(
  code: string,
  theme: 'light' | 'dark',
  opts?: { signal?: AbortSignal, timeoutMs?: number },
) {
  try {
    return await callWorker<boolean>('canParse', { code, theme }, {
      signal: opts?.signal,
      timeoutMs: opts?.timeoutMs ?? WORKER_TIMEOUT_MS,
    })
  }
  catch {
    return await canParseOnMain(code, theme, opts)
  }
}

// 全屏按钮禁用状态
const isFullscreenDisabled = computed(
  () => showSource.value || isRendering.value,
)

/**
 * 健壮地计算并更新容器高度，优先使用viewBox，并提供getBBox作为后备
 * @param newContainerWidth - 可选的容器宽度，由ResizeObserver提供以确保精确
 */
function updateContainerHeight(newContainerWidth?: number) {
  if (!mermaidContainer.value || !mermaidContent.value)
    return

  const svgElement = mermaidContent.value.querySelector('svg')
  if (!svgElement)
    return

  let intrinsicWidth = 0
  let intrinsicHeight = 0

  // 1. 尝试从SVG属性解析尺寸
  const viewBox = svgElement.getAttribute('viewBox')
  const attrWidth = svgElement.getAttribute('width')
  const attrHeight = svgElement.getAttribute('height')

  // 优先使用 viewBox，因为它通常最能反映内容的真实比例
  if (viewBox) {
    const parts = viewBox.split(' ')
    if (parts.length === 4) {
      intrinsicWidth = Number.parseFloat(parts[2])
      intrinsicHeight = Number.parseFloat(parts[3])
    }
  }

  // 如果 viewBox 解析失败或不存在，尝试回退到 width/height 属性
  if (!intrinsicWidth || !intrinsicHeight) {
    if (attrWidth && attrHeight) {
      intrinsicWidth = Number.parseFloat(attrWidth)
      intrinsicHeight = Number.parseFloat(attrHeight)
    }
  }

  // 2. 如果从属性解析失败，使用 getBBox() 作为最终后备方案
  if (
    Number.isNaN(intrinsicWidth)
    || Number.isNaN(intrinsicHeight)
    || intrinsicWidth <= 0
    || intrinsicHeight <= 0
  ) {
    try {
      // getBBox() 可以精确测量SVG内容的实际渲染边界
      const bbox = svgElement.getBBox()
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        intrinsicWidth = bbox.width
        intrinsicHeight = bbox.height
      }
    }
    catch (e) {
      // 在某些罕见情况下（如SVG display:none），getBBox可能会报错
      console.error('Failed to get SVG BBox:', e)
      // 在这里可以决定是否要回退到一个默认高度，或者什么都不做
      return
    }
  }

  // 3. 如果成功获取尺寸，则计算并应用高度
  if (intrinsicWidth > 0 && intrinsicHeight > 0) {
    const aspectRatio = intrinsicHeight / intrinsicWidth
    // 如果外部传入了宽度，则使用它，否则自己获取
    const containerWidth
      = newContainerWidth ?? mermaidContainer.value.clientWidth
    let newHeight = containerWidth * aspectRatio
    if (newHeight > intrinsicHeight)
      newHeight = intrinsicHeight // 高保真，不超过内容的固有高度
    containerHeight.value = `${newHeight}px`
  }
}

// Modal pseudo-fullscreen state (fixed overlay)
const isModalOpen = ref(false)

const transformStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${zoom.value})`,
}))

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

function openModal() {
  isModalOpen.value = true
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)

  nextTick(() => {
    if (mermaidContainer.value && modalContent.value) {
      // clone the container for modal and add fullscreen to the clone (not original)
      const clone = mermaidContainer.value.cloneNode(true) as HTMLElement
      clone.classList.add('fullscreen')

      // find the wrapper inside the clone using the data attribute and keep a ref
      const wrapper = clone.querySelector(
        '[data-mermaid-wrapper]',
      ) as HTMLElement | null
      if (wrapper) {
        modalCloneWrapper.value = wrapper
        // apply current transform to the clone so it matches the original state
        wrapper.style.transform = (transformStyle.value as any).transform
      }

      // clear any previous content and append the clone
      modalContent.value.innerHTML = ''
      modalContent.value.appendChild(clone)
    }
  })
}

function closeModal() {
  isModalOpen.value = false
  // remove the cloned modal content and clear clone ref
  if (modalContent.value) {
    modalContent.value.innerHTML = ''
  }
  modalCloneWrapper.value = null
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

function checkContentStability() {
  if (!showSource.value) {
    return
  }

  const currentLength = baseFixedCode.value.length

  // 只要长度不一致，就认为内容在变化
  if (currentLength !== lastContentLength.value) {
    isContentGenerating.value = true
    lastContentLength.value = currentLength

    if (contentStableTimer) {
      clearTimeout(contentStableTimer)
    }

    contentStableTimer = setTimeout(() => {
      if (
        isContentGenerating.value
        && showSource.value
        && baseFixedCode.value.trim()
      ) {
        isContentGenerating.value = false
        showSource.value = false
      }
    }, CONTENT_STABLE_DELAY)
  }
}

// keep modal clone in sync with transform changes
watch(
  transformStyle,
  (newStyle) => {
    if (isModalOpen.value && modalCloneWrapper.value) {
      modalCloneWrapper.value.style.transform = (newStyle as any).transform
    }
  },
  { immediate: true },
)

// Zoom controls
function zoomIn() {
  if (zoom.value < 3) {
    zoom.value += 0.1
  }
}

function zoomOut() {
  if (zoom.value > 0.5) {
    zoom.value -= 0.1
  }
}

function resetZoom() {
  zoom.value = 1
  translateX.value = 0
  translateY.value = 0
}

// Drag functionality
function startDrag(e: MouseEvent | TouchEvent) {
  isDragging.value = true
  if (e instanceof MouseEvent) {
    dragStart.value = {
      x: e.clientX - translateX.value,
      y: e.clientY - translateY.value,
    }
  }
  else {
    dragStart.value = {
      x: e.touches[0].clientX - translateX.value,
      y: e.touches[0].clientY - translateY.value,
    }
  }
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging.value)
    return

  let clientX: number
  let clientY: number

  if (e instanceof MouseEvent) {
    clientX = e.clientX
    clientY = e.clientY
  }
  else {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  }

  translateX.value = clientX - dragStart.value.x
  translateY.value = clientY - dragStart.value.y
}

function stopDrag() {
  isDragging.value = false
}

// Wheel zoom functionality
function handleWheel(event: WheelEvent) {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    if (!mermaidContainer.value)
      return

    const rect = mermaidContainer.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const containerCenterX = rect.width / 2
    const containerCenterY = rect.height / 2
    const offsetX = mouseX - containerCenterX
    const offsetY = mouseY - containerCenterY
    const contentMouseX = (offsetX - translateX.value) / zoom.value
    const contentMouseY = (offsetY - translateY.value) / zoom.value
    const sensitivity = 0.01
    const delta = -event.deltaY * sensitivity
    const newZoom = Math.min(Math.max(zoom.value + delta, 0.5), 3)

    if (newZoom !== zoom.value) {
      translateX.value = offsetX - contentMouseX * newZoom
      translateY.value = offsetY - contentMouseY * newZoom
      zoom.value = newZoom
    }
  }
}

// Copy functionality
async function copy() {
  try {
    await navigator.clipboard.writeText(baseFixedCode.value)
    copyText.value = true
    emits('copy', baseFixedCode.value)
    setTimeout(() => {
      copyText.value = false
    }, 1000)
  }
  catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Export SVG
async function exportSvg() {
  try {
    const svgElement = mermaidContent.value?.querySelector('svg')
    if (!svgElement) {
      console.error('SVG element not found')
      return
    }

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `mermaid-diagram-${Date.now()}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  catch (error) {
    console.error('Failed to export SVG:', error)
  }
}

// 优化的 mermaid 渲染函数
async function initMermaid() {
  if (isRendering.value) {
    return renderQueue.value
  }

  if (!mermaidContent.value) {
    await nextTick()
    if (!mermaidContent.value) {
      console.warn('Mermaid container not ready')
      return
    }
  }

  isRendering.value = true

  renderQueue.value = (async () => {
    if (mermaidContent.value) {
      mermaidContent.value.style.opacity = '0'
    }

    try {
      const id = `mermaid-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`

      if (!hasRenderedOnce.value && !isThemeRendering.value) {
        mermaid.initialize({
          securityLevel: 'loose',
          startOnLoad: false,
        })
      }
      const currentTheme = isDark.value ? 'dark' : 'light'
      const codeWithTheme = getCodeWithTheme(currentTheme)
      const { svg, bindFunctions } = await withTimeoutSignal(
        () => mermaid.render(
          id,
          codeWithTheme,
          mermaidContent.value,
        ),
        { timeoutMs: FULL_RENDER_TIMEOUT_MS },
      )

      if (mermaidContent.value) {
        mermaidContent.value.innerHTML = svg
        bindFunctions?.(mermaidContent.value)
        // Successful full render clears Partial preview state
        if (!hasRenderedOnce.value && !isThemeRendering.value) {
          updateContainerHeight()
          hasRenderedOnce.value = true
          savedTransformState.value = {
            zoom: zoom.value,
            translateX: translateX.value,
            translateY: translateY.value,
            containerHeight: containerHeight.value,
          }
        }
        const currentTheme = isDark.value ? 'dark' : 'light'
        svgCache.value[currentTheme] = svg
        if (isThemeRendering.value) {
          isThemeRendering.value = false
        }
      }
    }
    catch (error) {
      console.error('Failed to render mermaid diagram:', error)
      // 在渐进/生成中（props.loading === true）不展示错误，避免打断预览体验
      if (!props.loading) {
        renderErrorToContainer(error)
      }
    }
    finally {
      await nextTick()
      if (mermaidContent.value) {
        mermaidContent.value.style.opacity = '1'
      }
      isRendering.value = false
      renderQueue.value = null
    }
  })()

  return renderQueue.value
}

// Note: debouncedInitMermaid is no longer needed; progressive path handles debouncing

// Schedule progressive work in idle time
const requestIdle
  = (globalThis as any).requestIdleCallback
    ?? ((cb: any, _opts?: any) => setTimeout(() => cb({ didTimeout: true }), 16))

// Progressive render: if full parse passes -> run initMermaid; else restore last success (no prefix render)
async function progressiveRender() {
  const token = ++renderToken.value
  // cancel any previous ongoing progressive work
  if (currentWorkController) {
    currentWorkController.abort()
  }
  currentWorkController = new AbortController()
  const signal = currentWorkController.signal
  const theme = isDark.value ? 'dark' : 'light'
  const base = baseFixedCode.value
  if (!base.trim()) {
    if (mermaidContent.value)
      mermaidContent.value.innerHTML = ''
    lastSvgSnapshot.value = null
    return
  }
  try {
    const ok = await canParseOffthread(base, theme, { signal, timeoutMs: WORKER_TIMEOUT_MS })
    if (ok) {
      await initMermaid()
      // Guard against race: if a newer render started, skip flag changes
      if (renderToken.value === token) {
        lastSvgSnapshot.value = mermaidContent.value?.innerHTML ?? null
      }
      return
    }
  }
  catch (e: any) {
    // aborted -> do nothing
    if (e?.name === 'AbortError')
      return
    // fallthrough to restore last success
  }

  // Worker/main parse failed -> restore last successful full SVG (if any), do not render prefix
  if (renderToken.value !== token)
    return
  const cached = svgCache.value[theme]
  if (cached && mermaidContent.value) {
    mermaidContent.value.innerHTML = cached
  }
  // else: keep current DOM (could be empty on very first run)
}

const debouncedProgressiveRender = debounce(() => {
  requestIdle(() => {
    progressiveRender()
  }, { timeout: 500 })
}, RENDER_DEBOUNCE_DELAY)

// Background polling while in Preview to upgrade prefix -> full render automatically
const cancelIdle
  = (globalThis as any).cancelIdleCallback ?? ((id: any) => clearTimeout(id))
let previewPollTimeoutId: number | null = null
let previewPollIdleId: number | null = null
let isPreviewPolling = false
let previewPollDelay = 800
let previewPollController: AbortController | null = null

function stopPreviewPolling() {
  if (!isPreviewPolling)
    return
  isPreviewPolling = false
  previewPollDelay = 800
  if (previewPollController) {
    previewPollController.abort()
    previewPollController = null
  }
  if (previewPollTimeoutId) {
    clearTimeout(previewPollTimeoutId)
    previewPollTimeoutId = null
  }
  if (previewPollIdleId) {
    cancelIdle(previewPollIdleId)
    previewPollIdleId = null
  }
}

function scheduleNextPreviewPoll(delay = 800) {
  if (!isPreviewPolling)
    return
  if (previewPollTimeoutId)
    clearTimeout(previewPollTimeoutId)
  previewPollTimeoutId = window.setTimeout(() => {
    previewPollIdleId = requestIdle(async () => {
      if (!isPreviewPolling)
        return
      if (showSource.value || hasRenderedOnce.value) {
        stopPreviewPolling()
        return
      }
      const theme = isDark.value ? 'dark' : 'light'
      const base = baseFixedCode.value
      if (!base.trim()) {
        scheduleNextPreviewPoll(previewPollDelay)
        return
      }
      // abort previous poll try
      if (previewPollController)
        previewPollController.abort()
      previewPollController = new AbortController()
      try {
        const ok = await canParseOffthread(base, theme, { signal: previewPollController.signal, timeoutMs: WORKER_TIMEOUT_MS })
        if (ok) {
          await initMermaid()
          if (hasRenderedOnce.value) {
            stopPreviewPolling()
            return
          }
        }
      }
      catch {
        // ignore and keep polling
      }
      previewPollDelay = Math.min(Math.floor(previewPollDelay * 1.5), 4000)
      scheduleNextPreviewPoll(previewPollDelay)
    }, { timeout: 500 }) as unknown as number
  }, delay)
}

function startPreviewPolling() {
  if (isPreviewPolling)
    return
  if (showSource.value || hasRenderedOnce.value)
    return
  isPreviewPolling = true
  scheduleNextPreviewPoll(500)
}

// Watch for code changes (only base code, not theme changes)
watch(
  () => baseFixedCode.value,
  () => {
    hasRenderedOnce.value = false
    svgCache.value = {}
    // Use idle progressive path; will call initMermaid when full code becomes valid
    debouncedProgressiveRender()
    // Ensure background polling while previewing (to upgrade to full render when ready)
    if (!showSource.value)
      startPreviewPolling()
    checkContentStability()
  },
)

// Watch for dark mode changes with smart caching
watch(isDark, async () => {
  if (!hasRenderedOnce.value) {
    return
  }
  const targetTheme = isDark.value ? 'dark' : 'light'
  if (svgCache.value[targetTheme]) {
    if (mermaidContent.value) {
      mermaidContent.value.innerHTML = svgCache.value[targetTheme]!
    }
    return
  }
  const currentTransformState = {
    zoom: zoom.value,
    translateX: translateX.value,
    translateY: translateY.value,
    containerHeight: containerHeight.value,
  }
  const hasUserTransform = zoom.value !== 1 || translateX.value !== 0 || translateY.value !== 0
  isThemeRendering.value = true

  if (hasUserTransform) {
    zoom.value = 1
    translateX.value = 0
    translateY.value = 0
    await nextTick()
  }
  await initMermaid()
  if (hasUserTransform) {
    await nextTick()
    zoom.value = currentTransformState.zoom
    translateX.value = currentTransformState.translateX
    translateY.value = currentTransformState.translateY
    containerHeight.value = currentTransformState.containerHeight
    savedTransformState.value = currentTransformState
  }
})

// Watch for source toggle with proper timing
watch(
  () => showSource.value,
  async (newValue) => {
    if (!newValue) {
      const currentTheme = isDark.value ? 'dark' : 'light'
      if (hasRenderedOnce.value && svgCache.value[currentTheme]) {
        await nextTick()
        if (mermaidContent.value) {
          mermaidContent.value.innerHTML = svgCache.value[currentTheme]!
        }
        // Restoring full render from cache -> hide Partial badge
        zoom.value = savedTransformState.value.zoom
        translateX.value = savedTransformState.value.translateX
        translateY.value = savedTransformState.value.translateY
        containerHeight.value = savedTransformState.value.containerHeight
        return
      }
      await nextTick()
      // Use progressive path to avoid throwing on incomplete code
      await progressiveRender()
      // Start background polling to auto-upgrade to full render when ready
      startPreviewPolling()
    }
    else {
      stopPreviewPolling()
      if (hasRenderedOnce.value) {
        savedTransformState.value = {
          zoom: zoom.value,
          translateX: translateX.value,
          translateY: translateY.value,
          containerHeight: containerHeight.value,
        }
      }
    }
  },
)

// 当外部 loading -> false：尝试一次最终完整解析；若失败才展示错误
watch(
  () => props.loading,
  async (loaded, prev) => {
    if (prev === true && loaded === false) {
      const base = baseFixedCode.value
      if (!base.trim())
        return
      // 直接尝试最终渲染：成功则展示完整图；失败则在 loading=false 时展示错误
      await initMermaid()
    }
  },
)

// 监听容器元素的变化，并设置ResizeObserver
watch(
  mermaidContainer,
  (newEl) => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }

    if (newEl && !hasRenderedOnce.value && !isThemeRendering.value) {
      // container resized; schedule height update

      resizeObserver = new ResizeObserver((entries) => {
        if (entries && entries.length > 0 && !hasRenderedOnce.value && !isThemeRendering.value) {
          // 使用 requestAnimationFrame 确保在下一次重绘前执行更新
          // 这给了DOM充足的时间来完成SVG的内部布局更新
          requestAnimationFrame(() => {
            const newWidth = entries[0].contentRect.width
            updateContainerHeight(newWidth)
          })
        }
      })
      resizeObserver.observe(newEl)
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await nextTick()
  // Prefer progressive path to avoid throwing on incomplete code at mount
  debouncedProgressiveRender()
  lastContentLength.value = baseFixedCode.value.length
})

onUnmounted(() => {
  if (contentStableTimer) {
    clearTimeout(contentStableTimer)
  }
  // 在组件卸载时，确保观察者被彻底清理，防止内存泄漏
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (currentWorkController) {
    currentWorkController.abort()
    currentWorkController = null
  }
  if (parserWorker) {
    parserWorker.terminate()
    parserWorker = null
  }
  stopPreviewPolling()
})
</script>

<template>
  <div class="my-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900">
    <!-- 重新设计的头部区域 -->
    <div class="mermaid-block-header flex justify-between items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <!-- 左侧语言标签 -->
      <div class="flex items-center space-x-2">
        <img :src="mermaidIconUrl" class="w-4 h-4" alt="Mermaid">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400 font-mono">Mermaid</span>
      </div>

      <!-- 中间切换按钮 -->
      <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
        <button
          class="px-2.5 py-1 text-xs rounded transition-colors"
          :class="[
            !showSource
              ? 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
          ]"
          @click="showSource = false"
        >
          <div class="flex items-center space-x-1">
            <Icon icon="lucide:eye" class="w-3 h-3" />
            <span>Preview</span>
          </div>
        </button>
        <button
          class="px-2.5 py-1 text-xs rounded transition-colors"
          :class="[
            showSource
              ? 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
          ]"
          @click="showSource = true"
        >
          <div class="flex items-center space-x-1">
            <Icon icon="lucide:code" class="w-3 h-3" />
            <span>Source</span>
          </div>
        </button>
      </div>

      <!-- 右侧操作按钮 -->
      <div class="flex items-center space-x-1">
        <button
          class="mermaid-action-btn p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="copy"
        >
          <Icon v-if="!copyText" icon="lucide:copy" class="w-3 h-3" />
          <Icon v-else icon="lucide:check" class="w-3 h-3" />
        </button>
        <button
          class="mermaid-action-btn p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :disabled="isFullscreenDisabled"
          :class="isFullscreenDisabled ? 'opacity-50 cursor-not-allowed' : ''"
          @click="exportSvg"
        >
          <Icon icon="lucide:download" class="w-3 h-3" />
        </button>
        <button
          class="mermaid-action-btn p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :disabled="isFullscreenDisabled"
          :class="isFullscreenDisabled ? 'opacity-50 cursor-not-allowed' : ''"
          @click="openModal"
        >
          <Icon
            :icon="isModalOpen ? 'lucide:minimize-2' : 'lucide:maximize-2'"
            class="w-3 h-3"
          />
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div v-if="showSource" class="p-4 bg-gray-50 dark:bg-gray-900">
      <pre class="text-sm font-mono whitespace-pre-wrap text-gray-700 dark:text-gray-300">{{ baseFixedCode }}</pre>
    </div>
    <div v-else class="relative">
      <!-- ...existing preview content... -->
      <div class="absolute top-2 right-2 z-10 rounded-lg">
        <div class="flex items-center gap-2 backdrop-blur rounded-lg">
          <span
            v-if="!showSource && props.loading"
            class="px-2.5 py-1 text-[10px] rounded-full bg-gradient-to-r from-sky-500/90 to-indigo-500/90 text-white select-none inline-flex items-center gap-1.5 shadow-sm ring-1 ring-white/20 backdrop-blur-sm"
            title="Rendering in progress"
          >
            <Icon icon="lucide:loader-2" class="w-3 h-3 animate-spin" />
            Rendering
          </span>
          <button
            class="p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            @click="zoomIn"
          >
            <Icon icon="lucide:zoom-in" class="w-3 h-3" />
          </button>
          <button
            class="p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            @click="zoomOut"
          >
            <Icon icon="lucide:zoom-out" class="w-3 h-3" />
          </button>
          <button
            class="p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            @click="resetZoom"
          >
            {{ Math.round(zoom * 100) }}%
          </button>
        </div>
      </div>
      <div
        ref="mermaidContainer"
        class="min-h-[360px] bg-gray-50 dark:bg-gray-900 relative transition-all duration-100 overflow-hidden block"
        :style="{ height: containerHeight }"
        @wheel="handleWheel"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="stopDrag"
        @mouseleave="stopDrag"
        @touchstart.passive="startDrag"
        @touchmove.passive="onDrag"
        @touchend.passive="stopDrag"
      >
        <div
          ref="mermaidWrapper"
          data-mermaid-wrapper
          class="absolute inset-0 cursor-grab"
          :class="{ 'cursor-grabbing': isDragging }"
          :style="transformStyle"
        >
          <div
            ref="mermaidContent"
            class="mermaid w-full text-center flex items-center justify-center min-h-full"
          />
        </div>
      </div>
      <!-- Modal pseudo-fullscreen overlay (teleported to body) -->
      <teleport to="body">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          @click.self="closeModal"
        >
          <div
            class="relative w-full h-full max-w-full max-h-full bg-white dark:bg-gray-900 rounded shadow-lg overflow-hidden"
          >
            <div class="absolute top-6 right-6 z-50 flex items-center gap-2">
              <button
                class="p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                @click="zoomIn"
              >
                <Icon icon="lucide:zoom-in" class="w-3 h-3" />
              </button>
              <button
                class="p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                @click="zoomOut"
              >
                <Icon icon="lucide:zoom-out" class="w-3 h-3" />
              </button>
              <button
                class="p-2 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                @click="resetZoom"
              >
                {{ Math.round(zoom * 100) }}%
              </button>
              <button
                class="inline-flex items-center justify-center p-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                @click="closeModal"
              >
                <Icon icon="lucide:x" class="w-3 h-3" />
              </button>
            </div>
            <div
              ref="modalContent"
              class="w-full h-full flex items-center justify-center p-4 overflow-hidden"
              @wheel="handleWheel"
              @mousedown="startDrag"
              @mousemove="onDrag"
              @mouseup="stopDrag"
              @mouseleave="stopDrag"
              @touchstart="startDrag"
              @touchmove="onDrag"
              @touchend="stopDrag"
            />
          </div>
        </div>
      </teleport>
    </div>
  </div>
</template>

<style scoped>
.mermaid {
  font-family: inherit;
  transition: opacity 0.2s ease-in-out;
}

.mermaid :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

.fullscreen {
  width: 100%;
  max-height: 100% !important;
  height: 100% !important;
}

.mermaid-action-btn {
  font-family: inherit;
}

.mermaid-action-btn:active {
  transform: scale(0.98);
}
</style>
