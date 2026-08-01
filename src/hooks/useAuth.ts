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
    let cancelled = false

    // Evita quedar colgado en "Verificando sesión…"
    const timeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 4000)

    const unsub = onAuthStateChanged(auth, (user) => {
      if (cancelled) return

      setUser(user)
      setLoading(false)
      window.clearTimeout(timeout)

      if (!user) {
        setProfile(null)
        return
      }

      // Perfil/hogar en segundo plano: no bloquean el acceso al panel
      void (async () => {
        try {
          const [profile] = await Promise.all([
            upsertUserProfile(user.uid, user.email ?? '', user.displayName),
            ensureHomeExists(),
          ])
          if (!cancelled) setProfile(profile)
        } catch {
          if (!cancelled) {
            setProfile({
              uid: user.uid,
              email: user.email ?? '',
              displayName: user.email?.split('@')[0] ?? 'Usuario',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            })
          }
        }
      })()
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      unsub()
    }
  }, [setUser, setProfile, setLoading])
}

export async function login(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password)
}

export async function logout() {
  return signOut(auth)
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email.trim())
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

export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code: string }).code)
      : ''

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Correo o contraseña incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Probá de nuevo en unos minutos.'
    case 'auth/network-request-failed':
      return 'Error de conexión. Revisá tu internet.'
    case 'auth/user-disabled':
      return 'Esta cuenta está deshabilitada.'
    default:
      return 'No pudimos iniciar sesión. Revisá correo y contraseña.'
  }
}
