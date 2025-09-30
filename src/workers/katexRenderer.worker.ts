import katex from 'katex'

interface MessageIn {
  id: string
  content: string
  displayMode?: boolean
}

interface MessageOut {
  id: string
  html?: string
  error?: string
}

// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (ev: MessageEvent<MessageIn>) => {
  const { id, content, displayMode = true } = ev.data

  try {
    // renderToString is CPU-bound but doesn't touch the DOM, so it's safe in a worker
    const html = katex.renderToString(content, {
      throwOnError: true,
      displayMode,
      output: 'html',
      strict: 'ignore',
    })

    const out: MessageOut & { content: string, displayMode: boolean } = { id, html, content, displayMode }
    // send back the generated HTML and original input for caching
    // eslint-disable-next-line no-restricted-globals
    ;(self as any).postMessage(out)
  }
  catch (err: any) {
    const out: MessageOut & { content: string, displayMode: boolean } = { id, error: String(err?.message ?? err), content, displayMode }
    // eslint-disable-next-line no-restricted-globals
    ;(self as any).postMessage(out)
  }
})
