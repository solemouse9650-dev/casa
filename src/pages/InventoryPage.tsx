import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { useI18n } from '@/hooks/useI18n'
import { useActor } from '@/hooks/useAuth'
import { useDataStore } from '@/stores/dataStore'
import { INVENTORY_CATEGORIES, UNITS } from '@/constants'
import {
  addInventoryToShopping,
  createInventory,
  deleteInventory,
  isLowStock,
  updateInventory,
} from '@/services/inventory'
import type { InventoryItem } from '@/types'

const schema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().min(0),
  minQuantity: z.coerce.number().min(0),
  unit: z.string().min(1),
  category: z.string().min(1),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function InventoryPage() {
  const { t } = useI18n()
  const actor = useActor()
  const inventory = useDataStore((s) => s.inventory)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      quantity: 0,
      minQuantity: 1,
      unit: 'u',
      category: 'Alimentos',
    },
  })

  const lowStock = useMemo(() => inventory.filter(isLowStock), [inventory])

  const openCreate = () => {
    setEditing(null)
    form.reset({
      name: '',
      quantity: 0,
      minQuantity: 1,
      unit: 'u',
      category: 'Alimentos',
      notes: '',
    })
    setOpen(true)
  }

  const openEdit = (item: InventoryItem) => {
    setEditing(item)
    form.reset({
      name: item.name,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      unit: item.unit,
      category: item.category,
      notes: item.notes ?? '',
    })
    setOpen(true)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    const payload = { ...data, notes: data.notes || undefined }
    if (editing) await updateInventory(editing.id, payload)
    else await createInventory(payload, actor)
    setOpen(false)
  })

  return (
    <div>
      <PageHeader
        title={t('inventory.title')}
        subtitle={
          lowStock.length > 0
            ? `${lowStock.length} con stock bajo`
            : 'Controlá lo que hay en casa'
        }
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('inventory.add')}
          </Button>
        }
      />

      {lowStock.length > 0 ? (
        <Card className="mb-5 border-[var(--color-warm)]/40 bg-[var(--color-warm-soft)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[var(--color-warm)]" />
            <div>
              <p className="font-semibold text-[var(--color-warm)]">{t('inventory.lowStock')}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {lowStock.map((i) => i.name).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {inventory.length === 0 ? (
        <EmptyState
          title={t('common.empty')}
          description="Arroz, azúcar, aceite, papel higiénico…"
          action={<Button onClick={openCreate}>{t('inventory.add')}</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {inventory.map((item) => {
            const low = isLowStock(item)
            return (
              <Card key={item.id} interactive onClick={() => openEdit(item)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{item.category}</p>
                  </div>
                  {low ? (
                    <span className="rounded-lg bg-[var(--color-warm-soft)] px-2 py-0.5 text-xs text-[var(--color-warm)]">
                      Bajo
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold">
                  {item.quantity}{' '}
                  <span className="text-base font-normal text-[var(--color-ink-muted)]">
                    {item.unit}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  Mínimo: {item.minQuantity} {item.unit}
                </p>
                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {low ? (
                    <Button size="sm" variant="soft" onClick={() => addInventoryToShopping(item, actor)}>
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {t('inventory.addToShopping')}
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" onClick={() => deleteInventory(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t('common.edit') : t('inventory.add')}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Nombre">
            <Input {...form.register('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cantidad">
              <Input type="number" step="any" {...form.register('quantity')} />
            </Field>
            <Field label="Mínimo">
              <Input type="number" step="any" {...form.register('minQuantity')} />
            </Field>
          </div>
          <Field label="Unidad">
            <Select {...form.register('unit')}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoría">
            <Select {...form.register('category')}>
              {INVENTORY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notas">
            <Textarea {...form.register('notes')} />
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
