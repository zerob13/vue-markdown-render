<script setup lang="ts">
import { Icon } from '@iconify/vue'
import MarkdownRender from '../../src/components/NodeRenderer'
import { streamContent } from './const/markdown'
// 每隔 10 毫秒输出一部分内容
const content = ref<string>('')
// To avoid flashing sequences like ":::" during streaming (which later
// become an AdmonitionNode), we look ahead when encountering ":" and
// defer appending consecutive colons until a non-colon character is seen.
useInterval(10, {
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
</script>

<template>
  <div class="h-screen relative app-container">
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

    <main class="main-content prose prose-sm dark:prose-invert h-full flex flex-col-reverse overflow-auto">
      <MarkdownRender
        :content="content"
        :code-block-dark-theme="selectedTheme || undefined"
        :code-block-light-theme="selectedTheme || undefined"
        :themes="themes"
        class="flex-1 p-8"
      />
    </main>
  </div>
</template>

<style scoped>
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
</style>
