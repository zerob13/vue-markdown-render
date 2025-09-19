let mermaid = null
export async function getMermaid() {
  if (mermaid)
    return mermaid
  try {
    mermaid = await import('mermaid')
  }
  catch {
    throw new Error('Optional dependency "mermaid" is not installed. Please install it to enable mermaid diagrams.')
  }
  return mermaid.default
}
