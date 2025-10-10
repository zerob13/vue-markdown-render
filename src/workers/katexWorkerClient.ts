interface Pending {
  resolve: (val: string) => void
  reject: (err: any) => void
  timeoutId: number
}

let worker: Worker | null = null
// runtime debug flag controlled by the main thread
let DEBUG_KATEX_WORKER = false
// telemetry / diagnostics listeners for worker errors/timeouts
const errorListeners = new Set<(err: any) => void>()
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
      try {
        console.warn('[katexWorkerClient] window is undefined — Web Worker will not be created')
      }
      catch {}
    }
    else {
      // Vite-friendly worker instantiation. Bundlers will inline the worker when configured.
      worker = new Worker(new URL('./katexRenderer.worker.ts', import.meta.url), { type: 'module' })
      try {
        // send initial debug flag to worker so it can gate debug logs
        ;(worker as any).postMessage({ type: 'init', debug: DEBUG_KATEX_WORKER })
      }
      catch {}
    }
  }
  catch {
    worker = null
    try {
      console.warn('[katexWorkerClient] failed to instantiate Web Worker')
    }
    catch {}
  }

  if (worker) {
    worker.addEventListener('message', (ev: MessageEvent) => {
      const { id, html, error, content, displayMode } = ev.data as any
      const p = pending.get(id)
      if (!p) {
        try {
          console.warn('[katexWorkerClient] received message for unknown id', id, { content, displayMode, error })
        }
        catch {}
        return
      }
      (globalThis as any).clearTimeout(p.timeoutId)
      pending.delete(id)
      if (error) {
        const err = new Error(String(error))
        ;(err as any).name = 'WorkerRenderError'
        ;(err as any).code = 'WORKER_RENDER_ERROR'
        ;(err as any).content = content
        ;(err as any).displayMode = displayMode
        try {
          console.warn('[katexWorkerClient] worker returned an error for id', id, String(error))
        }
        catch {}
        p.reject(err)
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
      catch (e) {
        try {
          console.warn('[katexWorkerClient] cache set failed', e)
        }
        catch {}
      }

      p.resolve(html)
    })

    worker.addEventListener('error', (ev) => {
      try {
        console.error('[katexWorkerClient] Worker error', ev)
      }
      catch {}
      // reject all pending promises so callers can fallback
      for (const [_id, p] of pending.entries()) {
        try {
          const err = new Error('Worker crashed')
          ;(err as any).name = 'WorkerCrashed'
          ;(err as any).code = 'WORKER_CRASHED'
          try {
            for (const h of errorListeners) {
              try {
                h(err)
              }
              catch {}
            }
          }
          catch {}
          p.reject(err)
        }
        catch {}
      }
      pending.clear()
    })

    worker.addEventListener('messageerror', (ev) => {
      try {
        console.error('[katexWorkerClient] Worker messageerror', ev)
      }
      catch {}
    })
  }

  return worker
}

// Allow toggling verbose worker debug logs at runtime. When set, we post an init
// message to an existing worker so the worker can enable logs.
export function setKaTeXWorkerDebug(enabled: boolean) {
  DEBUG_KATEX_WORKER = !!enabled
  if (worker) {
    try {
      ;(worker as any).postMessage({ type: 'init', debug: DEBUG_KATEX_WORKER })
    }
    catch {
      try {
        console.warn('[katexWorkerClient] failed to send debug init to worker')
      }
      catch {}
    }
  }
}

export function onKaTeXWorkerError(fn: (err: any) => void) {
  errorListeners.add(fn)
}

export function offKaTeXWorkerError(fn: (err: any) => void) {
  errorListeners.delete(fn)
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
      const err = new Error('Worker render timed out')
      ;(err as any).name = 'WorkerTimeout'
      ;(err as any).code = 'WORKER_TIMEOUT'
      try {
        for (const h of errorListeners) {
          try {
            h(err)
          }
          catch {}
        }
      }
      catch {}
      reject(err)
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

// Allow callers (e.g. main-thread fallback renderers) to populate the internal cache
// so that synchronous renders can benefit subsequent worker-based calls.
export function setKaTeXCache(content: string, displayMode = true, html: string) {
  try {
    const cacheKey = `${displayMode ? 'd' : 'i'}:${content}`
    cache.set(cacheKey, html)
    if (cache.size > CACHE_MAX) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }
  }
  catch {
    // ignore cache errors
  }
}

// When a worker response arrives we set the cache (handled in ensureWorker message handler),
// but the handler does not currently set cache; to keep cache coherent, also set here by
// wrapping the Promise resolution above would be ideal. However, pending resolution occurs
// in the worker message listener which has access to the HTML. To avoid restructuring, callers
// will still get the benefit of cache on subsequent calls once the first render completed.
