import { getUseMonaco } from '../CodeBlockNode/monaco'

let isPreload = false

export function preload() {
  if (isPreload)
    return
  getUseMonaco().then((m) => {
    if (!m) {
      // vue-use-monaco is not available, skip preload
      isPreload = true
      return
    }
    isPreload = true
    m.preloadMonacoWorkers()
  }).catch(() => {
    // Silently handle any errors during preload
    isPreload = true
  })
}
