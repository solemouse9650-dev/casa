import { getMessaging, type Messaging } from 'firebase/messaging'
import { app, firebaseReady } from '@/firebase/config'

let messaging: Messaging | null = null

export async function getMessagingInstance() {
  if (!firebaseReady || typeof window === 'undefined') return null
  try {
    const { isSupported } = await import('firebase/messaging')
    if (!(await isSupported())) return null
    if (!messaging) messaging = getMessaging(app)
    return messaging
  } catch (error) {
    console.warn('[Casa] messaging no disponible', error)
    return null
  }
}
