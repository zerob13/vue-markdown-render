import MarkdownRender from './components/NodeRenderer.vue'

export { MarkdownRender }
export * from './utils'

export default MarkdownRender

declare module 'vue' {
  export interface GlobalComponents {
    MarkdownRender: typeof MarkdownRender
  }
}
