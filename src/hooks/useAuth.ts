import { useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '@/firebase/config'
import { useAuthStore } from '@/stores/authStore'
import { upsertUserProfile } from '@/services/users'
import { ensureHomeExists } from '@/services/home'

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setLoading = useAuthStore((s) => s.setLoading)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          const [profile] = await Promise.all([
            upsertUserProfile(user.uid, user.email ?? '', user.displayName),
            ensureHomeExists(),
          ])
          setProfile(profile)
        } catch {
          setProfile({
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.email?.split('@')[0] ?? 'Usuario',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          })
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [setUser, setProfile, setLoading])
}

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email)
}

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)
  return { user, profile, loading }
}

export function useActor() {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  return {
    id: user?.uid ?? '',
    name: profile?.displayName || user?.email?.split('@')[0] || 'Usuario',
  }
}
