import { getDoc, setDoc, updateDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { userDoc, usersCol } from './paths'
import { KNOWN_USERS } from '@/constants'
import type { UserProfile } from '@/types'
import { nowIso } from '@/utils/dates'

export async function upsertUserProfile(uid: string, email: string, displayName?: string | null) {
  const ref = userDoc(uid)
  const snap = await getDoc(ref)
  const suggested = KNOWN_USERS[uid] || displayName || email.split('@')[0]
  const now = nowIso()

  if (!snap.exists()) {
    const profile: UserProfile = {
      uid,
      email,
      displayName: suggested,
      createdAt: now,
      lastLoginAt: now,
    }
    await setDoc(ref, profile)
    return profile
  }

  await updateDoc(ref, { lastLoginAt: now, email })
  return { ...(snap.data() as UserProfile), lastLoginAt: now, email }
}

export async function updateDisplayName(uid: string, displayName: string) {
  await updateDoc(userDoc(uid), { displayName })
}

export function subscribeUsers(cb: (users: UserProfile[]) => void): Unsubscribe {
  return onSnapshot(usersCol(), (snap) => {
    const users = snap.docs.map((d) => d.data() as UserProfile)
    cb(users.sort((a, b) => a.displayName.localeCompare(b.displayName)))
  })
}
