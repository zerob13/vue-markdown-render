import type { Highlighter, SpecialTheme, ThemeInput } from 'shiki'

const langsArray = [
  'jsx',
  'tsx',
  'vue',
  'csharp',
  'python',
  'java',
  'c',
  'cpp',
  'rust',
  'go',
  'powershell',
  'sql',
  'json',
  'html',
  'javascript',
  'typescript',
  'css',
  'markdown',
  'xml',
  'yaml',
  'toml',
  'dockerfile',
  'kotlin',
  'objective-c',
  'objective-cpp',
  'php',
  'ruby',
  'scala',
  'svelte',
  'swift',
  'erlang',
  'angular-html',
  'angular-ts',
  'dart',
  'lua',
  'mermaid',
  'cmake',
  'nginx',
]
const themesArray = [
  'andromeeda',
  'aurora-x',
  'ayu-dark',
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
  'dark-plus',
  'dracula',
  'dracula-soft',
  'everforest-dark',
  'everforest-light',
  'github-dark',
  'github-dark-default',
  'github-dark-dimmed',
  'github-dark-high-contrast',
  'github-light',
  'github-light-default',
  'github-light-high-contrast',
  'gruvbox-dark-hard',
  'gruvbox-dark-medium',
  'gruvbox-dark-soft',
  'gruvbox-light-hard',
  'gruvbox-light-medium',
  'gruvbox-light-soft',
  'houston',
  'kanagawa-dragon',
  'kanagawa-lotus',
  'kanagawa-wave',
  'laserwave',
  'light-plus',
  'material-theme',
  'material-theme-darker',
  'material-theme-lighter',
  'material-theme-ocean',
  'material-theme-palenight',
  'min-dark',
  'min-light',
  'monokai',
  'night-owl',
  'nord',
  'one-dark-pro',
  'one-light',
  'plastic',
  'poimandres',
  'red',
  'rose-pine',
  'rose-pine-dawn',
  'rose-pine-moon',
  'slack-dark',
  'slack-ochin',
  'snazzy-light',
  'solarized-dark',
  'solarized-light',
  'synthwave-84',
  'tokyo-night',
  'vesper',
  'vitesse-black',
  'vitesse-dark',
  'vitesse-light',
]
let highlighter: Highlighter | null = null
// Guard against concurrent initializations so multiple code blocks don't spawn
// multiple highlighters at once. We keep a single promise while creating.
let highlighterPromise: Promise<Highlighter> | null = null
/**
 * Register shiki highlighter with specified themes and languages.
 * If no languages are specified, all supported languages will be registered.
 * If any unsupported languages are specified, they will be ignored with a warning.
 * @param options.themes Array of theme names or theme objects to register
 * @param options.langs Array of language IDs to register (optional)
 * @returns Promise resolving to the created Highlighter instance
 */
export async function registerHighlight(options: {
  themes?: ThemeInput[] | SpecialTheme[]
  langs?: string[]
} = {}) {
  // If already initialized, optionally try to load any missing themes/langs
  if (highlighter) {
    // Best-effort dynamic loading for additional themes/langs when requested after init
    // Use duck-typing to avoid tight coupling with Shiki API variations.
    try {
      if (options.themes && options.themes.length) {
        for (const t of options.themes) {
          if (typeof t === 'string' && (highlighter as any)?.getLoadedThemes && !(highlighter as any).getLoadedThemes().includes(t))
            await (highlighter as any)?.loadTheme?.(t)
        }
      }
      if (options.langs && options.langs.length) {
        const want = options.langs
        const loaded: string[] | undefined = (highlighter as any)?.getLoadedLanguages?.()
        for (const l of want) {
          if (!loaded || !loaded.includes(l))
            await (highlighter as any)?.loadLanguage?.(l)
        }
      }
    }
    catch {
      // Non-fatal: if dynamic loading API isn't available, ignore.
      // The initial highlighter was created with a comprehensive default set.
    }
    return highlighter
  }

  // If an init is in-flight, await it
  if (highlighterPromise)
    return highlighterPromise

  // Start creating a singleton highlighter
  const { createHighlighter } = await import('shiki')
  if (!options.langs || options.langs.length === 0) {
    options.langs = langsArray
  }
  else if (options.langs?.some(l => !langsArray.includes(l))) {
    options.langs = options.langs.filter((l) => {
      if (langsArray.includes(l))
        return true
      console.warn(`[shiki] Language "${l}" is not in the supported list and will be ignored.`)
      return false
    })
  }

  if (!options.themes || options.themes.length === 0) {
    options.themes = themesArray as any
  }
  else if (options.themes?.some((t) => {
    if (typeof t === 'string' && !themesArray.includes(t))
      return true
    return false
  })) {
    options.themes = options.themes.filter((t) => {
      if (typeof t === 'string' && !themesArray.includes(t)) {
        console.warn(`[shiki] Theme "${t}" is not in the supported list and will be ignored.`)
        return false
      }
      return true
    }) as any
  }

  highlighterPromise = createHighlighter({ themes: options.themes, langs: options.langs })
    .then((h) => {
      highlighter = h
      return h
    })
    .finally(() => {
      // Clear the promise guard once settled
      highlighterPromise = null
    })

  return highlighterPromise
}
export function disposeHighlighter() {
  highlighter = null
}
