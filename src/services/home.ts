import { getDoc, setDoc } from 'firebase/firestore'
import { homeRef } from './paths'
import { nowIso } from '@/utils/dates'

export async function ensureHomeExists() {
  const ref = homeRef()
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    name: 'Familia',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
}
