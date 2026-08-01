import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { useDataStore } from '@/stores/dataStore'
import { StatCard, Card } from '@/components/ui/Card'
import { PriorityBadge } from '@/components/ui/Badge'
import { formatRelative } from '@/utils/dates'
import type { TranslationKey } from '@/i18n/translations'

export function DashboardPage() {
  const { profile } = useAuth()
  const { t, locale } = useI18n()
  const shopping = useDataStore((s) => s.shopping)
  const tasks = useDataStore((s) => s.tasks)
  const activity = useDataStore((s) => s.activity)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const stats = useMemo(() => {
    const pendingShopping = shopping.filter((s) => s.status === 'pending')
    const doneShopping = shopping.filter((s) => s.status === 'purchased')
    const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
    const doneTasks = tasks.filter((t) => t.status === 'done')
    const upcoming = [...tasks]
      .filter((t) => t.status !== 'done' && t.status !== 'cancelled' && t.dueDate)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
      .slice(0, 5)
    const latestShopping = shopping.slice(0, 5)
    return { pendingShopping, doneShopping, pendingTasks, doneTasks, upcoming, latestShopping }
  }, [shopping, tasks])

  const dateLocale = locale === 'es' ? es : enUS

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--color-accent)]/10 blur-2xl" />
        <p className="text-sm text-[var(--color-ink-muted)]">
          {format(now, "EEEE d 'de' MMMM", { locale: dateLocale })}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          {t('dashboard.hello', { name: profile?.displayName || 'familia' })}
        </h1>
        <p className="mt-3 font-mono text-3xl tabular-nums text-[var(--color-accent)]">
          {format(now, 'HH:mm:ss')}
        </p>
        <p className="mt-3 max-w-xl text-[var(--color-ink-muted)]">{t('dashboard.summary')}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.pendingShopping')}
          value={stats.pendingShopping.length}
          accent="var(--color-warm)"
        />
        <StatCard
          label={t('dashboard.doneShopping')}
          value={stats.doneShopping.length}
          accent="var(--color-success)"
        />
        <StatCard
          label={t('dashboard.pendingTasks')}
          value={stats.pendingTasks.length}
          accent="var(--color-accent)"
        />
        <StatCard
          label={t('dashboard.doneTasks')}
          value={stats.doneTasks.length}
          accent="var(--color-accent-strong)"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              {t('dashboard.upcoming')}
            </h2>
            <Link to="/tareas" className="text-sm text-[var(--color-accent)]">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="space-y-3">
            {stats.upcoming.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">{t('common.empty')}</p>
            ) : (
              stats.upcoming.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {task.dueDate}
                      {task.dueTime ? ` · ${task.dueTime}` : ''}
                    </p>
                  </div>
                  <PriorityBadge
                    priority={task.priority}
                    label={t(`priority.${task.priority}` as TranslationKey)}
                  />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
              {t('dashboard.latestShopping')}
            </h2>
            <Link to="/compras" className="text-sm text-[var(--color-accent)]">
              {t('common.viewAll')}
            </Link>
          </div>
          <div className="space-y-3">
            {stats.latestShopping.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">{t('common.empty')}</p>
            ) : (
              stats.latestShopping.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {item.category} · {item.createdByName}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-ink-muted)]">
                    {item.status === 'purchased' ? t('status.purchased') : t('status.pending')}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            {t('dashboard.recentActivity')}
          </h2>
          <Link to="/actividad" className="text-sm text-[var(--color-accent)]">
            {t('common.viewAll')}
          </Link>
        </div>
        <div className="space-y-3">
          {activity.slice(0, 8).map((a) => (
            <div key={a.id} className="flex gap-3 border-b border-[var(--color-border)] pb-3 last:border-0">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-accent)]" />
              <div>
                <p className="text-sm">{a.message}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {formatRelative(a.createdAt, locale)}
                </p>
              </div>
            </div>
          ))}
          {activity.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">{t('common.empty')}</p>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
