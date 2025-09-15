<script setup lang="ts">
import type { MonacoOptions, MonacoTheme } from 'vue-use-monaco'
import { Icon } from '@iconify/vue'
import { useThrottleFn, watchOnce } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
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
  }>(),
  {
    isShowPreview: true,
    darkTheme: undefined,
    lightTheme: undefined,
    loading: true,
  },
)

const emits = defineEmits(['previewCode', 'copy'])
const { t } = useSafeI18n()
const rootRef = ref<HTMLElement | null>(null)
const codeEditor = ref<HTMLElement | null>(null)
const copyText = ref(false)
const codeLanguage = ref(props.node.language || '')
const isExpanded = ref(false)
const canExpand = ref(false)
let cachedExpandedHeight: string | null = null
let cachedNotExpandedHeight: string | null = null

// Setup Monaco before using helpers in functions below
const { createEditor, updateCode, getEditor, getEditorView } = useMonaco({
  wordWrap: 'on', // 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  wrappingIndent: 'same', // 'none' | 'same' | 'indent' | 'deepIndent'
  themes:
    props.darkTheme && props.lightTheme
      ? [props.darkTheme, props.lightTheme]
      : undefined,
  ...(props.monacoOptions || {}),
})

function applyExpandedHeight() {
  const editor = getEditorView()
  const container = codeEditor.value
  if (!editor || !container)
    return
  try {
    cachedNotExpandedHeight = container.style.height || null
    const monacoEditor = getEditor()
    const lineCount = editor.getModel()?.getLineCount() ?? 1
    const lineHeight = editor.getOption(monacoEditor.EditorOption.lineHeight)
    const padding = 16
    const height = lineCount * lineHeight + padding
    const heightCss = `${height}px`

    container.style.maxHeight = heightCss
    // container.style.maxHeight = 'none'
    container.style.overflow = 'visible'
    // debugger
    cachedExpandedHeight = heightCss
    console.log({ cachedExpandedHeight })
  }
  catch {
    // ignore
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
  const editor = getEditorView()
  if (!editor) {
    canExpand.value = false
    return
  }
  try {
    const monacoEditor = getEditor()
    const lineCount = editor.getModel()?.getLineCount() ?? 1
    const lineHeight = editor.getOption(monacoEditor.EditorOption.lineHeight)
    const padding = 16
    const contentHeight = lineCount * lineHeight + padding
    const maxHeightValue = getMaxHeightValue()
    canExpand.value = contentHeight > maxHeightValue + 5
    if (canExpand.value) {
      applyExpandedHeight()
    }
  }
  catch {
    canExpand.value = false
  }
}

// 创建节流版本的语言检测函数,1秒内最多执行一次
const throttledDetectLanguage = useThrottleFn(
  (code: string) => {
    codeLanguage.value = detectLanguage(code)
  },
  1000,
  true,
)

// Initialize language detection if needed, after the function is defined
if (props.node.language === '') {
  throttledDetectLanguage(props.node.code)
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
    if (newLanguage === '') {
      throttledDetectLanguage(props.node.code)
    }
    else {
      codeLanguage.value = newLanguage
    }
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
    container.style.height = cachedExpandedHeight
    container.style.maxHeight = 'none'
    container.style.overflow = 'visible'
  }
  else {
    container.style.overflow = 'auto'
    container.style.height = cachedNotExpandedHeight ?? ''
  }
}

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

// 监听代码变化
watch(
  () => [props.node.code, codeLanguage.value],
  () => {
    updateCode(props.node.code, codeLanguage.value)
  },
)

watchOnce(
  () => codeEditor.value,
  () => {
    createEditor(codeEditor.value!, props.node.code, codeLanguage.value).then(() => {
      setTimeout(() => {
        updateCanExpand()
      }, 1000)
    })
  },
)

// 当 loading 变为 false 时：计算并缓存一次展开高度，清理可安全移除的监听器
watch(
  () => props.loading,
  (loaded) => {
    if (loaded === false) {
      updateCanExpand()
    }
  },
)
</script>

<template>
  <MermaidBlockNode v-if="isMermaid" :node="node" />
  <div
    v-else
    ref="rootRef"
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
        <button
          type="button"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="copy"
        >
          <Icon v-if="!copyText" icon="lucide:copy" class="w-3 h-3" />
          <Icon v-else icon="lucide:check" class="w-3 h-3" />
        </button>
        <button
          v-if="!loading && canExpand"
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
  will-change: opacity;
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
</style>
