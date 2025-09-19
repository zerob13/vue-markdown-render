<script setup lang="ts">
// Avoid static import of `vue-use-monaco` for types so the runtime bundle
// doesn't get a reference. Define minimal local types we need here.
import { computed, onUnmounted, ref, watch } from 'vue'
import { useSafeI18n } from '../../composables/useSafeI18n'
import { getLanguageIcon, languageMap } from '../../utils'
import MermaidBlockNode from '../MermaidBlockNode'
// Tooltip is provided as a singleton via composable to avoid many DOM nodes
import { showTooltipForAnchor, hideTooltip } from '../../composables/useSingletonTooltip'
import { getIconify, getUseMonaco } from './utils'

interface MonacoOptions {
  fontSize?: number
  MAX_HEIGHT?: number | string
  [k: string]: any
}
type MonacoTheme = any

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
// local tooltip logic removed; use shared `showTooltipForAnchor` / `hideTooltip`

const codeLanguage = ref(props.node.language || '')
const isExpanded = ref(false)
const canExpand = ref(false)
let cachedExpandedHeight: string | null = null
let cachedNotExpandedHeight: string | null = null
let editorCreated = false

const Icon = getIconify()

// Lazy-load `vue-use-monaco` helpers at runtime so consumers who don't install
// `vue-use-monaco` won't have the editor code bundled. We provide safe no-op
// fallbacks for the minimal API we use.
let createEditor: (el: HTMLElement, code: string, lang: string) => void = null
let updateCode: (code: string, lang: string) => void = () => {}
let getEditor: () => any = () => null
let getEditorView: () => any = () => ({ getModel: () => ({ getLineCount: () => 1 }), getOption: () => 14, updateOptions: () => {} })
let cleanupEditor: () => void = () => {}
let detectLanguage: (code: string) => string = () => {
  return props.node.language || 'plaintext'
}

;(async () => {
  try {
    const mod = await getUseMonaco()
    // `useMonaco` and `detectLanguage` should be available

    detectLanguage = (mod as any).detectLanguage

    const helpers = mod.useMonaco({
      wordWrap: 'on',
      wrappingIndent: 'same',
      themes: props.darkTheme && props.lightTheme ? [props.darkTheme, props.lightTheme] : undefined,
      ...(props.monacoOptions || {}),
    })
    createEditor = helpers.createEditor || createEditor
    updateCode = helpers.updateCode || updateCode
    getEditor = helpers.getEditor || getEditor
    getEditorView = helpers.getEditorView || getEditorView
    cleanupEditor = helpers.cleanupEditor || cleanupEditor
    if (!editorCreated && codeEditor.value) {
      editorCreated = true
      createEditor(codeEditor.value as HTMLElement, props.node.code, codeLanguage.value)
    }
  }
  catch {
    // vue-use-monaco not installed; fall back to no-op editor behavior
  }
})()

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

// Tooltip helpers: use the global singleton tooltip so there's only one DOM node
function shouldSkipEventTarget(el: EventTarget | null) {
  const btn = el as HTMLButtonElement | null
  return !btn || btn.disabled
}

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'
function onBtnHover(e: Event, text: string, place: TooltipPlacement = 'top') {
  if (shouldSkipEventTarget(e.currentTarget))
    return
  showTooltipForAnchor(e.currentTarget as HTMLElement, text, place)
}

function onBtnLeave() {
  hideTooltip()
}

function onCopyHover(e: Event) {
  if (shouldSkipEventTarget(e.currentTarget))
    return
  const txt = copyText.value ? (t('common.copied') || 'Copied') : (t('common.copy') || 'Copy')
  showTooltipForAnchor(e.currentTarget as HTMLElement, txt)
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  const editor = getEditorView()
  const container = codeEditor.value
  if (!editor || !container)
    return

  if (isExpanded.value) {
    container.style.height = cachedExpandedHeight
    container.style.maxHeight = 'none'
    container.style.overflow = 'visible'
  }
  else {
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
    if (!editorCreated || isMermaid.value)
      return

    updateCode(props.node.code, codeLanguage.value)
  },
  { flush: 'post', immediate: false },
)

