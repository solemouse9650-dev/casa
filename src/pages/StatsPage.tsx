import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, startOfWeek, addDays } from 'date-fns'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, StatCard } from '@/components/ui/Card'
import { useI18n } from '@/hooks/useI18n'
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency } from '@/utils/currency'
import { isInCurrentMonth } from '@/utils/dates'

const COLORS = ['#1b7a6e', '#c96b3c', '#d4a017', '#5c6b66', '#3cb8a6', '#e08a5a']

export function StatsPage() {
  const { t } = useI18n()
  const tasks = useDataStore((s) => s.tasks)
  const shopping = useDataStore((s) => s.shopping)
  const expenses = useDataStore((s) => s.expenses)
  const activity = useDataStore((s) => s.activity)

  const doneTasks = tasks.filter((task) => task.status === 'done').length
  const purchased = shopping.filter((s) => s.status === 'purchased').length
  const monthExpenses = expenses
    .filter((e) => isInCurrentMonth(e.date))
    .reduce((sum, e) => sum + e.amount, 0)

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    ;[...tasks.map((t) => t.category), ...shopping.map((s) => s.category)].forEach((c) => {
      map.set(c, (map.get(c) || 0) + 1)
    })
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [tasks, shopping])

  const weekly = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i)
      const key = format(day, 'yyyy-MM-dd')
      const count = activity.filter((a) => a.createdAt.slice(0, 10) === key).length
      return { name: format(day, 'EEE'), count }
    })
  }, [activity])

  return (
    <div>
      <PageHeader title={t('stats.title')} subtitle="Panorama del hogar" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tareas realizadas" value={doneTasks} />
        <StatCard label="Compras realizadas" value={purchased} accent="var(--color-warm)" />
        <StatCard
          label="Gastos mensuales"
          value={formatCurrency(monthExpenses)}
          accent="var(--color-success)"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-80">
          <p className="mb-4 font-semibold">Categorías más usadas</p>
          {categories.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">{t('common.empty')}</p>
          ) : (
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" outerRadius={100} label>
                  {categories.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="h-80">
          <p className="mb-4 font-semibold">Actividad semanal</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
