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
import type { ExpenseItem, PaymentMethod } from '@/types'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'

export type ExpenseInput = {
  amount: number
  category: string
  description: string
  date: string
  paidBy: string
  paidByName: string
  paymentMethod: PaymentMethod
}

export function subscribeExpenses(cb: (items: ExpenseItem[]) => void): Unsubscribe {
  const q = query(homeCol('expenses'), orderBy('date', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExpenseItem, 'id'>) })))
    },
    (error) => console.error('[Casa] expenses snapshot error', error),
  )
}

export async function createExpense(input: ExpenseInput, actor: { id: string; name: string }) {
  const ref = await addDoc(
    homeCol('expenses'),
    cleanData({
      amount: Number(input.amount) || 0,
      category: input.category,
      description: input.description.trim(),
      date: input.date,
      paidBy: input.paidBy,
      paidByName: input.paidByName,
      paymentMethod: input.paymentMethod,
      createdBy: actor.id,
      createdByName: actor.name,
      createdAt: nowIso(),
    }),
  )
  void safeLogActivity({
    actorId: actor.id,
    actorName: actor.name,
    action: 'create',
    entityType: 'expense',
    entityId: ref.id,
    message: `${actor.name} registró un gasto de ${input.amount} (${input.description}).`,
  })
  return ref.id
}

export async function updateExpense(id: string, input: Partial<ExpenseInput>) {
  await updateDoc(homeDoc('expenses', id), cleanData({ ...input }))
}

export async function deleteExpense(id: string) {
  await deleteDoc(homeDoc('expenses', id))
}
