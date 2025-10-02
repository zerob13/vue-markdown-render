let mod = null
export async function getUseMonaco() {
  if (mod)
    return mod
  try {
    mod = await import('vue-use-monaco')
  }
  catch {
    throw new Error('Optional dependency "vue-use-monaco" is not installed. Please install it to enable code editor features.')
  }
  return mod
}
