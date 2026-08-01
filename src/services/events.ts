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
import type { CalendarEvent, Visibility } from '@/types'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'

export type EventInput = {
  title: string
  description?: string
  date: string
  time?: string
  endTime?: string
  color?: string
  visibility?: Visibility
}

export function subscribeEvents(cb: (items: CalendarEvent[]) => void): Unsubscribe {
  const q = query(homeCol('events'), orderBy('date', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data() as Omit<CalendarEvent, 'id'>
          return {
            id: d.id,
            ...data,
            visibility: data.visibility === 'private' ? 'private' : 'family',
          }
        }),
      )
    },
    (error) => console.error('[Casa] events snapshot error', error),
  )
}

export async function createEvent(input: EventInput, actor: { id: string; name: string }) {
  const visibility = input.visibility === 'private' ? 'private' : 'family'
  const ref = await addDoc(
    homeCol('events'),
    cleanData({
      title: input.title.trim(),
      description: input.description,
      date: input.date,
      time: input.time,
      endTime: input.endTime,
      color: input.color ?? '#1b7a6e',
      visibility,
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt: nowIso(),
    }),
  )
  void safeLogActivity({
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
  await updateDoc(homeDoc('events', id), cleanData({ ...input }))
}

export async function deleteEvent(id: string) {
  await deleteDoc(homeDoc('events', id))
}
