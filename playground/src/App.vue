<script setup lang="ts">
import MarkdownRender from '../../src/components/NodeRenderer'
import { streamContent } from './const/markdown'

// 每隔 10 毫秒输出一部分内容
const content = ref('')
useInterval(10, {
  callback() {
    if (content.value.length < streamContent.length) {
      content.value += streamContent.slice(
        content.value.length,
        content.value.length + 1,
      )
    }
  },
})

// 主题切换
const isDark = useDark()
const toggleTheme = useToggle(isDark)
</script>

<template>
  <div class="app-container" h-screen relative>
    <!-- 主题切换按钮 -->
    <button
      class="theme-toggle"
      fixed
      top-4 right-4 z-10 w-10
      h-10 rounded-full bg-gray-200
      dark:bg-gray-700 hover:bg-gray-300
      dark:hover:bg-gray-600 border
      border-gray-300 dark:border-gray-600 transition-all
      duration-200 flex
      items-center justify-center
      shadow-sm
      hover:shadow-md
      @click="toggleTheme()"
    >
      <div v-if="isDark" i-carbon-sun class="w5 h5 text-yellow-500" />
      <div v-else i-carbon-moon class="w5 h5 text-blue-600" />
    </button>

    <main p4 h-full flex flex-col-reverse overflow-auto>
      <div class="place-holder" flex-1 />
      <MarkdownRender :content="content" />
    </main>
  </div>
</template>

<style scoped>
.theme-toggle {
  backdrop-filter: blur(8px);
}

.theme-toggle:active {
  transform: scale(0.95);
}
</style>
