import type { App } from 'vue'
import NodeRenderer from './NodeRenderer.vue'

NodeRenderer.install = (app: App) => {
  app.component(NodeRenderer.__name as string, NodeRenderer)
}

export default NodeRenderer
