<script setup lang="ts">
import type { WatchStopHandle } from 'vue'
import type { MonacoOptions, MonacoTheme } from 'vue-use-monaco'
import { Icon } from '@iconify/vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { detectLanguage, useMonaco } from 'vue-use-monaco'
import { useSafeI18n } from '../../composables/useSafeI18n'
import { getLanguageIcon, languageMap } from '../../utils'
import MermaidBlockNode from '../MermaidBlockNode'

const props = withDefaults(
  defineProps<{
    node: {
      type: 'code_block'
      language: string
      code: string
      raw: string
    }
    loading?: boolean
    darkTheme?: MonacoTheme
    lightTheme?: MonacoTheme
    isShowPreview?: boolean
    monacoOptions?: MonacoOptions
    enableFontSizeControl?: boolean
  }>(),
  {
    isShowPreview: true,
    darkTheme: undefined,
    lightTheme: undefined,
    loading: true,
    enableFontSizeControl: true,
  },
)

const emits = defineEmits(['previewCode', 'copy'])
const { t } = useSafeI18n()
const codeEditor = ref<HTMLElement | null>(null)
const copyText = ref(false)
const codeLanguage = ref(props.node.language || '')
const isExpanded = ref(false)
const canExpand = ref(false)
let cachedExpandedHeight: string | null = null
let cachedNotExpandedHeight: string | null = null
let editorCreated = false
let expandRafId: number | null = null
// 仅当用户主动点击展开后，才进入自动展开检测模式
let autoExpandActive = false

// Setup Monaco before using helpers in functions below
const { createEditor, updateCode, getEditor, getEditorView, cleanupEditor } = useMonaco({
  wordWrap: 'on', // 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  wrappingIndent: 'same', // 'none' | 'same' | 'indent' | 'deepIndent'
  themes:
    props.darkTheme && props.lightTheme
      ? [props.darkTheme, props.lightTheme]
      : undefined,
  ...(props.monacoOptions || {}),
})

const codeFontMin = 10
const codeFontMax = 36
const codeFontStep = 1
const defaultCodeFontSize = Number(props.monacoOptions?.fontSize ?? 14)
const codeFontSize = ref<number>(defaultCodeFontSize)
const CONTENT_PADDING = 16
function increaseCodeFont() {
  codeFontSize.value = Math.min(codeFontMax, codeFontSize.value + codeFontStep)
}
function decreaseCodeFont() {
  codeFontSize.value = Math.max(codeFontMin, codeFontSize.value - codeFontStep)
}
function resetCodeFont() {
  codeFontSize.value = defaultCodeFontSize
}

function computeContentHeight(): number | null {
  try {
    const editor = getEditorView()
    const monacoEditor = getEditor()
    const lineCount = editor.getModel()?.getLineCount() ?? 1
    const lineHeight = editor.getOption(monacoEditor.EditorOption.lineHeight)
    return lineCount * lineHeight + CONTENT_PADDING
  }
  catch {
    return null
  }
}

function getMaxHeightValue(): number {
  const maxH = props.monacoOptions?.MAX_HEIGHT ?? 500
  if (typeof maxH === 'number')
    return maxH
  const m = String(maxH).match(/^(\d+(?:\.\d+)?)/)
  return m ? Number.parseFloat(m[1]) : 500
}

function updateCanExpand() {
  try {
    cachedNotExpandedHeight = codeEditor.value?.style.height || null
    const contentHeight = computeContentHeight()
    if (contentHeight == null) {
      canExpand.value = false
      return
    }
    const maxHeightValue = getMaxHeightValue()
    canExpand.value = contentHeight > maxHeightValue + 5
    if (canExpand.value) {
      cachedExpandedHeight = `${contentHeight}px`
    }
  }
  catch {
    canExpand.value = false
  }
}

// 初始化语言检测：若未指定语言则立即检测一次，避免不必要的编辑器创建
if (!props.node.language) {
  codeLanguage.value = detectLanguage(props.node.code)
}

// Check if the language is previewable (HTML or SVG)
const isPreviewable = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return props.isShowPreview && (lang === 'html' || lang === 'svg')
})

// Check if the code block is a Mermaid diagram
const isMermaid = computed(
  () => codeLanguage.value.trim().toLowerCase() === 'mermaid',
)

watch(
  () => props.node.language,
  (newLanguage) => {
    if (!newLanguage)
      codeLanguage.value = detectLanguage(props.node.code)
    else
      codeLanguage.value = newLanguage
  },
)

