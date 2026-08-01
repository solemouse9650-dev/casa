import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select } from '@/components/ui/Input'
import { useI18n } from '@/hooks/useI18n'
import { useActor } from '@/hooks/useAuth'
import { useVisibleData } from '@/hooks/useVisibleData'
import { REMINDER_TYPES } from '@/constants'
import { VisibilityBadge, VisibilityField } from '@/components/ui/VisibilityField'
import { getFirestoreErrorMessage } from '@/utils/firestore'
import { createReminder, deleteReminder, updateReminder } from '@/services/reminders'
import type { TranslationKey } from '@/i18n/translations'

const schema = z.object({
  message: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  type: z.enum(['general', 'task', 'shopping', 'bill', 'other']),
  visibility: z.enum(['family', 'private']),
})

type FormData = z.infer<typeof schema>

export function RemindersPage() {
  const { t } = useI18n()
  const actor = useActor()
  const { reminders } = useVisibleData()
  const [open, setOpen] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { message: '', date: '', time: '', type: 'general', visibility: 'family' },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createReminder(data, actor)
      setOpen(false)
      form.reset({ message: '', date: '', time: '', type: 'general', visibility: 'family' })
    } catch (error) {
      console.error(error)
      window.alert(getFirestoreErrorMessage(error))
    }
  })

  return (
    <div>
      <PageHeader
        title={t('reminders.title')}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('reminders.add')}
          </Button>
        }
      />

      {reminders.length === 0 ? (
        <EmptyState title={t('common.empty')} description="Creá recordatorios para no olvidar nada." />
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{r.message}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                  <span>
                    {r.date} · {r.time} · {t(`reminderType.${r.type}` as TranslationKey)} ·{' '}
                    {r.createdByName}
                  </span>
                  <VisibilityBadge visibility={r.visibility} />
                </p>
              </div>
              <div className="flex gap-2">
                {r.status === 'pending' ? (
                  <Button size="sm" variant="soft" onClick={() => updateReminder(r.id, { status: 'done' })}>
                    Hecho
                  </Button>
                ) : (
                  <span className="text-xs text-[var(--color-success)]">Listo</span>
                )}
                <Button size="sm" variant="ghost" onClick={() => deleteReminder(r.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t('reminders.add')}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Mensaje">
            <Input {...form.register('message')} />
          </Field>
          <Field label="Fecha">
            <Input type="date" {...form.register('date')} />
          </Field>
          <Field label="Hora">
            <Input type="time" {...form.register('time')} />
          </Field>
          <Field label="Tipo">
            <Select {...form.register('type')}>
              {REMINDER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(type.labelKey as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>
          <VisibilityField register={form.register} />
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
