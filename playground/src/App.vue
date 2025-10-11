<script setup lang="ts">
import { Icon } from '@iconify/vue'
import MarkdownRender from '../../src/components/NodeRenderer'
import { streamContent } from './const/markdown'
// 每隔 10 毫秒输出一部分内容
const content = ref<string>('')

const VIEWPORT_VH_VAR = '--app-viewport-vh'

const viewportCleanupFns: Array<() => void> = []

function updateViewportHeight() {
  if (typeof window === 'undefined')
    return

  const viewport = window.visualViewport
  const height = viewport?.height ?? window.innerHeight
  const unit = height / 100
  document.documentElement.style.setProperty(VIEWPORT_VH_VAR, `${unit}px`)
}
// To avoid flashing sequences like ":::" during streaming (which later
// become an AdmonitionNode), we look ahead when encountering ":" and
// defer appending consecutive colons until a non-colon character is seen.
useInterval(16, {
  callback() {
    const cur = content.value.length
    if (cur >= streamContent.length)
      return

    const nextChar = streamContent.charAt(cur)

    // If the next char is a colon, scan ahead for the first non-colon.
    // If the scan reaches the end of the source, do not append yet —
    // wait for more characters to arrive. Otherwise append the whole
    // run of colons plus the following non-colon in one go.
    if (nextChar === ':') {
      let j = cur
      while (j < streamContent.length && streamContent.charAt(j) === ':') {
        j++
      }

      // Still only colons available (no following non-colon yet): defer.
      if (j === streamContent.length) {
        return
      }

      // Append the run of colons and the following non-colon together.
      content.value += streamContent.slice(cur, j + 1)
      return
    }

    // Normal single-character append for non-colon characters.
    content.value += nextChar
  },
})

// 主题切换
const isDark = useDark()
const toggleTheme = useToggle(isDark)
// Code block theme selector (single dropdown)
const themes = [
  'andromeeda',
  'aurora-x',
  'ayu-dark',
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
  'dark-plus',
  'dracula',
  'dracula-soft',
  'everforest-dark',
  'everforest-light',
  'github-dark',
  'github-dark-default',
  'github-dark-dimmed',
  'github-dark-high-contrast',
  'github-light',
  'github-light-default',
  'github-light-high-contrast',
  'gruvbox-dark-hard',
  'gruvbox-dark-medium',
  'gruvbox-dark-soft',
  'gruvbox-light-hard',
  'gruvbox-light-medium',
  'gruvbox-light-soft',
  'houston',
  'kanagawa-dragon',
  'kanagawa-lotus',
  'kanagawa-wave',
  'laserwave',
  'light-plus',
  'material-theme',
  'material-theme-darker',
  'material-theme-lighter',
  'material-theme-ocean',
  'material-theme-palenight',
  'min-dark',
  'min-light',
  'monokai',
  'night-owl',
  'nord',
  'one-dark-pro',
  'one-light',
  'plastic',
  'poimandres',
  'red',
  'rose-pine',
  'rose-pine-dawn',
  'rose-pine-moon',
  'slack-dark',
  'slack-ochin',
  'snazzy-light',
  'solarized-dark',
  'solarized-light',
  'synthwave-84',
  'tokyo-night',
  'vesper',
  'vitesse-black',
  'vitesse-dark',
  'vitesse-light',
]
const selectedTheme = ref('vitesse-dark')

// 格式化主题名称显示
function formatThemeName(themeName: string) {
  return themeName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// 设置面板显示状态
const showSettings = ref(false)

// Auto-scroll to bottom as content streams in
const messagesContainer = ref<HTMLElement | null>(null)
const autoScrollEnabled = ref(true) // Track if auto-scroll is enabled
const lastScrollTop = ref(0) // Track last scroll position to detect scroll direction
// Track the last user-driven scroll direction: 'none' (no user scroll yet), 'up', or 'down'
const lastUserScrollDirection = ref<'none' | 'up' | 'down'>('none')
// Timestamp of last user scroll event (ms)
const lastUserScrollTime = ref(0)
// Flag to ignore scroll events caused by our own programmatic scrolling
const isProgrammaticScroll = ref(false)

// Check if user is at the bottom of scroll area
function isAtBottom(element: HTMLElement, threshold = 50): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
}

// Handle scroll event to manage auto-scroll behavior
function handleContainerScroll() {
  if (!messagesContainer.value)
    return

  // Ignore scroll events initiated by our programmatic scrollTo calls
  if (isProgrammaticScroll.value)
    return

  const currentScrollTop = messagesContainer.value.scrollTop

  // Update timestamp and determine direction
  lastUserScrollTime.value = Date.now()
  if (currentScrollTop < lastScrollTop.value) {
    // User scrolled up
    lastUserScrollDirection.value = 'up'
    autoScrollEnabled.value = false
  }
  else if (currentScrollTop > lastScrollTop.value) {
    // User scrolled down
    lastUserScrollDirection.value = 'down'
    // If near bottom, re-enable auto-scroll
    if (isAtBottom(messagesContainer.value))
      autoScrollEnabled.value = true
  }

  // Update last scroll position for future comparisons
  lastScrollTop.value = currentScrollTop
}

