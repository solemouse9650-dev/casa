import { getDoc, setDoc } from 'firebase/firestore'
import { homeRef } from './paths'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'

export async function ensureHomeExists() {
  const ref = homeRef()
  try {
    const snap = await getDoc(ref)
    if (snap.exists()) return
    await setDoc(
      ref,
      cleanData({
        name: 'Familia',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }),
      { merge: true },
    )
  } catch (error) {
    // Si las reglas aún no están desplegadas, no bloqueamos el login
    console.warn('[Casa] ensureHomeExists', error)
  }
}
