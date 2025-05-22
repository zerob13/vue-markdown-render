import { useDark, useToggle } from '@vueuse/core'

export function useThemeStore() {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)
  return {
    isDark,
    toggleDark,
  }
}