// Track touch/pointer start positions to detect direction
const touchStartY = ref<number | null>(null)
const pointerStartY = ref<number | null>(null)

// Wheel: only disable auto-scroll when user scrolls up (deltaY < 0).
function handleWheel(e: WheelEvent) {
  try {
    if (!messagesContainer.value)
      return

    // Treat wheel as a user-driven scroll; record time and direction
    lastUserScrollTime.value = Date.now()
    if (e.deltaY < 0) {
      // Scrolling up
      lastUserScrollDirection.value = 'up'
      autoScrollEnabled.value = false
    }
    else if (e.deltaY > 0) {
      // Scrolling down
      lastUserScrollDirection.value = 'down'
      if (isAtBottom(messagesContainer.value))
        autoScrollEnabled.value = true
    }
  }
  catch {
    // ignore
  }
}

// Touch handlers: detect move direction between touchstart and touchmove
function handleTouchStart(e: TouchEvent) {
  if (e.touches && e.touches.length > 0) {
    touchStartY.value = e.touches[0].clientY
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!messagesContainer.value || touchStartY.value == null || !e.touches || e.touches.length === 0)
    return

  const currentY = e.touches[0].clientY
  const delta = currentY - touchStartY.value
  // Positive delta means finger moved down -> content scrolls up (towards top) -> user viewing earlier content
  lastUserScrollTime.value = Date.now()
  if (delta > 0) {
    lastUserScrollDirection.value = 'up'
    autoScrollEnabled.value = false
  }
  else if (delta < 0) {
    lastUserScrollDirection.value = 'down'
    if (isAtBottom(messagesContainer.value))
      autoScrollEnabled.value = true
  }
}

// Pointer handlers for scrollbar drag / pointer-based dragging
function handlePointerDown(e: PointerEvent) {
  pointerStartY.value = (e as PointerEvent).clientY
  // Attach move/up listeners to document to track the drag
  const move = (ev: PointerEvent) => {
    if (pointerStartY.value == null)
      return
    const delta = ev.clientY - pointerStartY.value
    lastUserScrollTime.value = Date.now()
    if (delta > 0) {
      lastUserScrollDirection.value = 'up'
      autoScrollEnabled.value = false
    }
    else if (delta < 0) {
      lastUserScrollDirection.value = 'down'
      if (messagesContainer.value && isAtBottom(messagesContainer.value))
        autoScrollEnabled.value = true
    }
  }

  const up = () => {
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', up)
    pointerStartY.value = null
  }

  document.addEventListener('pointermove', move)
  document.addEventListener('pointerup', up)
}

// Keyboard interactions: only treat upward navigation as disabling; downward navigation may re-enable when near bottom.
function handleKeyDown(e: KeyboardEvent) {
  const upKeys = ['PageUp', 'ArrowUp', 'Home']
  const downKeys = ['PageDown', 'ArrowDown', 'End', 'Space']
  if (upKeys.includes(e.key)) {
    autoScrollEnabled.value = false
  }
  else if (downKeys.includes(e.key)) {
    if (messagesContainer.value && isAtBottom(messagesContainer.value))
      autoScrollEnabled.value = true
  }
}

onMounted(() => {
  updateViewportHeight()

  if (typeof window !== 'undefined') {
    const resizeHandler = () => updateViewportHeight()
    window.addEventListener('resize', resizeHandler)
    window.addEventListener('orientationchange', resizeHandler)
    viewportCleanupFns.push(() => window.removeEventListener('resize', resizeHandler))
    viewportCleanupFns.push(() => window.removeEventListener('orientationchange', resizeHandler))

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resizeHandler)
      window.visualViewport.addEventListener('scroll', resizeHandler)
      viewportCleanupFns.push(() => window.visualViewport?.removeEventListener('resize', resizeHandler))
      viewportCleanupFns.push(() => window.visualViewport?.removeEventListener('scroll', resizeHandler))
    }
  }

  // Initialize lastScrollTop and attach extra listeners
  if (messagesContainer.value) {
    lastScrollTop.value = messagesContainer.value.scrollTop
    messagesContainer.value.addEventListener('wheel', handleWheel, { passive: true })
    messagesContainer.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    messagesContainer.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    messagesContainer.value.addEventListener('pointerdown', handlePointerDown)
    // keydown could be on document
    document.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('wheel', handleWheel)
    messagesContainer.value.removeEventListener('touchstart', handleTouchStart)
    messagesContainer.value.removeEventListener('touchmove', handleTouchMove)
    messagesContainer.value.removeEventListener('pointerdown', handlePointerDown)
    document.removeEventListener('keydown', handleKeyDown)
  }

  viewportCleanupFns.forEach(fn => fn())
  viewportCleanupFns.length = 0
})

