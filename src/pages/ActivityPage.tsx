import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/hooks/useI18n'
import { useDataStore } from '@/stores/dataStore'
import { formatRelative } from '@/utils/dates'

export function ActivityPage() {
  const { t, locale } = useI18n()
  const activity = useDataStore((s) => s.activity)

  return (
    <div>
      <PageHeader title={t('activity.title')} subtitle="Línea de tiempo del hogar" />
      {activity.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <Card>
          <div className="relative space-y-0">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[var(--color-border)]" />
            {activity.map((a) => (
              <div key={a.id} className="relative flex gap-4 py-3 pl-1">
                <div className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-surface-elevated)]" />
                <div>
                  <p className="text-sm font-medium">{a.message}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {formatRelative(a.createdAt, locale)} · {a.entityType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
