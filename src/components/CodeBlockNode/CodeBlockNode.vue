<script setup lang="ts">
import type { MonacoOptions, ThemeInput } from 'vue-use-monaco'
import { Icon } from '@iconify/vue'
import { useThrottleFn, watchOnce } from '@vueuse/core'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { detectLanguage, useMonaco } from 'vue-use-monaco'
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
    darkTheme?: ThemeInput
    lightTheme?: ThemeInput
    isShowPreview?: boolean
    monacoOptions?: MonacoOptions
  }>(),
  {
    isShowPreview: true,
    darkTheme: undefined,
    lightTheme: undefined,
  },
)

const emits = defineEmits(['previewCode'])
const { t } = useI18n()
const codeEditor = ref<HTMLElement | null>(null)
const copyText = ref(t('common.copy'))
const codeLanguage = ref(props.node.language || '')
const { createEditor, updateCode } = useMonaco({
  wordWrap: 'on', // 'on' | 'off' | 'wordWrapColumn' | 'bounded'
  wrappingIndent: 'same', // 'none' | 'same' | 'indent' | 'deepIndent'
  scrollbar: { horizontal: 'hidden' }, // 隐藏水平滚动条
  themes:
    props.darkTheme && props.lightTheme
      ? [props.darkTheme, props.lightTheme]
      : undefined,
  ...(props.monacoOptions || {}),
})

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
    } else {
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
  return getLanguageIcon(lang)
})

// 复制代码
async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.node.code)
    copyText.value = t('common.copySuccess')
    setTimeout(() => {
      copyText.value = t('common.copy')
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 预览HTML/SVG代码
function previewCode() {
  if (!isPreviewable.value) return

  const lowerLang = props.node.language.toLowerCase()
  const artifactType = lowerLang === 'html' ? 'text/html' : 'image/svg+xml'
  const artifactTitle =
    lowerLang === 'html'
      ? t('artifacts.htmlPreviewTitle') || 'HTML Preview'
      : t('artifacts.svgPreviewTitle') || 'SVG Preview'
  emits('previewCode', {
    node: props.node,
    artifactType,
    artifactTitle,
    id: `temp-${lowerLang}-${uuidv4()}`,
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
    createEditor(codeEditor.value, props.node.code, codeLanguage.value)
  },
)
</script>

<template>
  <MermaidBlockNode v-if="isMermaid" :node="node" />
  <div
    v-else
    class="my-4 rounded-lg border border-border overflow-hidden shadow-sm"
  >
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
    <div ref="codeEditor" />
  </div>
</template>

<style></style>