watch(content, () => {
  // Only auto-scroll if enabled (user hasn't scrolled away from bottom)
  if (!autoScrollEnabled.value)
    return
  // Sometimes the rendered height isn't stable immediately (async rendering, images, third-party
  // renderers like mermaid, or syntax highlighting). Retry a few times while yielding to the
  // browser (nextTick + requestAnimationFrame) so we reliably end up at the bottom.
  async function scrollToBottomWithRetries(maxAttempts = 6, delay = 20) {
    if (!messagesContainer.value)
      return

    for (let i = 0; i < maxAttempts; i++) {
      // Wait for Vue DOM updates

      await nextTick()
      // Wait for a frame so layout/paint settle

      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))

      if (!messagesContainer.value)
        return

      const el = messagesContainer.value
      const prevScrollHeight = el.scrollHeight
      // Force immediate jump to bottom. Mark as programmatic so our scroll handlers ignore it.
      try {
        isProgrammaticScroll.value = true
        el.scrollTo({ top: el.scrollHeight, behavior: 'auto' })
      }
      finally {
        // Allow handlers to run again after a short tick so lastScrollTop can be updated correctly
        // We clear the flag after next frame below (so handlers triggered this frame are ignored).
      }

      // Yield a frame to ensure the scroll event (if emitted) happens while isProgrammaticScroll is true
      await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)))
      // Clear programmatic flag now so future user scrolls are handled
      isProgrammaticScroll.value = false

      // If height didn't change much or we're at bottom, stop retrying
      if (Math.abs(el.scrollHeight - prevScrollHeight) < 2 || isAtBottom(el, 2))
        return

      // Small delay before next attempt

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  scrollToBottomWithRetries()
})
</script>

<template>
  <div class="flex items-center justify-center p-4 app-container bg-gray-50 dark:bg-gray-900">
    <!-- 设置按钮和面板 -->
    <div class="fixed top-4 right-4 z-10">
      <!-- 设置按钮 -->
      <button
        class="
          settings-toggle w-10 h-10 rounded-full
          bg-white/95 dark:bg-gray-800/95
          backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50
          hover:bg-gray-50 dark:hover:bg-gray-700/50
          shadow-lg dark:shadow-gray-900/20
          transition-all duration-200 flex items-center justify-center
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
        "
        :class="{ 'ring-2 ring-blue-500/50': showSettings }"
        @click="showSettings = !showSettings"
      >
        <Icon
          icon="carbon:settings"
          class="w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200"
          :class="{ 'rotate-90': showSettings }"
        />
      </button>

      <!-- 设置面板 -->
      <Transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="opacity-0 scale-95 translate-y-2"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-2"
      >
        <div
          v-if="showSettings"
          class="
            absolute top-12 right-0 mt-2
            bg-white/95 dark:bg-gray-800/95
            backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50
            rounded-xl shadow-xl dark:shadow-gray-900/30
            p-4 space-y-4 min-w-[220px]
            origin-top-right
          "
          @click.stop
        >
          <!-- 主题选择器 -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Code Theme
            </label>
            <div class="relative">
              <select
                v-model="selectedTheme"
                class="
                  w-full appearance-none px-3 py-2 pr-8
                  bg-gray-50 dark:bg-gray-700/50
                  border border-gray-200 dark:border-gray-600
                  rounded-lg text-sm font-medium
                  text-gray-900 dark:text-gray-100
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  transition-all duration-200 cursor-pointer
                "
                aria-label="Code block theme"
                @click.stop
                @change.stop
              >
                <option v-for="t in themes" :key="t" :value="t">
                  {{ formatThemeName(t) }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Icon
                  icon="carbon:chevron-down"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
              </div>
            </div>
          </div>

          <!-- 分割线 -->
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <!-- 主题切换 -->
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Dark Mode
            </label>
            <button
              class="
                relative w-12 h-6 rounded-full
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                hover:shadow-lg active:scale-95
                transition-all duration-200 ease-out
              "
              :style="{
                backgroundColor: isDark ? '#3b82f6' : '#e5e7eb',
                transition: 'background-color 0.35s ease-out, box-shadow 0.2s ease, transform 0.1s ease',
              }"
              @click.stop="toggleTheme()"
            >
              <!-- 滑动圆点 -->
              <div
                class="
                  absolute top-0.5 w-5 h-5 bg-white rounded-full
                  flex items-center justify-center
                  shadow-md hover:shadow-lg
                "
                :style="{
                  left: isDark ? '26px' : '2px',
                  transform: `scale(${isDark ? 1.02 : 1})`,
                  transition: 'left 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.2s ease-out, box-shadow 0.2s ease',
                }"
              >
                <!-- 图标根据状态显示 -->
                <Transition
                  enter-active-class="transition-all duration-300 ease-out"
                  leave-active-class="transition-all duration-200 ease-in"
                  enter-from-class="opacity-0 scale-0 rotate-90"
                  enter-to-class="opacity-100 scale-100 rotate-0"
                  leave-from-class="opacity-100 scale-100 rotate-0"
                  leave-to-class="opacity-0 scale-0 rotate-90"
                  mode="out-in"
                >
                  <Icon
                    v-if="isDark"
                    key="moon"
                    icon="carbon:moon"
                    class="w-3 h-3 text-blue-600 drop-shadow-sm"
                  />
                  <Icon
                    v-else
                    key="sun"
                    icon="carbon:sun"
                    class="w-3 h-3 text-yellow-500 drop-shadow-sm"
                  />
                </Transition>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Chatbot-style container -->
    <div class="chatbot-container max-w-5xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl dark:shadow-gray-900/50 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
      <!-- Header -->
      <div class="chatbot-header px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Icon icon="carbon:chat" class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Vue Markdown Renderer
              </h1>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Streaming markdown demo
              </p>
            </div>
          </div>

          <!-- GitHub Star Button -->
          <a
            href="https://github.com/Simon-He95/vue-markdown-render"
            target="_blank"
            rel="noopener noreferrer"
            class="
              github-star-btn flex items-center gap-2 px-3 py-1.5
              bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600
              text-white text-sm font-medium rounded-lg
              transition-all duration-200
              shadow-md hover:shadow-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500/50
            "
          >
            <Icon icon="carbon:star" class="w-4 h-4" />
            <span>Star</span>
          </a>
        </div>
      </div>

      <!-- Messages area with scroll -->
      <main ref="messagesContainer" class="chatbot-messages flex-1 overflow-y-auto mr-[1px] mb-4" @scroll="handleContainerScroll">
        <MarkdownRender
          :content="content"
          :code-block-dark-theme="selectedTheme || undefined"
          :code-block-light-theme="selectedTheme || undefined"
          :themes="themes"
          :is-dark="isDark"
          class="p-6"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
