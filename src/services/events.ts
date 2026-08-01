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
import { logActivity } from './activity'
import type { CalendarEvent } from '@/types'
import { nowIso } from '@/utils/dates'

export type EventInput = {
  title: string
  description?: string
  date: string
  time?: string
  endTime?: string
  color?: string
}

export function subscribeEvents(cb: (items: CalendarEvent[]) => void): Unsubscribe {
  const q = query(homeCol('events'), orderBy('date', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CalendarEvent, 'id'>) })))
  })
}

export async function createEvent(input: EventInput, actor: { id: string; name: string }) {
  const ref = await addDoc(homeCol('events'), {
    ...input,
    color: input.color ?? '#1b7a6e',
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: nowIso(),
  })
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'event',
    entityId: ref.id,
    message: `${actor.name} creó el evento "${input.title}".`,
  })
  return ref.id
}

export async function updateEvent(id: string, input: Partial<EventInput>) {
  await updateDoc(homeDoc('events', id), input)
}

export async function deleteEvent(id: string) {
  await deleteDoc(homeDoc('events', id))
}
