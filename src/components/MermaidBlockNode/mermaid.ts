let cachedMermaid: any = null
export async function getMermaid() {
  if (cachedMermaid)
    return cachedMermaid
  try {
    const mod = await import('mermaid')
    // prefer default export if present, otherwise use the module namespace
    let candidate = (mod && (mod as any).default) ? (mod as any).default : mod

    // Common shapes:
    // - `candidate.render/parse/initialize` exist -> use candidate
    // - `candidate.mermaidAPI` exists with render/parse -> bind those
    // - `mod.mermaid` or `mod.default.mermaid` may contain the API
    if (candidate && (typeof candidate.render === 'function' || typeof candidate.parse === 'function' || typeof candidate.initialize === 'function')) {
      cachedMermaid = candidate
    }
    else if (candidate && candidate.mermaidAPI && (typeof candidate.mermaidAPI.render === 'function' || typeof candidate.mermaidAPI.parse === 'function')) {
      // expose a normalized facade that provides render/parse/initialize
      const api = candidate.mermaidAPI
      cachedMermaid = {
        ...candidate,
        render: api.render.bind(api),
        parse: api.parse ? api.parse.bind(api) : undefined,
        initialize: (opts: any) => {
          // some builds expose initialize on root, prefer that
          if (typeof candidate.initialize === 'function')
            return candidate.initialize(opts)
          // otherwise try mermaidAPI.initialize
          return api.initialize ? api.initialize(opts) : undefined
        },
      }
    }
    else if ((mod as any).mermaid && typeof (mod as any).mermaid.render === 'function') {
      cachedMermaid = (mod as any).mermaid
    }
    else {
      // fallback: use candidate as-is; it may still work or we'll surface a runtime error later
      cachedMermaid = candidate
    }
  }
  catch {
    throw new Error('Optional dependency "mermaid" is not installed. Please install it to enable mermaid diagrams.')
  }
  return cachedMermaid
}