:global(:root) {
  --app-viewport-vh: 1vh;
}

.app-container {
  transition: background-color 0.3s ease;
  min-height: calc(var(--app-viewport-vh, 1vh) * 100);
  overflow: hidden;
}

.chatbot-container {
  transition: all 0.3s ease;
  overscroll-behavior: contain;
  height: calc(var(--app-viewport-vh, 1vh) * 100 - 2rem);
  max-height: calc(var(--app-viewport-vh, 1vh) * 100 - 2rem);
}

.github-star-btn:active {
  transform: scale(0.95);
}

.chatbot-messages {
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}

.chatbot-messages::-webkit-scrollbar {
  width: 8px;
}

.chatbot-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chatbot-messages::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dark .chatbot-messages::-webkit-scrollbar-thumb {
  background: #475569;
}

.chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .chatbot-messages::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.settings-toggle {
  backdrop-filter: blur(8px);
}

.settings-toggle:active {
  transform: scale(0.95);
}

/* 主题选择器自定义样式 */
.theme-selector select:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.theme-selector select option {
  padding: 8px 12px;
  background-color: white;
  color: #374151;
}

.dark .theme-selector select option {
  background-color: #1f2937;
  color: #f3f4f6;
}

/* 设置面板动画 */
.settings-panel {
  transform-origin: top right;
}

/* 代码块加载时的流光闪烁效果 */
:deep(.code-block-container.is-rendering) {
  position: relative;
  animation: renderingGlow 2s ease-in-out infinite;
}

@keyframes renderingGlow {
  0% {
    box-shadow:
      0 0 10px rgba(59, 130, 246, 0.4),
      0 0 20px rgba(59, 130, 246, 0.2);
  }
  25% {
    box-shadow:
      0 0 15px rgba(139, 92, 246, 0.5),
      0 0 30px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow:
      0 0 20px rgba(236, 72, 153, 0.5),
      0 0 40px rgba(236, 72, 153, 0.3);
  }
  75% {
    box-shadow:
      0 0 15px rgba(16, 185, 129, 0.5),
      0 0 30px rgba(16, 185, 129, 0.3);
  }
  100% {
    box-shadow:
      0 0 10px rgba(59, 130, 246, 0.4),
      0 0 20px rgba(59, 130, 246, 0.2);
  }
}

/* Mermaid 块加载时的流光闪烁效果 */
:deep(.is-rendering) {
  position: relative;
  animation: renderingGlow 2s ease-in-out infinite;
}
:deep(.prose .markdown-renderer p) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.prose{
  max-width: 100% !important;
}
</style>
