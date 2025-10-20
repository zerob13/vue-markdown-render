import { getUseMonaco } from '../CodeBlockNode/monaco'

let isPreload = false
let isPreloading = false
export function preload() {
  if (isPreload || isPreloading)
    return
  isPreloading = true
  getUseMonaco().then((m) => {
    m?.preloadMonacoWorkers()
  }).finally(() => {
    isPreload = true
    isPreloading = false
  })
}
