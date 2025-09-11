import { useI18n } from 'vue-i18n'

function humanizeKey(key: string) {
  const s = key.split('.').pop() || key
  return s
    .replace(/[_-]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

const defaultMap: Record<string, string> = {
  'common.copy': 'Copy',
  'common.copySuccess': 'Copied',
}

export function useSafeI18n() {
  try {
    // try to use real vue-i18n when available
    const i18n = useI18n && (useI18n as any)()
    if (i18n && typeof i18n.t === 'function') {
      return { t: (i18n.t as any).bind(i18n) }
    }
  }
  catch {
    // ignore and fall back
  }

  const fallbackT = (key: string) => defaultMap[key] ?? humanizeKey(key)
  return { t: fallbackT }
}