// 如果外部仅提供代码但语言为空，代码变化时也重新检测一次语言
watch(
  () => props.node.code,
  (newCode, oldCode) => {
    if (newCode !== oldCode && !props.node.language)
      codeLanguage.value = detectLanguage(newCode)
  },
)

// 计算用于显示的语言名称
const displayLanguage = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
})

// Computed property for language icon
const languageIcon = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return getLanguageIcon(lang.split(':')[0])
})

// 复制代码
async function copy() {
  try {
    await navigator.clipboard.writeText(props.node.code)
    copyText.value = true
    emits('copy', props.node.code)
    setTimeout(() => {
      copyText.value = false
    }, 1000)
  }
  catch (err) {
    console.error('复制失败:', err)
  }
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  const editor = getEditorView()
  const container = codeEditor.value
  if (!editor || !container)
    return

  if (isExpanded.value) {
    autoExpandActive = true
    // 先计算一次当前内容高度，确保有初始高度
    updateCanExpand()
    container.style.height = cachedExpandedHeight
    container.style.maxHeight = 'none'
    container.style.overflow = 'visible'
    if (props.loading && autoExpandActive)
      startExpandAutoResize()
  }
  else {
    autoExpandActive = false
    stopExpandAutoResize()
    container.style.overflow = 'auto'
    container.style.height = cachedNotExpandedHeight ?? ''
  }
}

watch(
  () => codeFontSize.value,
  (size) => {
    const editor = getEditorView()
    if (!editor)
      return
    editor.updateOptions({ fontSize: size })
    updateCanExpand()
    if (isExpanded.value && cachedExpandedHeight) {
      const height = computeContentHeight()
      if (height != null)
        cachedExpandedHeight = `${height}px`
      const container = codeEditor.value
      if (container) {
        container.style.height = cachedExpandedHeight
      }
    }
  },
  { flush: 'post', immediate: false },
)

// 预览HTML/SVG代码
function previewCode() {
  if (!isPreviewable.value)
    return

  const lowerLang = (codeLanguage.value || props.node.language).toLowerCase()
  const artifactType = lowerLang === 'html' ? 'text/html' : 'image/svg+xml'
  const artifactTitle
    = lowerLang === 'html'
      ? t('artifacts.htmlPreviewTitle') || 'HTML Preview'
      : t('artifacts.svgPreviewTitle') || 'SVG Preview'
  emits('previewCode', {
    node: props.node,
    artifactType,
    artifactTitle,
    id: `temp-${lowerLang}-${Date.now()}`,
  })
}

// 监听代码/语言变化：仅在非 Mermaid 且编辑器已创建时更新，避免重复无效更新
watch(
  () => [props.node.code, codeLanguage.value, isMermaid.value] as const,
  () => {
    if (!editorCreated)
      return
    if (isMermaid.value) {
      cleanupEditor()
      return
    }
    updateCode(props.node.code, codeLanguage.value)
  },
  { flush: 'post', immediate: false },
)

// 延迟创建编辑器：仅当不是 Mermaid 时才创建，避免无意义的初始化
watch(
  () => [codeEditor.value, isMermaid.value] as const,
  async ([el, mermaid]) => {
    if (!el || mermaid || editorCreated)
      return
    editorCreated = true
    createEditor(el as HTMLElement, props.node.code, codeLanguage.value)
    const editor = getEditorView()
    editor?.updateOptions({ fontSize: codeFontSize.value })
    // 若初始化时 loading 已为 false，等待一帧后再计算展开高度
    if (props.loading === false) {
      await nextTick()
      requestAnimationFrame(() => {
        updateCanExpand()
      })
    }
    // 若已展开且仍在加载，则开始逐帧自适应高度
    if (isExpanded.value && props.loading && autoExpandActive) {
      await nextTick()
      startExpandAutoResize()
    }
  },
  { immediate: true },
)

// 当 loading 变为 false 时：计算并缓存一次展开高度，随后停止观察
let stopLoadingWatch: WatchStopHandle | undefined
stopLoadingWatch = watch(
  () => props.loading,
  async (loaded) => {
    if (loaded === false) {
      await nextTick()
      requestAnimationFrame(() => {
        updateCanExpand()
        stopLoadingWatch?.()
        stopLoadingWatch = undefined
      })
      stopExpandAutoResize()
    }
    else if (loaded === true) {
      if (isExpanded.value && autoExpandActive) {
        await nextTick()
        startExpandAutoResize()
      }
    }
  },
  { immediate: true, flush: 'post' },
)

