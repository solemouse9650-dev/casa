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
import type { Attachment, Priority, Recurrence, TaskItem, TaskStatus } from '@/types'
import { nowIso } from '@/utils/dates'

export type TaskInput = {
  title: string
  description?: string
  category: string
  priority: Priority
  assigneeId?: string
  assigneeName?: string
  dueDate?: string
  dueTime?: string
  status?: TaskStatus
  notes?: string
  attachments?: Attachment[]
  recurrence?: Recurrence
}

export function subscribeTasks(cb: (items: TaskItem[]) => void): Unsubscribe {
  const q = query(homeCol('tasks'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data() as Omit<TaskItem, 'id'>
        return { id: d.id, ...data, attachments: data.attachments ?? [] }
      }),
    )
  })
}

export async function createTask(input: TaskInput, actor: { id: string; name: string }) {
  const payload = {
    ...input,
    status: input.status ?? 'pending',
    attachments: input.attachments ?? [],
    recurrence: input.recurrence ?? 'none',
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: nowIso(),
  }
  const ref = await addDoc(homeCol('tasks'), payload)
  await notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'task',
    entityId: ref.id,
    message: `${actor.name} creó la tarea "${input.title}".`,
    notificationTitle: 'Nueva tarea',
  })
  return ref.id
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  await updateDoc(homeDoc('tasks', id), input)
}

export async function deleteTask(id: string, actor: { id: string; name: string }, title: string) {
  await deleteDoc(homeDoc('tasks', id))
  await notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'delete',
    entityType: 'task',
    entityId: id,
    message: `${actor.name} eliminó la tarea "${title}".`,
    notificationTitle: 'Tarea eliminada',
  })
}

export async function duplicateTask(item: TaskItem, actor: { id: string; name: string }) {
  return createTask(
    {
      title: `${item.title} (copia)`,
      description: item.description,
      category: item.category,
      priority: item.priority,
      assigneeId: item.assigneeId,
      assigneeName: item.assigneeName,
      dueDate: item.dueDate,
      dueTime: item.dueTime,
      notes: item.notes,
      recurrence: item.recurrence,
    },
    actor,
  )
}

export async function completeTask(item: TaskItem, actor: { id: string; name: string }) {
  await updateDoc(homeDoc('tasks', item.id), {
    status: 'done',
    completedBy: actor.id,
    completedByName: actor.name,
    completedAt: nowIso(),
  })
  await notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'complete',
    entityType: 'task',
    entityId: item.id,
    message: `${actor.name} terminó "${item.title}".`,
    notificationTitle: 'Tarea completada',
  })
}

export async function reopenTask(id: string) {
  await updateDoc(homeDoc('tasks', id), {
    status: 'pending',
    completedBy: null,
    completedByName: null,
    completedAt: null,
  })
}
