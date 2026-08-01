import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Copy, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { PriorityBadge, Badge } from '@/components/ui/Badge'
import { useI18n } from '@/hooks/useI18n'
import { useActor } from '@/hooks/useAuth'
import { useVisibleData } from '@/hooks/useVisibleData'
import { PRIORITIES, TASK_CATEGORIES, TASK_STATUSES } from '@/constants'
import { VisibilityBadge, VisibilityField } from '@/components/ui/VisibilityField'
import { getFirestoreErrorMessage } from '@/utils/firestore'
import {
  completeTask,
  createTask,
  deleteTask,
  duplicateTask,
  reopenTask,
  updateTask,
} from '@/services/tasks'
import { matchesQuery } from '@/utils/search'
import { formatRelative } from '@/utils/dates'
import type { TaskItem, TaskStatus } from '@/types'
import type { TranslationKey } from '@/i18n/translations'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'done', 'cancelled']),
  notes: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
  visibility: z.enum(['family', 'private']),
})

type FormData = z.infer<typeof schema>

export function TasksPage() {
  const { t, locale } = useI18n()
  const actor = useActor()
  const { tasks, users } = useVisibleData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<'all' | TaskStatus>('all')
  const [sort, setSort] = useState<'newest' | 'due' | 'priority'>('newest')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TaskItem | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: 'Limpieza',
      priority: 'medium',
      status: 'pending',
      recurrence: 'none',
      visibility: 'family',
      assigneeId: '',
    },
  })

  const filtered = useMemo(() => {
    let items = tasks.filter((task) => {
      if (status !== 'all' && task.status !== status) return false
      if (category !== 'all' && task.category !== category) return false
      return matchesQuery(`${task.title} ${task.description ?? ''} ${task.category}`, query)
    })
    if (sort === 'due')
      items = [...items].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    if (sort === 'priority') {
      const rank = { urgent: 0, high: 1, medium: 2, low: 3 }
      items = [...items].sort((a, b) => rank[a.priority] - rank[b.priority])
    }
    if (sort === 'newest')
      items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return items
  }, [tasks, status, category, query, sort])

  const openCreate = () => {
    setEditing(null)
    form.reset({
      title: '',
      description: '',
      category: 'Limpieza',
      priority: 'medium',
      assigneeId: actor.id,
      dueDate: '',
      dueTime: '',
      status: 'pending',
      notes: '',
      recurrence: 'none',
      visibility: 'family',
    })
    setOpen(true)
  }

  const openEdit = (item: TaskItem) => {
    setEditing(item)
    form.reset({
      title: item.title,
      description: item.description ?? '',
      category: item.category,
      priority: item.priority,
      assigneeId: item.assigneeId ?? '',
      dueDate: item.dueDate ?? '',
      dueTime: item.dueTime ?? '',
      status: item.status,
      notes: item.notes ?? '',
      recurrence: item.recurrence ?? 'none',
      visibility: item.visibility ?? 'family',
    })
    setOpen(true)
    setMenuId(null)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const assignee = users.find((u) => u.uid === data.assigneeId)
      const payload = {
        title: data.title,
        description: data.description || undefined,
        category: data.category,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
        assigneeName: assignee?.displayName,
        dueDate: data.dueDate || undefined,
        dueTime: data.dueTime || undefined,
        status: data.status,
        notes: data.notes || undefined,
        recurrence: data.recurrence,
        visibility: data.visibility,
      }
      if (editing) await updateTask(editing.id, payload)
      else await createTask(payload, actor)
      setOpen(false)
    } catch (error) {
      console.error(error)
      window.alert(getFirestoreErrorMessage(error))
    }
  })

  return (
    <div>
      <PageHeader
        title={t('tasks.title')}
        subtitle={`${filtered.length} tareas`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('tasks.add')}
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder={t('common.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">{t('common.all')}</option>
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">{t('common.all')}</option>
          {TASK_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {t(s.labelKey as TranslationKey)}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="newest">Más recientes</option>
          <option value="due">Fecha límite</option>
          <option value="priority">Prioridad</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t('common.empty')}
          description="Organizá las tareas del hogar y asigná responsables."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('tasks.add')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <Card key={task.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  onClick={() =>
                    task.status === 'done' ? reopenTask(task.id) : completeTask(task, actor)
                  }
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                    task.status === 'done'
                      ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {task.status === 'done' ? <Check className="h-4 w-4" /> : null}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-medium ${
                        task.status === 'done' ? 'line-through text-[var(--color-ink-muted)]' : ''
                      }`}
                    >
                      {task.title}
                    </p>
                    <PriorityBadge
                      priority={task.priority}
                      label={t(`priority.${task.priority}` as TranslationKey)}
                    />
                    <Badge className="bg-[var(--color-border)] text-[var(--color-ink-muted)]">
                      {t(`status.${task.status}` as TranslationKey)}
                    </Badge>
                    <VisibilityBadge visibility={task.visibility} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    {task.category}
                    {task.assigneeName ? ` · ${task.assigneeName}` : ''}
                    {task.dueDate ? ` · ${task.dueDate}${task.dueTime ? ` ${task.dueTime}` : ''}` : ''}
                  </p>
                  {task.description ? (
                    <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{task.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {task.createdByName} · {formatRelative(task.createdAt, locale)}
                    {task.completedByName ? ` · terminó ${task.completedByName}` : ''}
                  </p>
                </div>
              </div>
              <div className="relative flex items-center gap-2 self-end sm:self-center">
                {task.status !== 'done' ? (
                  <Button size="sm" variant="soft" onClick={() => completeTask(task, actor)}>
                    {t('tasks.complete')}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => reopenTask(task.id)}>
                    <RotateCcw className="h-4 w-4" />
                    {t('tasks.reopen')}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMenuId(menuId === task.id ? null : task.id)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                {menuId === task.id ? (
                  <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-lift)]">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
                      onClick={() => openEdit(task)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
                      onClick={() => {
                        duplicateTask(task, actor)
                        setMenuId(null)
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> {t('common.duplicate')}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface)]"
                      onClick={() => {
                        deleteTask(task.id, actor, task.title)
                        setMenuId(null)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> {t('common.delete')}
                    </button>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('common.edit') : t('tasks.add')} wide>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <div className="sm:col-span-2">
            <Field label={t('tasks.titleField')} error={form.formState.errors.title?.message}>
              <Input {...form.register('title')} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label={t('tasks.description')}>
              <Textarea {...form.register('description')} />
            </Field>
          </div>
          <Field label="Categoría">
            <Select {...form.register('category')}>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('shopping.priority')}>
            <Select {...form.register('priority')}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(p.labelKey as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('tasks.assignee')}>
            <Select {...form.register('assigneeId')}>
              <option value="">Sin asignar</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName}
                  {u.uid === actor.id ? ' (yo)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <VisibilityField register={form.register} />
          <Field label="Estado">
            <Select {...form.register('status')}>
              {TASK_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.labelKey as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('tasks.dueDate')}>
            <Input type="date" {...form.register('dueDate')} />
          </Field>
          <Field label={t('tasks.dueTime')}>
            <Input type="time" {...form.register('dueTime')} />
          </Field>
          <Field label={t('tasks.recurrence')}>
            <Select {...form.register('recurrence')}>
              <option value="none">Ninguna</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('tasks.notes')}>
              <Textarea {...form.register('notes')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
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
