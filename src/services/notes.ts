import {
  addDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { homeCol, homeDoc } from './paths'
import { safeLogActivity } from './activity'
import type { NoteItem, Visibility } from '@/types'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'

export type NoteInput = {
  title: string
  content: string
  color: string
  category: string
  visibility?: Visibility
}

export function subscribeNotes(cb: (items: NoteItem[]) => void): Unsubscribe {
  const q = query(homeCol('notes'), orderBy('updatedAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data() as Omit<NoteItem, 'id'>
          return {
            id: d.id,
            ...data,
            visibility: data.visibility === 'private' ? 'private' : 'family',
          }
        }),
      )
    },
    (error) => console.error('[Casa] notes snapshot error', error),
  )
}

export async function createNote(input: NoteInput, actor: { id: string; name: string }) {
  const now = nowIso()
  const visibility = input.visibility === 'private' ? 'private' : 'family'
  const ref = await addDoc(
    homeCol('notes'),
    cleanData({
      title: input.title.trim(),
      content: input.content,
      color: input.color,
      category: input.category,
      visibility,
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt: now,
      updatedAt: now,
    }),
  )
  void safeLogActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'note',
    entityId: ref.id,
    message: `${actor.name} agregó la nota "${input.title}".`,
  })
  return ref.id
}

export async function updateNote(id: string, input: Partial<NoteInput>) {
  await updateDoc(homeDoc('notes', id), cleanData({ ...input, updatedAt: nowIso() }))
}

export async function deleteNote(id: string) {
  await deleteDoc(homeDoc('notes', id))
}
