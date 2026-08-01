import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { useI18n } from '@/hooks/useI18n'
import { useActor } from '@/hooks/useAuth'
import { useVisibleData } from '@/hooks/useVisibleData'
import { NOTE_CATEGORIES, NOTE_COLORS } from '@/constants'
import { VisibilityBadge, VisibilityField } from '@/components/ui/VisibilityField'
import { getFirestoreErrorMessage } from '@/utils/firestore'
import { createNote, deleteNote, updateNote } from '@/services/notes'
import type { NoteItem } from '@/types'
import { formatRelative } from '@/utils/dates'

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  color: z.string().min(1),
  visibility: z.enum(['family', 'private']),
})

type FormData = z.infer<typeof schema>

export function NotesPage() {
  const { t, locale } = useI18n()
  const actor = useActor()
  const { notes } = useVisibleData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<NoteItem | null>(null)
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      content: '',
      category: 'Importante',
      color: NOTE_COLORS[0],
      visibility: 'family',
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      title: '',
      content: '',
      category: 'Importante',
      color: NOTE_COLORS[0],
      visibility: 'family',
    })
    setOpen(true)
  }

  const openEdit = (note: NoteItem) => {
    setEditing(note)
    form.reset({
      title: note.title,
      content: note.content,
      category: note.category,
      color: note.color,
      visibility: note.visibility ?? 'family',
    })
    setOpen(true)
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (editing) await updateNote(editing.id, data)
      else await createNote(data, actor)
      setOpen(false)
    } catch (error) {
      console.error(error)
      window.alert(getFirestoreErrorMessage(error))
    }
  })

  return (
    <div>
      <PageHeader
        title={t('notes.title')}
        subtitle="WiFi, teléfonos, recetas e info importante"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t('notes.add')}
          </Button>
        }
      />

      {notes.length === 0 ? (
        <EmptyState
          title={t('common.empty')}
          action={<Button onClick={openCreate}>{t('notes.add')}</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note.id}
              role="button"
              tabIndex={0}
              onClick={() => openEdit(note)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openEdit(note)
              }}
              className="cursor-pointer rounded-2xl border border-[var(--color-border)] p-4 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
              style={{ background: note.color }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1c2421]">
                    {note.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-[#5c6b66]">{note.category}</p>
                    <VisibilityBadge visibility={note.visibility} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    void deleteNote(note.id)
                  }}
                  className="rounded-lg p-1 text-[#5c6b66] hover:bg-black/5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#1c2421]">{note.content}</p>
              <p className="mt-4 text-xs text-[#5c6b66]">
                {note.createdByName} · {formatRelative(note.updatedAt, locale)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? t('common.edit') : t('notes.add')}
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Título">
            <Input {...form.register('title')} />
          </Field>
          <Field label="Categoría">
            <Select {...form.register('category')}>
              {NOTE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <VisibilityField register={form.register} />
          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue('color', color)}
                  className="h-8 w-8 rounded-full border border-black/10"
                  style={{
                    background: color,
                    outline:
                      form.watch('color') === color ? '2px solid var(--color-accent)' : undefined,
                  }}
                />
              ))}
            </div>
          </Field>
          <Field label="Contenido">
            <Textarea rows={6} {...form.register('content')} />
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
