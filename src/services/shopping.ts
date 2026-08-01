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
import type { Priority, ShoppingItem, ShoppingStatus, Visibility } from '@/types'
import { nowIso } from '@/utils/dates'
import { logActivity } from './activity'

export type ShoppingInput = {
  name: string
  category: string
  quantity: number
  unit: string
  priority: Priority
  notes?: string
  estimatedPrice?: number
  finalPrice?: number
  imageUrl?: string
  scheduledFor?: string
  status?: ShoppingStatus
  visibility?: Visibility
}

export function subscribeShopping(cb: (items: ShoppingItem[]) => void): Unsubscribe {
  const q = query(homeCol('shopping'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data() as Omit<ShoppingItem, 'id'>
          return {
            id: d.id,
            ...data,
            visibility: data.visibility === 'private' ? 'private' : 'family',
          }
        }),
      )
    },
    (error) => console.error('[Casa] shopping snapshot error', error),
  )
}

export async function createShopping(
  input: ShoppingInput,
  actor: { id: string; name: string },
) {
  const visibility = input.visibility === 'private' ? 'private' : 'family'
  const payload = {
    ...input,
    visibility,
    status: input.status ?? 'pending',
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: nowIso(),
  }
  const ref = await addDoc(homeCol('shopping'), payload)
  const message = `${actor.name} agregó ${input.name}.`
  if (visibility === 'family') {
    await notifyAndLog({
      actorId: actor.id,
      actorName: actor.name,
      action: 'create',
      entityType: 'shopping',
      entityId: ref.id,
      message,
      notificationTitle: 'Compra agregada',
    })
  } else {
    await logActivity({
      actorId: actor.id,
      actorName: actor.name,
      action: 'create',
      entityType: 'shopping',
      entityId: ref.id,
      message: `${actor.name} agregó una compra privada: ${input.name}.`,
    })
  }
  return ref.id
}

export async function updateShopping(id: string, input: Partial<ShoppingInput>) {
  await updateDoc(homeDoc('shopping', id), input)
}

export async function deleteShopping(id: string, actor: { id: string; name: string }, name: string) {
  await deleteDoc(homeDoc('shopping', id))
  await notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'delete',
    entityType: 'shopping',
    entityId: id,
    message: `${actor.name} eliminó ${name}.`,
    notificationTitle: 'Compra eliminada',
  })
}

export async function duplicateShopping(item: ShoppingItem, actor: { id: string; name: string }) {
  return createShopping(
    {
      name: `${item.name} (copia)`,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      priority: item.priority,
      notes: item.notes,
      estimatedPrice: item.estimatedPrice,
      scheduledFor: item.scheduledFor,
      imageUrl: item.imageUrl,
      visibility: item.visibility ?? 'family',
    },
    actor,
  )
}

export async function markPurchased(
  item: ShoppingItem,
  actor: { id: string; name: string },
  finalPrice?: number,
) {
  await updateDoc(homeDoc('shopping', item.id), {
    status: 'purchased',
    purchasedBy: actor.id,
    purchasedByName: actor.name,
    purchasedAt: nowIso(),
    ...(finalPrice != null ? { finalPrice } : {}),
  })
  await notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'purchase',
    entityType: 'shopping',
    entityId: item.id,
    message: `${actor.name} compró ${item.name}.`,
    notificationTitle: 'Compra realizada',
  })
}

export async function unmarkPurchased(id: string) {
  await updateDoc(homeDoc('shopping', id), {
    status: 'pending',
    purchasedBy: null,
    purchasedByName: null,
    purchasedAt: null,
  })
}
