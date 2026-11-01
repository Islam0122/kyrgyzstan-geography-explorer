import { useCallback } from 'react'
import { ky } from '../data/translations/ky'
import { ru, type UIKey } from '../data/translations/ru'
import { useAppStore } from '../store/useAppStore'
import type { L, Lang } from '../types'

const dicts: Record<Lang, Record<UIKey, string>> = { ru, ky }

/** Central i18n hook: `t` for interface keys, `tr` for bilingual content objects. */
export function useI18n() {
  const lang = useAppStore((s) => s.lang)
  const t = useCallback(
    (key: UIKey, vars?: Record<string, string | number>) => {
      let s = dicts[lang][key] ?? ru[key] ?? key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    },
    [lang],
  )
  const tr = useCallback((v: L | undefined) => (v ? v[lang] || v.ru : ''), [lang])
  return { lang, t, tr }
}

export function trStatic(v: L, lang: Lang) {
  return v[lang] || v.ru
}
