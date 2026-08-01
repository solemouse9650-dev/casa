import { useCallback } from 'react'
import { useUiStore } from '@/stores/uiStore'
import { translations, type TranslationKey } from '@/i18n/translations'

export function useI18n() {
  const locale = useUiStore((s) => s.locale)

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let value: string = translations[locale][key] ?? translations.es[key] ?? key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v))
        })
      }
      return value
    },
    [locale],
  )

  return { t, locale }
}
