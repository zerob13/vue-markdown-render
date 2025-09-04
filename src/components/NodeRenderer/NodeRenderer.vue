<script setup lang="ts">
import type { BaseNode } from '../../utils'
import { v4 as uuidv4 } from 'uuid'

import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getMarkdown, parseMarkdownToStructure } from '../../utils/markdown'
import { setNodeComponents } from '../../utils/nodeComponents'
import AdmonitionNode from '../AdmonitionNode'
import BlockquoteNode from '../BlockquoteNode'
import CheckboxNode from '../CheckboxNode'
import CodeBlockNode from '../CodeBlockNode'
import DefinitionListNode from '../DefinitionListNode'
import EmojiNode from '../EmojiNode'
import EmphasisNode from '../EmphasisNode'
import FootnoteNode from '../FootnoteNode'
import FootnoteReferenceNode from '../FootnoteReferenceNode'
import HardBreakNode from '../HardBreakNode'
import HeadingNode from '../HeadingNode'
import HighlightNode from '../HighlightNode'
import ImageNode from '../ImageNode'
import InlineCodeNode from '../InlineCodeNode'
import InsertNode from '../InsertNode'
import LinkNode from '../LinkNode'
import ListNode from '../ListNode'
import MathBlockNode from '../MathBlockNode'
import MathInlineNode from '../MathInlineNode'
import ParagraphNode from '../ParagraphNode'
import StrikethroughNode from '../StrikethroughNode'
import StrongNode from '../StrongNode'
import SubscriptNode from '../SubscriptNode'
import SuperscriptNode from '../SuperscriptNode'

import TableNode from '../TableNode'
import TextNode from '../TextNode'
import ThematicBreakNode from '../ThematicBreakNode'
import FallbackComponent from './FallbackComponent.vue'

// 组件接收的 props
const props = defineProps<
  | {
      content: string
      nodes?: undefined
      customComponents?: Record<string, any>
      typewriterEffect?: boolean
    }
  | {
      content?: undefined
      nodes: BaseNode[]
      customComponents?: Record<string, any>
      typewriterEffect?: boolean
    }
>()

// 定义事件
defineEmits(['copy', 'handleArtifactClick', 'click', 'mouseover', 'mouseout'])
const id = ref(`editor-${uuidv4()}`)
const md = getMarkdown(id.value)
const containerRef = ref<HTMLElement>()
const showCursor = ref(false)

const parsedNodes = computed<BaseNode[]>(() => {
  // 解析 content 字符串为节点数组
  return props.nodes?.length
    ? props.nodes
    : props.content
    ? parseMarkdownToStructure(props.content, md)
    : []
})

// 监听内容变化，控制光标显示
let cursorTimeout: number | null = null
let animationFrame: number | null = null // used for requestAnimationFrame id
let lastContentLength = 0
let debounceTimeout: number | null = null
let isVisible = true

watch(
  () => props.content,
  (newContent) => {
    if (props.typewriterEffect && newContent) {
      const currentLength = newContent.length
      // 只有当内容实际增加时才更新光标
      if (currentLength > lastContentLength) {
        showCursor.value = true
        lastContentLength = currentLength

        // 清除之前的定时器和动画帧
        if (cursorTimeout) {
          clearTimeout(cursorTimeout)
        }
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
        if (debounceTimeout) {
          clearTimeout(debounceTimeout)
        }

        // 立即更新光标位置
        requestAnimationFrame(() => {
          updateCursorPosition()
        })

        // 防抖：如果短时间内有多次更新，延迟隐藏光标
        debounceTimeout = setTimeout(() => {
          cursorTimeout = setTimeout(() => {
            showCursor.value = false
          }, 3000) // 3秒后隐藏光标（比之前稍短）
        }, 100) // 100ms防抖
      }
    }
  },
  { flush: 'post' },
)

// 设置智能更新机制
onMounted(() => {
  if (props.typewriterEffect) {
    // Use requestAnimationFrame loop and IntersectionObserver to minimize work.
    const startRafLoop = () => {
      if (animationFrame) return

      const loop = () => {
        animationFrame = requestAnimationFrame(loop)
        if (showCursor.value && containerRef.value && isVisible) {
          updateCursorPosition()
        }
      }

      animationFrame = requestAnimationFrame(loop)
    }

    const stopRafLoop = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
      }
    }

    // Start/stop based on visibility of cursor
    watch(
      () => showCursor.value,
      (visible) => {
        if (visible) startRafLoop()
        else stopRafLoop()
      },
      { immediate: true },
    )

    // Observe container visibility to pause expensive updates when not visible
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      isVisible = entry ? entry.isIntersecting : true
      if (!isVisible) {
        // pause updates
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
          animationFrame = null
        }
      } else if (showCursor.value) {
        startRafLoop()
      }
    })

    onMounted(() => {
      if (containerRef.value) observer.observe(containerRef.value)
    })

    onUnmounted(() => {
      observer.disconnect()
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
        animationFrame = null
      }
    })
  }
})

onUnmounted(() => {
  // Ensure timers/frames are cleared
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  if (cursorTimeout) {
    clearTimeout(cursorTimeout)
    cursorTimeout = null
  }
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
    debounceTimeout = null
  }
})

