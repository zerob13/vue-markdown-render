import type { App } from 'vue'
import HeadingNode from './HeadingNode.vue'

HeadingNode.install = (app: App) => {
  app.component(HeadingNode.__name as string, HeadingNode)
}

export default HeadingNode
