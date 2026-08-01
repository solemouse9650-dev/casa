import { getDoc, setDoc, updateDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { userDoc, usersCol } from './paths'
import { KNOWN_USERS } from '@/constants'
import type { UserProfile } from '@/types'
import { nowIso } from '@/utils/dates'
import { cleanData } from '@/utils/firestore'

export async function upsertUserProfile(uid: string, email: string, displayName?: string | null) {
  const ref = userDoc(uid)
  const suggested = KNOWN_USERS[uid] || displayName || email.split('@')[0] || 'Usuario'
  const now = nowIso()

  try {
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      const profile: UserProfile = {
        uid,
        email,
        displayName: suggested,
        createdAt: now,
        lastLoginAt: now,
      }
      await setDoc(ref, cleanData({ ...profile }))
      return profile
    }

    await updateDoc(ref, cleanData({ lastLoginAt: now, email }))
    return { ...(snap.data() as UserProfile), lastLoginAt: now, email }
  } catch (error) {
    console.warn('[Casa] upsertUserProfile', error)
    return {
      uid,
      email,
      displayName: suggested,
      createdAt: now,
      lastLoginAt: now,
    } satisfies UserProfile
  }
}

export async function updateDisplayName(uid: string, displayName: string) {
  await updateDoc(userDoc(uid), cleanData({ displayName: displayName.trim() }))
}

export function subscribeUsers(cb: (users: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(
    usersCol(),
    (snap) => {
      const users = snap.docs.map((d) => d.data() as UserProfile)
      cb(users.sort((a, b) => a.displayName.localeCompare(b.displayName)))
    },
    (error) => {
      console.error('[Casa] users snapshot error', error)
      // Fallback: al menos los conocidos
      cb(
        Object.entries(KNOWN_USERS).map(([uid, displayName]) => ({
          uid,
          email: '',
          displayName,
          createdAt: '',
          lastLoginAt: '',
        })),
      )
    },
  )
}
