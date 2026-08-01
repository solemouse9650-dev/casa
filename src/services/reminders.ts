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
import { notifyAndLog, safeLogActivity } from './activity'
import type { ReminderItem, ReminderStatus, ReminderType, Visibility } from '@/types'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'

export type ReminderInput = {
  message: string
  date: string
  time: string
  type: ReminderType
  status?: ReminderStatus
  visibility?: Visibility
}

export function subscribeReminders(cb: (items: ReminderItem[]) => void): Unsubscribe {
  const q = query(homeCol('reminders'), orderBy('date', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data() as Omit<ReminderItem, 'id'>
          return {
            id: d.id,
            ...data,
            visibility: data.visibility === 'private' ? 'private' : 'family',
          }
        }),
      )
    },
    (error) => console.error('[Casa] reminders snapshot error', error),
  )
}

export async function createReminder(input: ReminderInput, actor: { id: string; name: string }) {
  const visibility = input.visibility === 'private' ? 'private' : 'family'
  const ref = await addDoc(
    homeCol('reminders'),
    cleanData({
      message: input.message.trim(),
      date: input.date,
      time: input.time,
      type: input.type,
      visibility,
      status: input.status ?? 'pending',
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt: nowIso(),
    }),
  )
  const message = `${actor.name} creó un recordatorio: ${input.message}`
  if (visibility === 'family') {
    void notifyAndLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'create',
      entityType: 'reminder',
      entityId: ref.id,
      message,
      notificationTitle: 'Recordatorio',
    })
  } else {
    void safeLogActivity({
      actorId: actor.id,
      actorName: actor.name,
      action: 'create',
      entityType: 'reminder',
      entityId: ref.id,
      message,
    })
  }
  return ref.id
}

export async function updateReminder(id: string, input: Partial<ReminderInput>) {
  await updateDoc(homeDoc('reminders', id), cleanData({ ...input }))
}

export async function deleteReminder(id: string) {
  await deleteDoc(homeDoc('reminders', id))
}
