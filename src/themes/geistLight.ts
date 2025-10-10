const THEME_CLASS = 'vmr-theme-geist-light' as const

export const geistLightThemeClass = THEME_CLASS

/** Registers the Geist light theme on the target element and returns a cleanup function. */
export function applyGeistLightTheme(target: HTMLElement | null | undefined) {
  if (!target)
    return () => {}

  target.classList.add(THEME_CLASS)
  return () => target.classList.remove(THEME_CLASS)
}

export type GeistLightThemeClass = typeof geistLightThemeClass
