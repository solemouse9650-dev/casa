import {
  arrayUnion,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
  limit,
} from 'firebase/firestore'
import { homeCol, homeDoc } from './paths'
import type { ActivityItem, NotificationItem } from '@/types'

export function subscribeNotifications(cb: (items: NotificationItem[]) => void): Unsubscribe {
  const q = query(homeCol('notifications'), orderBy('createdAt', 'desc'), limit(50))
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data() as Omit<NotificationItem, 'id'>
        return { id: d.id, ...data, readBy: data.readBy ?? [] }
      }),
    )
  })
}

export function subscribeActivity(cb: (items: ActivityItem[]) => void): Unsubscribe {
  const q = query(homeCol('activity'), orderBy('createdAt', 'desc'), limit(100))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityItem, 'id'>) })))
  })
}

export async function markNotificationRead(id: string, uid: string) {
  await updateDoc(homeDoc('notifications', id), { readBy: arrayUnion(uid) })
}

export async function markAllNotificationsRead(items: NotificationItem[], uid: string) {
  await Promise.all(
    items
      .filter((n) => !n.readBy.includes(uid))
      .map((n) => markNotificationRead(n.id, uid)),
  )
}
