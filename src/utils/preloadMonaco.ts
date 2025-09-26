import { getUseMonaco } from '../components/CodeBlockNode/utils'

let isPreload = false

export function preload() {
  if (isPreload)
    return
  getUseMonaco().then((m) => {
    isPreload = true
    m.preloadMonacoWorkers()
  })
}
