import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, StatCard } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { useI18n } from '@/hooks/useI18n'
import { useActor } from '@/hooks/useAuth'
import { useDataStore } from '@/stores/dataStore'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/constants'
import { createExpense, deleteExpense } from '@/services/expenses'
import { formatCurrency } from '@/utils/currency'
import { isInCurrentMonth, isInCurrentWeek, todayKey } from '@/utils/dates'
import type { TranslationKey } from '@/i18n/translations'

const schema = z.object({
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  paidBy: z.string().min(1),
  paymentMethod: z.enum(['cash', 'debit', 'credit', 'transfer', 'other']),
})

type FormData = z.infer<typeof schema>

export function ExpensesPage() {
  const { t } = useI18n()
  const actor = useActor()
  const expenses = useDataStore((s) => s.expenses)
  const users = useDataStore((s) => s.users)
  const [open, setOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      category: 'Supermercado',
      description: '',
      date: todayKey(),
      paidBy: actor.id,
      paymentMethod: 'cash',
    },
  })

  const weekTotal = useMemo(
    () => expenses.filter((e) => isInCurrentWeek(e.date)).reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )
  const monthTotal = useMemo(
    () => expenses.filter((e) => isInCurrentMonth(e.date)).reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  )

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    expenses
      .filter((e) => isInCurrentMonth(e.date))
      .forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount))
    return [...map.entries()].map(([name, total]) => ({ name, total }))
  }, [expenses])

  const onSubmit = form.handleSubmit(async (data) => {
    const payer = users.find((u) => u.uid === data.paidBy)
    await createExpense(
      {
        ...data,
        paidByName: payer?.displayName || actor.name,
      },
      actor,
    )
    setOpen(false)
  })

  return (
    <div>
      <PageHeader
        title={t('expenses.title')}
        actions={
          <Button
            onClick={() => {
              form.reset({
                amount: 0,
                category: 'Supermercado',
                description: '',
                date: todayKey(),
                paidBy: actor.id,
                paymentMethod: 'cash',
              })
              setOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            {t('expenses.add')}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={t('expenses.week')} value={formatCurrency(weekTotal)} accent="var(--color-accent)" />
        <StatCard label={t('expenses.month')} value={formatCurrency(monthTotal)} accent="var(--color-warm)" />
      </div>

      {chartData.length > 0 ? (
        <Card className="mb-6 h-72">
          <p className="mb-4 font-semibold">Gastos del mes por categoría</p>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="total" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ) : null}

      {expenses.length === 0 ? (
        <EmptyState title={t('common.empty')} />
      ) : (
        <div className="space-y-3">
          {expenses.map((e) => (
            <Card key={e.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{e.description}</p>
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  {e.category} · {e.date} · {e.paidByName} ·{' '}
                  {t(`payment.${e.paymentMethod}` as TranslationKey)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">{formatCurrency(e.amount)}</p>
                <Button size="sm" variant="ghost" onClick={() => deleteExpense(e.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('expenses.add')}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Monto">
            <Input type="number" step="any" {...form.register('amount')} />
          </Field>
          <Field label="Descripción">
            <Textarea {...form.register('description')} />
          </Field>
          <Field label="Categoría">
            <Select {...form.register('category')}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha">
            <Input type="date" {...form.register('date')} />
          </Field>
          <Field label="Quién pagó">
            <Select {...form.register('paidBy')}>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Método de pago">
            <Select {...form.register('paymentMethod')}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {t(m.labelKey as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
