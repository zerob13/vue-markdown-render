<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThrottleFn } from '@vueuse/core'
import { Icon } from '@iconify/vue'
import type { EditorView } from 'codemirror'

// Optional: Import artifact store if needed
import { nanoid } from 'nanoid'

import MermaidBlockNode from '../MermaidBlockNode'

import { detectLanguage, getLanguageIcon, useCodeEditor } from '../../utils'
import { isDark } from '../../utils/isDark'

const props = defineProps<{
  node: {
    type: 'code_block'
    language: string
    code: string
    raw: string
  }
}>()

const emits = defineEmits(['previewCode'])
const { t } = useI18n()
const codeEditor = ref<HTMLElement | null>(null)
const copyText = ref(t('common.copy'))
const editorInstance = ref<EditorView | null>(null)
const codeLanguage = ref(props.node.language || '')
const { createEditor, cleanupEditor } = useCodeEditor()

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
  return lang === 'html' || lang === 'svg'
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

// 映射一些常见语言的显示名称
const languageMap: Record<string, string> = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'jsx': 'JSX',
  'tsx': 'TSX',
  'html': 'HTML',
  'css': 'CSS',
  'scss': 'SCSS',
  'json': 'JSON',
  'py': 'Python',
  'python': 'Python',
  'rb': 'Ruby',
  'go': 'Go',
  'java': 'Java',
  'c': 'C',
  'cpp': 'C++',
  'cs': 'C#',
  'php': 'PHP',
  'sh': 'Shell',
  'bash': 'Bash',
  'sql': 'SQL',
  'yaml': 'YAML',
  'md': 'Markdown',
  '': 'Plain Text',
  'plain': 'Plain Text',
}

// 计算用于显示的语言名称
const displayLanguage = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
})

// Computed property for language icon
const languageIcon = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return getLanguageIcon(lang)
})

// 获取语言扩展

// 复制代码
async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.node.code)
    copyText.value = t('common.copySuccess')
    setTimeout(() => {
      copyText.value = t('common.copy')
    }, 2000)
  }
  catch (err) {
    console.error('复制失败:', err)
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
    id: `temp-${lowerLang}-${nanoid()}`,
  })
}

// 监听主题变化
watch(
  () => isDark.value,
  () => {
    if (codeEditor.value)
      editorInstance.value = createEditor(codeEditor.value, props.node.code, codeLanguage.value)
  },
)

// 监听代码变化
watch(
  () => props.node.code,
  (newCode) => {
    if (!newCode)
      return

    // If it's a mermaid diagram, re-render it
    if (props.node.language.toLowerCase() === 'mermaid' && codeEditor.value) {
      return
    }

    // Check if we need to detect language
    if (props.node.language === '') {
      throttledDetectLanguage(newCode)
    }

    // For normal code blocks, update the editor content
    if (editorInstance.value) {
      const state = editorInstance.value.state
      editorInstance.value.dispatch({
        changes: { from: 0, to: state.doc.length, insert: newCode },
      })
      // 滚动到底部
      nextTick(() => {
        if (editorInstance.value) {
          const view = editorInstance.value.scrollDOM.parentElement.parentElement
          view.scrollTop = view.scrollHeight
        }
      })
    }
    else {
      // If editor not yet initialized, create it
      if (codeEditor.value)
        editorInstance.value = createEditor(codeEditor.value, props.node.code, codeLanguage.value)
    }
  },
  { immediate: true },
)

// 监听语言变化
watch(
  () => props.node.language,
  () => {
    // If the language changes, we need to recreate the editor with the new language
    if (codeEditor.value)
      editorInstance.value = createEditor(codeEditor.value, props.node.code, codeLanguage.value)
  },
)

// 初始化代码编辑器
onMounted(() => {
  // Initial language setup is now handled above definitions
  if (codeEditor.value)
    editorInstance.value = createEditor(codeEditor.value, props.node.code, codeLanguage.value)
})

// 清理资源
onUnmounted(() => {
  cleanupEditor()
  editorInstance.value = null
})
</script>

<template>
  <MermaidBlockNode v-if="isMermaid" :node="node" />
  <div v-else class="my-4 rounded-lg border border-border overflow-hidden shadow-sm">
    <div class="flex justify-between items-center p-2 bg-muted text-xs">
      <span class="flex items-center space-x-2">
        <Icon :icon="languageIcon" class="w-4 h-4" />
        <span class="text-gray-600 dark:text-gray-400 font-mono font-bold">{{
          displayLanguage
        }}</span>
      </span>
      <div v-if="isPreviewable" class="flex items-center space-x-2">
        <button
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="copyCode"
        >
          {{ copyText }}
        </button>
        <button
          class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="previewCode"
        >
          {{ t('artifacts.preview') }}
        </button>
      </div>
      <button
        v-else
        class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        @click="copyCode"
      >
        {{ copyText }}
      </button>
    </div>
    <div
      ref="codeEditor"
      class="min-h-[30px] max-h-[500px] text-xs overflow-auto bg-background font-mono leading-relaxed"
      :data-language="node.language"
    />
  </div>
</template>

<style>
/* Ensure CodeMirror inherits the right font in the editor */
.cm-editor .cm-content {
  font-family:
    ui-monospace,
    SFMono-Regular,
    SF Mono,
    Menlo,
    Consolas,
    Liberation Mono,
    monospace !important;
}
</style>