// 获取最后一个文本元素的位置来放置光标
function updateCursorPosition() {
  if (!props.typewriterEffect || !containerRef.value || !showCursor.value)
    return

  const cursor = containerRef.value.querySelector(
    '.typewriter-cursor',
  ) as HTMLElement
  if (!cursor) return

  try {
    // 查找容器内所有的文本节点
    const walker = document.createTreeWalker(
      containerRef.value,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 过滤掉光标元素和空白文本节点
          const parent = node.parentElement
          if (parent?.classList.contains('typewriter-cursor')) {
            return NodeFilter.FILTER_REJECT
          }
          return node.textContent?.trim()
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT
        },
      },
    )

    let lastTextNode = null
    let currentNode
    while ((currentNode = walker.nextNode())) {
      lastTextNode = currentNode
    }

    if (lastTextNode && lastTextNode.textContent) {
      // 创建范围来获取最后一个字符的位置
      const range = document.createRange()
      const textLength = lastTextNode.textContent.length
      range.setStart(lastTextNode, textLength)
      range.setEnd(lastTextNode, textLength)

      const rect = range.getBoundingClientRect()
      const containerRect = containerRef.value.getBoundingClientRect()

      // 检查 rect 是否有效
      if (rect.width === 0 && rect.height === 0) {
        // 如果范围无效，尝试使用父元素的位置
        const parentElement = lastTextNode.parentElement
        if (parentElement) {
          const parentRect = parentElement.getBoundingClientRect()
          const left = parentRect.right - containerRect.left
          const top = parentRect.top - containerRect.top

          const computedStyle = window.getComputedStyle(parentElement)
          const fontSize = Number.parseFloat(computedStyle.fontSize) || 16

          cursor.style.transform = `translate(${left}px, ${top}px)`
          cursor.style.height = `${fontSize}px`
          cursor.style.fontSize = `${fontSize}px`
        }
        return
      }

      // 计算相对于容器的位置
      const left = rect.left - containerRect.left
      const top = rect.top - containerRect.top

      // 获取文本行的高度信息
      const parentElement = lastTextNode.parentElement
      let lineHeight = 16 // 默认行高

      if (parentElement) {
        const computedStyle = window.getComputedStyle(parentElement)
        const fontSize = Number.parseFloat(computedStyle.fontSize) || 16
        const computedLineHeight = computedStyle.lineHeight

        if (computedLineHeight === 'normal') {
          lineHeight = fontSize * 1.2 // 默认行高倍数
        } else if (computedLineHeight.endsWith('px')) {
          lineHeight = Number.parseFloat(computedLineHeight)
        } else if (!Number.isNaN(Number.parseFloat(computedLineHeight))) {
          lineHeight = fontSize * Number.parseFloat(computedLineHeight)
        } else {
          lineHeight = fontSize * 1.2
        }

        // 确保光标高度不超过实际字体大小的1.2倍
        lineHeight = Math.min(lineHeight, fontSize * 1.2)
      }

      // 使用 transform 来提高性能，避免重排
      cursor.style.transform = `translate(${left}px, ${top}px)`
      cursor.style.height = `${lineHeight}px`
      cursor.style.fontSize = `${lineHeight}px`
    }
  } catch (error) {
    // 如果任何步骤失败，静默处理错误
    console.warn('Failed to position cursor:', error)
  }
}

// 组件映射表
const nodeComponents = {
  text: TextNode,
  paragraph: ParagraphNode,
  heading: HeadingNode,
  code_block: CodeBlockNode,
  list: ListNode,
  blockquote: BlockquoteNode,
  table: TableNode,
  definition_list: DefinitionListNode,
  footnote: FootnoteNode,
  footnote_reference: FootnoteReferenceNode,
  admonition: AdmonitionNode,
  hardbreak: HardBreakNode,
  link: LinkNode,
  image: ImageNode,
  thematic_break: ThematicBreakNode,
  math_inline: MathInlineNode,
  math_block: MathBlockNode,
  strong: StrongNode,
  emphasis: EmphasisNode,
  strikethrough: StrikethroughNode,
  highlight: HighlightNode,
  insert: InsertNode,
  subscript: SubscriptNode,
  superscript: SuperscriptNode,
  emoji: EmojiNode,
  checkbox: CheckboxNode,
  inline_code: InlineCodeNode,
  // 可以添加更多节点类型
  // 例如:custom_node: CustomNode,
  ...(props.customComponents || {}),
}
setNodeComponents(nodeComponents)
</script>

<template>
  <div ref="containerRef" class="markdown-renderer">
    <component
      :is="nodeComponents[node.type] || FallbackComponent"
      v-for="(node, index) in parsedNodes"
      :key="index"
      :node="node"
      :loading="node.loading"
      @copy="$emit('copy', $event)"
      @handle-artifact-click="$emit('handleArtifactClick', $event)"
      @click="$emit('click', $event)"
      @mouseover="$emit('mouseover', $event)"
      @mouseout="$emit('mouseout', $event)"
    />
    <!-- 打字光标 -->
    <span v-if="typewriterEffect && showCursor" class="typewriter-cursor"
      >|</span
    >
  </div>
</template>

<style scoped>
.markdown-renderer {
  position: relative;
  /* 防止内容更新时的布局抖动 */
  contain: layout;
}

.typewriter-cursor {
  position: absolute;
  top: 0;
  left: 0;
  animation: blink 1s infinite;
  color: currentColor;
  font-weight: normal;
  pointer-events: none;
  z-index: 1000;
  /* 移除 transition 来避免延迟 */
  /* 光标样式 - 细线条，匹配文字大小 */
  width: 1px;
  background-color: currentColor;
  /* 移除文本内容，使用背景色显示光标 */
  text-indent: -9999px;
  overflow: hidden;
  /* 简单的垂直居中 */
  vertical-align: baseline;
  /* 使用 transform 来提高性能 */
  will-change: transform;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
    background-color: currentColor;
  }
  51%,
  100% {
    opacity: 0;
    background-color: transparent;
  }
}

.unknown-node {
  color: #6a737d;
  font-style: italic;
  margin: 1rem 0;
}
</style>

<style></style>
