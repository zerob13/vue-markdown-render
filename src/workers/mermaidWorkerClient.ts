type Theme = 'light' | 'dark'

let worker: Worker | null = null
let workerInitError: any = null

/**
 * Allow user to inject a Worker instance, e.g. from Vite ?worker import.
 */
export function setMermaidWorker(w: Worker) {
  worker = w
  workerInitError = null
}

/**
 * Remove the current worker instance (for cleanup or SSR).
 */
export function clearMermaidWorker() {
  if (worker) {
    worker.terminate?.()
  }
  worker = null
  workerInitError = null
}
const rpcMap = new Map<string, { resolve: (v: any) => void, reject: (e: any) => void }>()

function ensureWorker() {
  if (!worker) {
    workerInitError = new Error('[mermaidWorkerClient] No worker instance set. Please inject a Worker via setMermaidWorker().')
    return null
  }
  return worker
}

function callWorker<T>(action: 'canParse' | 'findPrefix', payload: any, timeout = 1400): Promise<T> {
  if (workerInitError)
    return Promise.reject(workerInitError)

  const wk = ensureWorker()
  if (!wk) {
    return Promise.reject(workerInitError)
  }

  return new Promise<T>((resolve, reject) => {
    const id = Math.random().toString(36).slice(2)
    rpcMap.set(id, { resolve, reject })
    wk.postMessage({ id, action, payload })

    const timeoutId = (globalThis as any).setTimeout(() => {
      if (rpcMap.has(id))
        rpcMap.delete(id)
      reject(new Error('Worker call timed out'))
    }, timeout)

    // clear timeout on resolution
    const wrapResolve = (v: any) => {
      (globalThis as any).clearTimeout(timeoutId)
      resolve(v)
    }
    const wrapReject = (e: any) => {
      (globalThis as any).clearTimeout(timeoutId)
      reject(e)
    }
    rpcMap.set(id, { resolve: wrapResolve, reject: wrapReject })
  })
}

export async function canParseOffthread(code: string, theme: Theme, timeout = 1400) {
  try {
    return await callWorker<boolean>('canParse', { code, theme }, timeout)
  }
  catch (e) {
    return Promise.reject(e)
  }
}

export async function findPrefixOffthread(code: string, theme: Theme, timeout = 1400) {
  try {
    return await callWorker<string | null>('findPrefix', { code, theme }, timeout)
  }
  catch (e) {
    return Promise.reject(e)
  }
}

export function terminateWorker() {
  if (worker) {
    worker.terminate()
    worker = null
  }
}
