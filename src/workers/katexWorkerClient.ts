interface Pending {
  resolve: (val: string) => void
  reject: (err: any) => void
  timeoutId: number
}

let worker: Worker | null = null
let workerInitError: any = null

/**
 * Allow user to inject a Worker instance, e.g. from Vite ?worker import.
 */
export function setKaTeXWorker(w: Worker) {
  worker = w
  workerInitError = null
}

/**
 * Remove the current worker instance (for cleanup or SSR).
 */
export function clearKaTeXWorker() {
  if (worker) {
    worker.terminate?.()
  }
  worker = null
  workerInitError = null
}
// runtime debug flag controlled by the main thread
let DEBUG_KATEX_WORKER = false
const pending = new Map<string, Pending>()
// Simple in-memory cache to avoid repeated renders for identical input.
const cache = new Map<string, string>()
const CACHE_MAX = 200

function ensureWorker() {
  if (!worker) {
    workerInitError = new Error('[katexWorkerClient] No worker instance set. Please inject a Worker via setKaTeXWorker().')
    return null
  }
  return worker
}

// Allow toggling verbose worker debug logs at runtime. When set, we post an init
// message to an existing worker so the worker can enable logs.
export function setKaTeXWorkerDebug(enabled: boolean) {
  DEBUG_KATEX_WORKER = !!enabled
  if (worker) {
    (worker as any).postMessage({ type: 'init', debug: DEBUG_KATEX_WORKER })
  }
}

export async function renderKaTeXInWorker(content: string, displayMode = true, timeout = 2000, signal?: AbortSignal): Promise<string> {
  if (workerInitError) {
    return Promise.reject(workerInitError)
  }
  // Quick cache hit
  const cacheKey = `${displayMode ? 'd' : 'i'}:${content}`
  const cached = cache.get(cacheKey)
  if (cached)
    return Promise.resolve(cached)
  // If workers are unavailable, reject to let caller fallback
  const wk = ensureWorker()
  if (!wk) {
    return Promise.reject(workerInitError)
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      // align with DOM abort semantics
      const err = new Error('Aborted')
        ; (err as any).name = 'AbortError'
      reject(err)
      return
    }
    const id = Math.random().toString(36).slice(2)
    const timeoutId = (globalThis as any).setTimeout(() => {
      pending.delete(id)
      const err = new Error('Worker render timed out')
        ; (err as any).name = 'WorkerTimeout'
      ; (err as any).code = 'WORKER_TIMEOUT'
      reject(err)
    }, timeout)

    // Listen for abort to cancel this pending request
    const onAbort = () => {
      (globalThis as any).clearTimeout(timeoutId)
      if (pending.has(id))
        pending.delete(id)
      const err = new Error('Aborted')
        ; (err as any).name = 'AbortError'
      reject(err)
    }
    if (signal)
      signal.addEventListener('abort', onAbort, { once: true })

    pending.set(id, { resolve, reject, timeoutId })

    wk.postMessage({ id, content, displayMode })
  })
}

// Allow callers (e.g. main-thread fallback renderers) to populate the internal cache
// so that synchronous renders can benefit subsequent worker-based calls.
export function setKaTeXCache(content: string, displayMode = true, html: string) {
  const cacheKey = `${displayMode ? 'd' : 'i'}:${content}`
  cache.set(cacheKey, html)
  if (cache.size > CACHE_MAX) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
}
