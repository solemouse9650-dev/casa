import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { useI18n } from '@/hooks/useI18n'
import { useActor } from '@/hooks/useAuth'
import { useDataStore } from '@/stores/dataStore'
import { createEvent } from '@/services/events'
import { cn } from '@/utils/cn'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
  time: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type DayItem = {
  id: string
  title: string
  type: 'task' | 'shopping' | 'event' | 'reminder'
  color: string
  time?: string
}

export function CalendarPage() {
  const { t, locale } = useI18n()
  const actor = useActor()
  const tasks = useDataStore((s) => s.tasks)
  const shopping = useDataStore((s) => s.shopping)
  const events = useDataStore((s) => s.events)
  const reminders = useDataStore((s) => s.reminders)
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date>(new Date())
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const dateLocale = locale === 'es' ? es : enUS

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', date: format(new Date(), 'yyyy-MM-dd') },
  })

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, DayItem[]>()
    const push = (date: string, item: DayItem) => {
      const list = map.get(date) ?? []
      list.push(item)
      map.set(date, list)
    }
    tasks.forEach((task) => {
      if (!task.dueDate) return
      push(task.dueDate, {
        id: task.id,
        title: task.title,
        type: 'task',
        color: '#1b7a6e',
        time: task.dueTime,
      })
    })
    shopping.forEach((s) => {
      if (!s.scheduledFor) return
      push(s.scheduledFor, {
        id: s.id,
        title: s.name,
        type: 'shopping',
        color: '#c96b3c',
      })
    })
    events.forEach((e) => {
      push(e.date, {
        id: e.id,
        title: e.title,
        type: 'event',
        color: e.color || '#1b7a6e',
        time: e.time,
      })
    })
    reminders.forEach((r) => {
      push(r.date, {
        id: r.id,
        title: r.message,
        type: 'reminder',
        color: '#d4a017',
        time: r.time,
      })
    })
    return map
  }, [tasks, shopping, events, reminders])

  const selectedKey = format(selected, 'yyyy-MM-dd')
  const selectedItems = itemsByDay.get(selectedKey) ?? []

  const onCreate = form.handleSubmit(async (data) => {
    await createEvent(
      {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time || undefined,
      },
      actor,
    )
    setCreateOpen(false)
  })

  return (
    <div>
      <PageHeader
        title={t('calendar.title')}
        actions={
          <Button
            onClick={() => {
              form.reset({
                title: '',
                description: '',
                date: format(selected, 'yyyy-MM-dd'),
                time: '',
              })
              setCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Evento
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold capitalize">
            {format(month, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-ink-muted)]">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayItems = itemsByDay.get(key) ?? []
            const inMonth = isSameMonth(day, month)
            return (
              <button
                key={key}
                onClick={() => {
                  setSelected(day)
                  setDetailOpen(true)
                }}
                className={cn(
                  'min-h-20 rounded-xl border p-1.5 text-left transition hover:border-[var(--color-accent)]',
                  isSameDay(day, selected)
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                    : 'border-transparent bg-[var(--color-surface)]',
                  !inMonth && 'opacity-40',
                )}
              >
                <span className="text-xs font-medium">{format(day, 'd')}</span>
                <div className="mt-1 space-y-0.5">
                  {dayItems.slice(0, 3).map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="truncate rounded px-1 text-[10px] text-white"
                      style={{ background: item.color }}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 3 ? (
                    <p className="text-[10px] text-[var(--color-ink-muted)]">+{dayItems.length - 3}</p>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={format(selected, "EEEE d MMMM", { locale: dateLocale })}
      >
        <div className="space-y-3">
          {selectedItems.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">{t('common.empty')}</p>
          ) : (
            selectedItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                  <p className="font-medium">{item.title}</p>
                </div>
                <p className="mt-1 text-xs capitalize text-[var(--color-ink-muted)]">
                  {item.type}
                  {item.time ? ` · ${item.time}` : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo evento">
        <form className="space-y-4" onSubmit={onCreate}>
          <Field label="Título">
            <Input {...form.register('title')} />
          </Field>
          <Field label="Fecha">
            <Input type="date" {...form.register('date')} />
          </Field>
          <Field label="Hora">
            <Input type="time" {...form.register('time')} />
          </Field>
          <Field label="Descripción">
            <Textarea {...form.register('description')} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
