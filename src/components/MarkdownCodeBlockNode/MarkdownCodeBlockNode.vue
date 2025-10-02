<script setup lang="ts">
import type { Highlighter } from 'shiki'
import { computed, ref, watch } from 'vue'
import { getLanguageIcon, languageMap } from '../../utils'
import { disposeHighlighter, registerHighlight } from './highlight'

const props = withDefaults(
  defineProps<{
    node: {
      type: 'code_block'
      language: string
      code: string
      raw: string
      diff?: boolean
      originalCode?: string
      updatedCode?: string
    }
    loading?: boolean
    darkTheme?: string
    lightTheme?: string
    isDark?: boolean
    isShowPreview?: boolean
    enableFontSizeControl?: boolean
    /** Minimum width for the code block container (px or CSS unit string) */
    minWidth?: string | number
    /** Maximum width for the code block container (px or CSS unit string) */
    maxWidth?: string | number
    themes?: string[]
    /** Header visibility and controls */
    showHeader?: boolean
    showCopyButton?: boolean
    showExpandButton?: boolean
    showPreviewButton?: boolean
    showFontSizeButtons?: boolean
  }>(),
  {
    isShowPreview: true,
    darkTheme: undefined,
    lightTheme: undefined,
    loading: true,
    enableFontSizeControl: true,
    minWidth: undefined,
    maxWidth: undefined,
    // Header configuration: allow consumers to toggle built-in buttons and header visibility
    showHeader: true,
    showCopyButton: true,
    showExpandButton: true,
    showPreviewButton: true,
    showFontSizeButtons: true,
  },
)
const codeLanguage = ref<string>(props.node.language || '')
// 计算用于显示的语言名称
const displayLanguage = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1)
})

const isMermaid = computed(
  () => codeLanguage.value.trim().toLowerCase() === 'mermaid',
)

// Computed property for language icon
const languageIcon = computed(() => {
  const lang = codeLanguage.value.trim().toLowerCase()
  return getLanguageIcon(lang.split(':')[0])
})
const highlighter = ref<Highlighter | null>(null)
watch(() => props.themes, async (newThemes) => {
  disposeHighlighter()
  highlighter.value = await registerHighlight({
    themes: newThemes as any,
  })
}, { immediate: true })
const highlightedCode = ref<string>('')
watch(() => [props.node.code, props.node.language], async ([code, lang]) => {
  if (!highlighter.value)
    return
  if (!code)
    return
  const theme = props.themes && props.themes.length > 0 ? (props.isDark ? props.themes[0] : props.themes[1] || props.themes[0]) : (props.isDark ? props.darkTheme || 'vitesse-dark' : props.lightTheme || 'vitesse-light')
  lang = lang.split(':')[0] // 支持 language:variant 形式
  highlightedCode.value = await highlighter.value.codeToHtml(code, { lang, theme })
})
</script>

<template>
  <MermaidBlockNode v-if="isMermaid" :node="(node as any)" :is-dark="props.isDark" :loading="props.loading" />
  <div v-else class="code-block-container">
    <div
      v-if="props.showHeader"
      class="code-block-header flex justify-between items-center px-4 py-2.5 border-b border-gray-400/5"
      style="color: var(--vscode-editor-foreground);background-color: var(--vscode-editor-background);"
    >
      <!-- left slot / fallback language label -->
      <slot name="header-left">
        <div class="flex items-center space-x-2">
          <span class="icon-slot h-4 w-4 flex-shrink-0" v-html="languageIcon" />
          <span class="text-sm font-medium font-mono">{{ displayLanguage }}</span>
        </div>
      </slot>
    </div>
    <div class="code-block-content px-4 pb-4" v-html="highlightedCode" />
  </div>
</template>

<style scoped>
.code-block-container {
  contain: content;
    /* 新增：显著减少离屏 codeblock 的布局/绘制与样式计算 */
  content-visibility: auto;
  contain-intrinsic-size: 320px 180px;
  border: 1px solid #eee;
  border-radius: 0.375rem; /* rounded-lg */
}
</style>
