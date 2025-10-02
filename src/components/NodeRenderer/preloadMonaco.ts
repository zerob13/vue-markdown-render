import { getUseMonaco } from '../CodeBlockNode/monaco'

let isPreload = false

export function preload() {
  if (isPreload)
    return
  getUseMonaco().then((m) => {
    isPreload = true
    m.preloadMonacoWorkers()
  })
}
