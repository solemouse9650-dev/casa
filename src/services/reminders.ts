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
import { notifyAndLog } from './activity'
import type { ReminderItem, ReminderStatus, ReminderType } from '@/types'
import { nowIso } from '@/utils/dates'

export type ReminderInput = {
  message: string
  date: string
  time: string
  type: ReminderType
  status?: ReminderStatus
}

export function subscribeReminders(cb: (items: ReminderItem[]) => void): Unsubscribe {
  const q = query(homeCol('reminders'), orderBy('date', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReminderItem, 'id'>) })))
  })
}

export async function createReminder(input: ReminderInput, actor: { id: string; name: string }) {
  const ref = await addDoc(homeCol('reminders'), {
    ...input,
    status: input.status ?? 'pending',
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: nowIso(),
  })
  await notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'reminder',
    entityId: ref.id,
    message: `${actor.name} creó un recordatorio: ${input.message}`,
    notificationTitle: 'Recordatorio',
  })
  return ref.id
}

export async function updateReminder(id: string, input: Partial<ReminderInput>) {
  await updateDoc(homeDoc('reminders', id), input)
}

export async function deleteReminder(id: string) {
  await deleteDoc(homeDoc('reminders', id))
}
