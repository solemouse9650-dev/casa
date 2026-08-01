import { addDoc, serverTimestamp } from 'firebase/firestore'
import { homeCol } from './paths'
import type { EntityType } from '@/types'
import { nowIso } from '@/utils/dates'

export async function logActivity(params: {
  actorId: string
  actorName: string
  action: string
  entityType: EntityType
  entityId: string
  message: string
}) {
  await addDoc(homeCol('activity'), {
    ...params,
    createdAt: nowIso(),
    createdAtServer: serverTimestamp(),
  })
}

export async function createNotification(params: {
  title: string
  message: string
  entityType?: EntityType
  entityId?: string
  createdBy: string
}) {
  await addDoc(homeCol('notifications'), {
    title: params.title,
    message: params.message,
    entityType: params.entityType ?? null,
    entityId: params.entityId ?? null,
    readBy: [],
    createdBy: params.createdBy,
    createdAt: nowIso(),
    createdAtServer: serverTimestamp(),
  })
}

export async function notifyAndLog(params: {
  actorId: string
  actorName: string
  action: string
  entityType: EntityType
  entityId: string
  message: string
  notificationTitle: string
}) {
  await Promise.all([
    logActivity(params),
    createNotification({
      title: params.notificationTitle,
      message: params.message,
      entityType: params.entityType,
      entityId: params.entityId,
      createdBy: params.actorId,
    }),
  ])
}