function startExpandAutoResize() {
  stopExpandAutoResize()
  const container = codeEditor.value
  if (!container)
    return
  const tick = () => {
    const contentHeight = computeContentHeight()
    if (contentHeight != null) {
      const nextHeight = `${contentHeight}px`
      const currentHeightNum = cachedExpandedHeight ? Number.parseFloat(cachedExpandedHeight) : 0
      if (!cachedExpandedHeight || contentHeight > currentHeightNum) {
        cachedExpandedHeight = nextHeight
        container.style.height = nextHeight
        container.style.maxHeight = 'none'
        container.style.overflow = 'visible'
      }
    }
    if (props.loading && isExpanded.value) {
      expandRafId = requestAnimationFrame(tick)
    }
    else {
      expandRafId = null
    }
  }
  expandRafId = requestAnimationFrame(tick)
}

function stopExpandAutoResize() {
  if (expandRafId != null) {
    cancelAnimationFrame(expandRafId)
    expandRafId = null
  }
}

onBeforeUnmount(() => {
  stopExpandAutoResize()
})
</script>

<template>
  <MermaidBlockNode v-if="isMermaid" :node="node" :loading="props.loading" />
  <div
    v-else
    class="code-block-container my-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900"
  >
    <!-- 简洁的头部区域 -->
    <div class="code-block-header flex justify-between items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <!-- 左侧语言标签 -->
      <div class="flex items-center space-x-2">
        <span class="icon-slot h-4 w-4 flex-shrink-0" v-html="languageIcon" />
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400 font-mono">{{ displayLanguage }}</span>
      </div>

      <!-- 右侧操作按钮（合并重复结构） -->
      <div class="flex items-center space-x-2">
        <template v-if="props.enableFontSizeControl">
          <button
            type="button"
            class="code-action-btn px-2 py-1 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            :title="t('common.decrease') || 'Decrease font size'"
            :aria-label="t('common.decrease') || 'Decrease font size'"
            :disabled="codeFontSize <= codeFontMin"
            @click="decreaseCodeFont()"
          >
            <Icon icon="lucide:minus" class="w-3 h-3" />
          </button>
          <button
            type="button"
            class="code-action-btn px-2 py-1 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            :title="t('common.reset') || 'Reset font size'"
            :aria-label="t('common.reset') || 'Reset font size'"
            :disabled="codeFontSize === defaultCodeFontSize"
            @click="resetCodeFont()"
          >
            <Icon icon="lucide:rotate-ccw" class="w-3 h-3" />
          </button>
          <button
            type="button"
            class="code-action-btn px-2 py-1 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            :title="t('common.increase') || 'Increase font size'"
            :aria-label="t('common.increase') || 'Increase font size'"
            :disabled="codeFontSize >= codeFontMax"
            @click="increaseCodeFont()"
          >
            <Icon icon="lucide:plus" class="w-3 h-3" />
          </button>
        </template>
        <button
          type="button"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="copy"
        >
          <Icon v-if="!copyText" icon="lucide:copy" class="w-3 h-3" />
          <Icon v-else icon="lucide:check" class="w-3 h-3" />
        </button>
        <button
          type="button"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :title="isExpanded ? t('common.collapse') : t('common.expand')"
          :aria-label="isExpanded ? t('common.collapse') : t('common.expand')"
          :aria-pressed="isExpanded"
          @click="toggleExpand"
        >
          <Icon :icon="isExpanded ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="w-3 h-3" />
        </button>
        <button
          v-if="isPreviewable"
          type="button"
          class="code-action-btn p-2 text-xs rounded-md bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors"
          @click="previewCode"
        >
          {{ t('artifacts.preview') }}
        </button>
      </div>
    </div>
    <div ref="codeEditor" class="code-editor-container" />
    <!-- Copy status for screen readers -->
    <span class="sr-only" aria-live="polite" role="status">{{ copyText ? t('common.copied') || 'Copied' : '' }}</span>
  </div>
</template>

<style scoped>
.code-block-container {
  contain: content;
    /* 新增：显著减少离屏 codeblock 的布局/绘制与样式计算 */
  content-visibility: auto;
  contain-intrinsic-size: 320px 180px;
}

.code-editor-container {
  transition: height 180ms ease, max-height 180ms ease;
}

.code-action-btn {
  font-family: inherit;
}

.code-action-btn:active {
  transform: scale(0.98);
}

.code-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.code-action-btn:disabled:hover {
  background-color: transparent;
}

/* Ensure injected icons align consistently whether img or inline svg */
.icon-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-slot :deep(svg),
.icon-slot :deep(img) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