// 延迟创建编辑器：仅当不是 Mermaid 时才创建，避免无意义的初始化
const stopCreateEditorWatch = watch(
  () => [codeEditor.value, isMermaid.value] as const,
  async ([el, mermaid]) => {
    if (!el || mermaid || editorCreated || !createEditor)
      return
    editorCreated = true
    createEditor(el as HTMLElement, props.node.code, codeLanguage.value)
    const editor = getEditorView()
    editor?.updateOptions({ fontSize: codeFontSize.value })
    stopCreateEditorWatch()
  },
  { immediate: true },
)

// 当 loading 变为 false 时：计算并缓存一次展开高度，清理可安全移除的监听器
const stop = watch(
  () => props.loading,
  (loaded) => {
    if (isMermaid.value) {
      cleanupEditor()
      return
    }
    if (loaded === false) {
      updateCanExpand()
    }
    stop()
  },
)

onUnmounted(() => {
  cleanupEditor()
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
        <span class="h-4 w-4 flex-shrink-0" v-html="languageIcon" />
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400 font-mono">{{ displayLanguage }}</span>
      </div>

      <!-- 右侧操作按钮（合并重复结构） -->
      <div class="flex items-center space-x-2">
        <template v-if="props.enableFontSizeControl">
          <button
            type="button"
            class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            :disabled="codeFontSize <= codeFontMin"
            @click="decreaseCodeFont()"
            @mouseenter="onBtnHover($event, t('common.decrease') || 'Decrease')"
            @focus="onBtnHover($event, t('common.decrease') || 'Decrease')"
            @mouseleave="onBtnLeave"
            @blur="onBtnLeave"
          >
            <Icon icon="lucide:minus" class="w-3 h-3" />
          </button>
          <button
            type="button"
            class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            :disabled="codeFontSize === defaultCodeFontSize"
            @click="resetCodeFont()"
            @mouseenter="onBtnHover($event, t('common.reset') || 'Reset')"
            @focus="onBtnHover($event, t('common.reset') || 'Reset')"
            @mouseleave="onBtnLeave"
            @blur="onBtnLeave"
          >
            <Icon icon="lucide:rotate-ccw" class="w-3 h-3" />
          </button>
          <button
            type="button"
            class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            :disabled="codeFontSize >= codeFontMax"
            @click="increaseCodeFont()"
            @mouseenter="onBtnHover($event, t('common.increase') || 'Increase')"
            @focus="onBtnHover($event, t('common.increase') || 'Increase')"
            @mouseleave="onBtnLeave"
            @blur="onBtnLeave"
          >
            <Icon icon="lucide:plus" class="w-3 h-3" />
          </button>
        </template>
        <button
          type="button"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :aria-label="copyText ? (t('common.copied') || 'Copied') : (t('common.copy') || 'Copy')"
          @click="copy"
          @mouseenter="onCopyHover($event)"
          @focus="onCopyHover($event)"
          @mouseleave="onBtnLeave"
          @blur="onBtnLeave"
        >
          <Icon v-if="!copyText" icon="lucide:copy" class="w-3 h-3" />
          <Icon v-else icon="lucide:check" class="w-3 h-3" />
        </button>
        <button
          v-if="canExpand"
          type="button"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :aria-pressed="isExpanded"
          @click="toggleExpand"
          @mouseenter="onBtnHover($event, isExpanded ? (t('common.collapse') || 'Collapse') : (t('common.expand') || 'Expand'))"
          @focus="onBtnHover($event, isExpanded ? (t('common.collapse') || 'Collapse') : (t('common.expand') || 'Expand'))"
          @mouseleave="onBtnLeave"
          @blur="onBtnLeave"
        >
          <Icon :icon="isExpanded ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="w-3 h-3" />
        </button>
        <button
          v-if="isPreviewable"
          type="button"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :aria-label="t('common.preview') || 'Preview'"
          @click="previewCode"
          @mouseenter="onBtnHover($event, t('common.preview') || 'Preview')"
          @focus="onBtnHover($event, t('common.preview') || 'Preview')"
          @mouseleave="onBtnLeave"
          @blur="onBtnLeave"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><!-- Icon from Freehand free icons by Streamline - https://creativecommons.org/licenses/by/4.0/ --><g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"><path d="M23.628 7.41c-.12-1.172-.08-3.583-.9-4.233c-1.921-1.51-6.143-1.11-8.815-1.19c-3.481-.15-7.193.14-10.625.24a.34.34 0 0 0 0 .67c3.472-.05 7.074-.29 10.575-.09c2.471.15 6.653-.14 8.254 1.16c.4.33.41 2.732.49 3.582a42 42 0 0 1 .08 9.005a13.8 13.8 0 0 1-.45 3.001c-2.42 1.4-19.69 2.381-20.72.55a21 21 0 0 1-.65-4.632a41.5 41.5 0 0 1 .12-7.964c.08 0 7.334.33 12.586.24c2.331 0 4.682-.13 6.764-.21a.33.33 0 0 0 0-.66c-7.714-.16-12.897-.43-19.31.05c.11-1.38.48-3.922.38-4.002a.3.3 0 0 0-.42 0c-.37.41-.29 1.77-.36 2.251s-.14 1.07-.2 1.6a45 45 0 0 0-.36 8.645a21.8 21.8 0 0 0 .66 5.002c1.46 2.702 17.248 1.461 20.95.43c1.45-.4 1.69-.8 1.871-1.95c.575-3.809.602-7.68.08-11.496" /><path d="M4.528 5.237a.84.84 0 0 0-.21-1c-.77-.41-1.71.39-1 1.1a.83.83 0 0 0 1.21-.1m2.632-.25c.14-.14.19-.84-.2-1c-.77-.41-1.71.39-1 1.09a.82.82 0 0 0 1.2-.09m2.88 0a.83.83 0 0 0-.21-1c-.77-.41-1.71.39-1 1.09a.82.82 0 0 0 1.21-.09m-4.29 8.735c0 .08.23 2.471.31 2.561a.371.371 0 0 0 .63-.14c0-.09 0 0 .15-1.72a10 10 0 0 0-.11-2.232a5.3 5.3 0 0 1-.26-1.37a.3.3 0 0 0-.54-.24a6.8 6.8 0 0 0-.2 2.33c-1.281-.38-1.121.13-1.131-.42a15 15 0 0 0-.19-1.93c-.16-.17-.36-.17-.51.14a20 20 0 0 0-.43 3.471c.04.773.18 1.536.42 2.272c.26.4.7.22.7-.1c0-.09-.16-.09 0-1.862c.06-1.18-.23-.3 1.16-.76m5.033-2.552c.32-.07.41-.28.39-.37c0-.55-3.322-.34-3.462-.24s-.2.18-.18.28s0 .11 0 .16a3.8 3.8 0 0 0 1.591.361v.82a15 15 0 0 0-.13 3.132c0 .2-.09.94.17 1.16a.34.34 0 0 0 .48 0c.125-.35.196-.718.21-1.09a8 8 0 0 0 .14-3.232c0-.13.05-.7-.1-.89a8 8 0 0 0 .89-.09m5.544-.181a.69.69 0 0 0-.89-.44a2.8 2.8 0 0 0-1.252 1.001a2.3 2.3 0 0 0-.41-.83a1 1 0 0 0-1.6.27a7 7 0 0 0-.35 2.07c0 .571 0 2.642.06 2.762c.14 1.09 1 .51.63.13a17.6 17.6 0 0 1 .38-3.962c.32-1.18.32.2.39.51s.11 1.081.73 1.081s.48-.93 1.401-1.78q.075 1.345 0 2.69a15 15 0 0 0 0 1.811a.34.34 0 0 0 .68 0q.112-.861.11-1.73a16.7 16.7 0 0 0 .12-3.582m1.441-.201c-.05.16-.3 3.002-.31 3.202a6.3 6.3 0 0 0 .21 1.741c.33 1 1.21 1.07 2.291.82a3.7 3.7 0 0 0 1.14-.23c.21-.22.10-.59-.41-.64q-.817.096-1.64.07c-.44-.07-.34 0-.67-4.442q.015-.185 0-.37a.316.316 0 0 0-.23-.38a.316.316 0 0 0-.38.23" /></g></svg>
        </button>
      </div>
    </div>
    <div ref="codeEditor" class="code-editor-container" />
    <!-- Teleported tooltip removed: using singleton composable instead -->
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
</style>
