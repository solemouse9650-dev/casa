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
import { createShopping } from './shopping'
import type { InventoryItem } from '@/types'
import { nowIso } from '@/utils/dates'

export type InventoryInput = {
  name: string
  quantity: number
  minQuantity: number
  unit: string
  category: string
  notes?: string
}

export function subscribeInventory(cb: (items: InventoryItem[]) => void): Unsubscribe {
  const q = query(homeCol('inventory'), orderBy('name', 'asc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryItem, 'id'>) })))
  })
}

export async function createInventory(input: InventoryInput, actor: { id: string; name: string }) {
  const now = nowIso()
  const ref = await addDoc(homeCol('inventory'), {
    ...input,
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt: now,
    updatedAt: now,
  })
  await logActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'inventory',
    entityId: ref.id,
    message: `${actor.name} agregó ${input.name} al inventario.`,
  })
  return ref.id
}

export async function updateInventory(id: string, input: Partial<InventoryInput>) {
  await updateDoc(homeDoc('inventory', id), { ...input, updatedAt: nowIso() })
}

export async function deleteInventory(id: string) {
  await deleteDoc(homeDoc('inventory', id))
}

export async function addInventoryToShopping(
  item: InventoryItem,
  actor: { id: string; name: string },
) {
  return createShopping(
    {
      name: item.name,
      category: item.category === 'Alimentos' ? 'Supermercado' : item.category,
      quantity: Math.max(item.minQuantity - item.quantity, 1),
      unit: item.unit,
      priority: 'high',
      notes: `Desde inventario (stock: ${item.quantity} ${item.unit})`,
    },
    actor,
  )
}

export function isLowStock(item: InventoryItem) {
  return item.quantity <= item.minQuantity
}
