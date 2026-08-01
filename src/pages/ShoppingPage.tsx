import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Check,
  Copy,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { PriorityBadge } from '@/components/ui/Badge'
import { useI18n } from '@/hooks/useI18n'
import { useActor } from '@/hooks/useAuth'
import { useVisibleData } from '@/hooks/useVisibleData'
import { PRIORITIES, SHOPPING_CATEGORIES, UNITS } from '@/constants'
import { VisibilityBadge, VisibilityField } from '@/components/ui/VisibilityField'
import { getFirestoreErrorMessage } from '@/utils/firestore'
import {
  createShopping,
  deleteShopping,
  duplicateShopping,
  markPurchased,
  unmarkPurchased,
  updateShopping,
} from '@/services/shopping'
import { uploadHomeFile } from '@/services/storage'
import { matchesQuery } from '@/utils/search'
import { formatCurrency } from '@/utils/currency'
import { formatRelative } from '@/utils/dates'
import type { Priority, ShoppingItem } from '@/types'
import type { TranslationKey } from '@/i18n/translations'

const schema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  notes: z.string().optional(),
  estimatedPrice: z.coerce.number().optional(),
  finalPrice: z.coerce.number().optional(),
  scheduledFor: z.string().optional(),
  visibility: z.enum(['family', 'private']),
})

type FormData = z.infer<typeof schema>

