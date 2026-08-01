import { motion } from 'framer-motion'
import { useI18n } from '@/hooks/useI18n'

export function LoadingScreen() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--color-surface)]">
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent)] text-white shadow-[var(--shadow-soft)]"
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <span className="font-[family-name:var(--font-display)] text-xl font-bold">C</span>
        </motion.div>
        <p className="text-sm text-[var(--color-ink-muted)]">{t('auth.loading')}</p>
      </div>
    </div>
  )
}
