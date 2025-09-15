<script setup lang="ts">
import type { MonacoOptions, MonacoTheme } from 'vue-use-monaco'
import { Icon } from '@iconify/vue'
import { useThrottleFn, watchOnce } from '@vueuse/core'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
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
    loading: false,
  },
)

const emits = defineEmits(['previewCode', 'copy'])
const { t } = useSafeI18n()
const rootRef = ref<HTMLElement | null>(null)
const codeEditor = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let io: IntersectionObserver | null = null
let created = false
const copyText = ref(false)
const codeLanguage = ref(props.node.language || '')
const isExpanded = ref(false)
const isEditorReady = ref(false)
const canExpand = ref(false)
let contentSizeListener: { dispose: () => void } | null = null
let availabilityListener: { dispose: () => void } | null = null

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
    const monacoEditor = getEditor()
    const lineCount = editor.getModel()?.getLineCount() ?? 1
    const lineHeight = editor.getOption(monacoEditor.EditorOption.lineHeight)
    const padding = 16
    const height = lineCount * lineHeight + padding
    container.style.height = `${height}px`
    container.style.maxHeight = 'none'
    container.style.overflow = 'visible'
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
    canExpand.value = contentHeight > maxHeightValue
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
    applyExpandedHeight()
    // keep in sync while expanded
    try {
      contentSizeListener?.dispose?.()
    }
    catch {}
    try {
      contentSizeListener = editor.onDidContentSizeChange?.(() => applyExpandedHeight()) ?? null
    }
    catch {
      contentSizeListener = null
    }
  }
  else {
    // collapse: clean up and restore container constraints
    try {
      contentSizeListener?.dispose?.()
    }
    catch {}
    contentSizeListener = null

    const maxH = props.monacoOptions?.MAX_HEIGHT ?? 500
    const maxHCss = typeof maxH === 'number' ? `${maxH}px` : String(maxH)
    container.style.maxHeight = maxHCss
    container.style.overflow = 'auto'
    try {
      const monacoEditor = getEditor()
      const lineCount = editor.getModel()?.getLineCount() ?? 1
      const lineHeight = editor.getOption(monacoEditor.EditorOption.lineHeight)
      const padding = 16
      const height = Math.min(
        lineCount * lineHeight + padding,
        typeof maxH === 'number' ? maxH : Number.MAX_SAFE_INTEGER,
      )
      container.style.height = `${height}px`
    }
    catch {
      // ignore
    }
  }
}

// 预览HTML/SVG代码
function previewCode() {
  if (!isPreviewable.value)
    return

  const lowerLang = props.node.language.toLowerCase()
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
    // 将频繁的更新合并为 150ms 的防抖调用，可根据需要调整为 100/200ms
    updateCode(props.node.code, codeLanguage.value)
  },
)

watchOnce(
  () => codeEditor.value,
  () => {
    const createAndReady = async () => {
      await createEditor(codeEditor.value!, props.node.code, codeLanguage.value)
      created = true
      isEditorReady.value = true
      updateCanExpand()
      try {
        const editor = getEditorView()
        availabilityListener?.dispose?.()
        availabilityListener = editor?.onDidContentSizeChange?.(() => updateCanExpand()) ?? null
      }
      catch {}
      if (isExpanded.value) {
        applyExpandedHeight()
        try {
          const editor = getEditorView()
          contentSizeListener?.dispose?.()
          contentSizeListener = editor?.onDidContentSizeChange?.(() => applyExpandedHeight()) ?? null
        }
        catch {}
      }
    }

    if (isVisible.value && !created) {
      createAndReady()
    }
    else {
      const stop = watch(
        () => isVisible.value,
        (v) => {
          if (v && !created) {
            createAndReady()
            stop()
          }
        },
        { immediate: true },
      )
    }
  },
)

onMounted(() => {
  if (!rootRef.value)
    return
  io = new IntersectionObserver((entries) => {
    const e = entries[0]
    isVisible.value = !!e?.isIntersecting
    // Optionally disconnect once visible to avoid extra work
    if (isVisible.value && io) {
      io.disconnect()
      io = null
    }
  })
  io.observe(rootRef.value)
})

onUnmounted(() => {
  if (io) {
    io.disconnect()
    io = null
  }
  try {
    contentSizeListener?.dispose?.()
  }
  catch {}
  contentSizeListener = null
  try {
    availabilityListener?.dispose?.()
  }
  catch {}
  availabilityListener = null
})
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

      <!-- 右侧操作按钮 -->
      <div v-if="isPreviewable" class="flex items-center space-x-2">
        <button
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="copy"
        >
          <Icon v-if="!copyText" icon="lucide:copy" class="w-3 h-3" />
          <Icon v-else icon="lucide:check" class="w-3 h-3" />
        </button>
        <button
          v-if="isEditorReady && !loading && (canExpand || isExpanded)"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :title="isExpanded ? t('common.collapse') : t('common.expand')"
          :aria-label="isExpanded ? t('common.collapse') : t('common.expand')"
          @click="toggleExpand"
        >
          <Icon :icon="isExpanded ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="w-3 h-3" />
        </button>
        <button
          class="code-action-btn p-2 text-xs rounded-md bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors"
          @click="previewCode"
        >
          {{ t('artifacts.preview') }}
        </button>
      </div>
      <div v-else class="flex items-center space-x-2">
        <button
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          @click="copy"
        >
          <Icon v-if="!copyText" icon="lucide:copy" class="w-3 h-3" />
          <Icon v-else icon="lucide:check" class="w-3 h-3" />
        </button>
        <button
          v-if="isEditorReady && !loading && (canExpand || isExpanded)"
          class="code-action-btn p-2 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          :title="isExpanded ? t('common.collapse') : t('common.expand')"
          :aria-label="isExpanded ? t('common.collapse') : t('common.expand')"
          @click="toggleExpand"
        >
          <Icon :icon="isExpanded ? 'lucide:minimize-2' : 'lucide:maximize-2'" class="w-3 h-3" />
        </button>
      </div>
    </div>
    <div ref="codeEditor" />
  </div>
</template>

<style scoped>
.code-block-container {
  contain: content;
  will-change: opacity;
}

.code-action-btn {
  font-family: inherit;
}

.code-action-btn:active {
  transform: scale(0.98);
}
</style>