export function ShoppingPage() {
  const { t, locale } = useI18n()
  const actor = useActor()
  const { shopping } = useVisibleData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<'all' | 'pending' | 'purchased'>('pending')
  const [sort, setSort] = useState<'newest' | 'priority' | 'name'>('newest')
  const [showHistory, setShowHistory] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ShoppingItem | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      category: 'Supermercado',
      quantity: 1,
      unit: 'u',
      priority: 'medium',
      notes: '',
      visibility: 'family',
    },
  })

  const filtered = useMemo(() => {
    let items = shopping.filter((s) => {
      if (status !== 'all' && s.status !== status) return false
      if (category !== 'all' && s.category !== category) return false
      return matchesQuery(`${s.name} ${s.category} ${s.notes ?? ''}`, query)
    })
    const priorityRank: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'priority')
      items = [...items].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    if (sort === 'newest')
      items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return items
  }, [shopping, status, category, query, sort])

  const history = useMemo(
    () => shopping.filter((s) => s.status === 'purchased').slice(0, 30),
    [shopping],
  )

  const openCreate = () => {
    setEditing(null)
    setImageFile(null)
    form.reset({
      name: '',
      category: 'Supermercado',
      quantity: 1,
      unit: 'u',
      priority: 'medium',
      notes: '',
      estimatedPrice: undefined,
      finalPrice: undefined,
      scheduledFor: '',
      visibility: 'family',
    })
    setOpen(true)
  }

  const openEdit = (item: ShoppingItem) => {
    setEditing(item)
    setImageFile(null)
    form.reset({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      priority: item.priority,
      notes: item.notes ?? '',
      estimatedPrice: item.estimatedPrice,
      finalPrice: item.finalPrice,
      scheduledFor: item.scheduledFor ?? '',
      visibility: item.visibility ?? 'family',
    })
    setOpen(true)
    setMenuId(null)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      let imageUrl = editing?.imageUrl
      if (imageFile) {
        imageUrl = await uploadHomeFile(`shopping/${Date.now()}-${imageFile.name}`, imageFile)
      }
      const payload = {
        ...data,
        visibility: data.visibility,
        notes: data.notes || undefined,
        estimatedPrice: data.estimatedPrice || undefined,
        finalPrice: data.finalPrice || undefined,
        scheduledFor: data.scheduledFor || undefined,
        imageUrl,
      }
      if (editing) await updateShopping(editing.id, payload)
      else await createShopping(payload, actor)
      setOpen(false)
    } catch (error) {
      console.error(error)
      window.alert(getFirestoreErrorMessage(error))
    }
  })

  return (
    <div>
      <PageHeader
        title={t('shopping.title')}
        subtitle={`${filtered.length} ítems`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowHistory(true)}>
              <History className="h-4 w-4" />
              {t('common.history')}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('shopping.add')}
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder={t('common.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">{t('common.all')}</option>
          {SHOPPING_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">{t('common.all')}</option>
          <option value="pending">{t('common.pending')}</option>
          <option value="purchased">{t('common.completed')}</option>
        </Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="newest">Más recientes</option>
          <option value="priority">Prioridad</option>
          <option value="name">Nombre</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={t('common.empty')}
          description="Agregá lo que falta en casa y la familia lo ve al instante."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t('shopping.add')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <button
                  onClick={() =>
                    item.status === 'purchased'
                      ? unmarkPurchased(item.id)
                      : markPurchased(item, actor)
                  }
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                    item.status === 'purchased'
                      ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {item.status === 'purchased' ? <Check className="h-4 w-4" /> : null}
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-medium ${
                        item.status === 'purchased' ? 'line-through text-[var(--color-ink-muted)]' : ''
                      }`}
                    >
                      {item.name}
                    </p>
                    <PriorityBadge
                      priority={item.priority}
                      label={t(`priority.${item.priority}` as TranslationKey)}
                    />
                    <VisibilityBadge visibility={item.visibility} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                    {item.quantity} {item.unit} · {item.category}
                    {item.estimatedPrice ? ` · est. ${formatCurrency(item.estimatedPrice)}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {item.createdByName} · {formatRelative(item.createdAt, locale)}
                    {item.purchasedByName
                      ? ` · comprado por ${item.purchasedByName}`
                      : ''}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">{item.notes}</p>
                  ) : null}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="mt-2 h-16 w-16 rounded-lg object-cover"
                    />
                  ) : null}
                </div>
              </div>
              <div className="relative flex items-center gap-2 self-end sm:self-center">
                {item.status === 'pending' ? (
                  <Button size="sm" variant="soft" onClick={() => markPurchased(item, actor)}>
                    {t('shopping.markPurchased')}
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => unmarkPurchased(item.id)}>
                    <RotateCcw className="h-4 w-4" />
                    {t('shopping.unmark')}
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setMenuId(menuId === item.id ? null : item.id)}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                {menuId === item.id ? (
                  <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-1 shadow-[var(--shadow-lift)]">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> {t('common.edit')}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-surface)]"
                      onClick={() => {
                        duplicateShopping(item, actor)
                        setMenuId(null)
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> {t('common.duplicate')}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface)]"
                      onClick={() => {
                        deleteShopping(item.id, actor, item.name)
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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t('common.edit') : t('shopping.add')}
        wide
      >
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <Field label={t('shopping.name')} error={form.formState.errors.name?.message}>
            <Input {...form.register('name')} />
          </Field>
          <Field label={t('shopping.category')}>
            <Select {...form.register('category')}>
              {SHOPPING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('shopping.quantity')}>
            <Input type="number" step="any" {...form.register('quantity')} />
          </Field>
          <Field label={t('shopping.unit')}>
            <Select {...form.register('unit')}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
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
          <Field label={t('shopping.scheduled')}>
            <Input type="date" {...form.register('scheduledFor')} />
          </Field>
          <VisibilityField register={form.register} />
          <Field label={t('shopping.estimated')}>
            <Input type="number" step="any" {...form.register('estimatedPrice')} />
          </Field>
          <Field label={t('shopping.final')}>
            <Input type="number" step="any" {...form.register('finalPrice')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label={t('shopping.notes')}>
              <Textarea {...form.register('notes')} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Imagen (opcional)">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
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

      <Modal open={showHistory} onClose={() => setShowHistory(false)} title={t('common.history')}>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">{t('common.empty')}</p>
          ) : (
            history.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--color-border)] px-3 py-2">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {item.purchasedByName || '—'} ·{' '}
                  {item.purchasedAt ? formatRelative(item.purchasedAt, locale) : ''}
                  {item.finalPrice ? ` · ${formatCurrency(item.finalPrice)}` : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
