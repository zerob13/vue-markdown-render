interface Pending {
  resolve: (val: string) => void
  reject: (err: any) => void
  timeoutId: number
}

let worker: Worker | null = null
const pending = new Map<string, Pending>()
// Simple in-memory cache to avoid repeated renders for identical input.
const cache = new Map<string, string>()
const CACHE_MAX = 200

function ensureWorker() {
  if (worker)
    return worker
  try {
    // Only create a Worker in a browser environment
    if (typeof window === 'undefined') {
      worker = null
    }
    else {
      // Vite-friendly worker instantiation. Bundlers will inline the worker when configured.
      worker = new Worker(new URL('./katexRenderer.worker.ts', import.meta.url), { type: 'module' })
    }
  }
  catch {
    worker = null
  }

  if (worker) {
    worker.addEventListener('message', (ev: MessageEvent) => {
      const { id, html, error, content, displayMode } = ev.data as any
      const p = pending.get(id)
      if (!p) {
        return
      }
      (globalThis as any).clearTimeout(p.timeoutId)
      pending.delete(id)
      if (error) {
        p.reject(new Error(error))
        return
      }

      // populate cache
      try {
        const cacheKey = `${displayMode ? 'd' : 'i'}:${content}`
        cache.set(cacheKey, html)
        if (cache.size > CACHE_MAX) {
          // evict oldest entry
          const firstKey = cache.keys().next().value
          cache.delete(firstKey)
        }
      }
      catch {
        // ignore cache errors
      }

      p.resolve(html)
    })
  }

  return worker
}

export async function renderKaTeXInWorker(content: string, displayMode = true, timeout = 2000, signal?: AbortSignal): Promise<string> {
  // Quick cache hit
  const cacheKey = `${displayMode ? 'd' : 'i'}:${content}`
  const cached = cache.get(cacheKey)
  if (cached)
    return Promise.resolve(cached)
  // If workers are unavailable, reject to let caller fallback
  const wk = ensureWorker()
  if (!wk)
    return Promise.reject(new Error('Web Worker not available'))

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      // align with DOM abort semantics
      const err = new Error('Aborted')
      ;(err as any).name = 'AbortError'
      reject(err)
      return
    }
    const id = Math.random().toString(36).slice(2)
    const timeoutId = (globalThis as any).setTimeout(() => {
      pending.delete(id)
      reject(new Error('Worker render timed out'))
    }, timeout)

    // Listen for abort to cancel this pending request
    const onAbort = () => {
      (globalThis as any).clearTimeout(timeoutId)
      if (pending.has(id))
        pending.delete(id)
      const err = new Error('Aborted')
      ;(err as any).name = 'AbortError'
      reject(err)
    }
    if (signal)
      signal.addEventListener('abort', onAbort, { once: true })

    pending.set(id, { resolve, reject, timeoutId })

    wk.postMessage({ id, content, displayMode })
  })
}

// When a worker response arrives we set the cache (handled in ensureWorker message handler),
// but the handler does not currently set cache; to keep cache coherent, also set here by
// wrapping the Promise resolution above would be ideal. However, pending resolution occurs
// in the worker message listener which has access to the HTML. To avoid restructuring, callers
// will still get the benefit of cache on subsequent calls once the first render completed.
