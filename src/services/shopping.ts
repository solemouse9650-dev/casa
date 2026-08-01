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
import type { Priority, ShoppingItem, ShoppingStatus } from '@/types'
import { nowIso } from '@/utils/dates'

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
}

export function subscribeShopping(cb: (items: ShoppingItem[]) => void): Unsubscribe {
  const q = query(homeCol('shopping'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ShoppingItem, 'id'>) })))
  })
}

export async function createShopping(
  input: ShoppingInput,
  actor: { id: string; name: string },
) {
  const payload = {
    ...input,
    status: input.status ?? 'pending',
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: nowIso(),
  }
  const ref = await addDoc(homeCol('shopping'), payload)
  await notifyAndLog({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'shopping',
    entityId: ref.id,
    message: `${actor.name} agregó ${input.name}.`,
    notificationTitle: 'Compra agregada',
  })
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
