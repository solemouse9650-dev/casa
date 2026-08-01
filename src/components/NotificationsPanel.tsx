import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/stores/dataStore'
import { useI18n } from '@/hooks/useI18n'
import { markAllNotificationsRead, markNotificationRead } from '@/services/notifications'
import { formatRelative } from '@/utils/dates'
import { Button } from '@/components/ui/Button'

export function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t, locale } = useI18n()
  const { profile } = useAuth()
  const notifications = useDataStore((s) => s.notifications)

  if (!profile) return null

  return (
    <AnimatePresence>
      {open ? (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-12 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <p className="font-semibold">{t('notifications.title')}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllNotificationsRead(notifications, profile.uid)}
              >
                {t('notifications.markAll')}
              </Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
                  {t('notifications.empty')}
                </p>
              ) : (
                notifications.map((n) => {
                  const unread = !n.readBy.includes(profile.uid)
                  return (
                    <button
                      key={n.id}
                      className={`block w-full border-b border-[var(--color-border)] px-4 py-3 text-left hover:bg-[var(--color-surface)] ${
                        unread ? 'bg-[var(--color-accent-soft)]/40' : ''
                      }`}
                      onClick={() => markNotificationRead(n.id, profile.uid)}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{n.message}</p>
                      <p className="mt-1 text-[10px] text-[var(--color-ink-muted)]">
                        {formatRelative(n.createdAt, locale)}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
