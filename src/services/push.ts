import { arrayRemove, arrayUnion, setDoc } from 'firebase/firestore'
import { getToken, isSupported, onMessage } from 'firebase/messaging'
import { getMessagingInstance } from '@/firebase/messaging'
import { userDoc } from './paths'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

export async function requestPushPermission(uid: string): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'

  try {
    const supported = await isSupported()
    if (!supported) {
      // Igual pedimos Notification API para alertas con la app abierta
      const perm = await Notification.requestPermission()
      return perm === 'granted' ? 'granted' : 'denied'
    }
  } catch {
    const perm = await Notification.requestPermission()
    return perm === 'granted' ? 'granted' : 'denied'
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const messaging = await getMessagingInstance()
  if (!messaging) return 'granted'

  if (!VAPID_KEY) {
    console.warn('[Casa] Falta VITE_FIREBASE_VAPID_KEY para FCM. Notificaciones locales sí funcionan.')
    return 'granted'
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (token) {
      await setDoc(userDoc(uid), { fcmTokens: arrayUnion(token) }, { merge: true })
      localStorage.setItem('casa_fcm_token', token)
    }
  } catch (error) {
    console.warn('[Casa] FCM token', error)
  }

  return 'granted'
}

export async function removePushToken(uid: string) {
  const token = localStorage.getItem('casa_fcm_token')
  if (!token) return
  try {
    await setDoc(userDoc(uid), { fcmTokens: arrayRemove(token) }, { merge: true })
  } catch {
    /* ignore */
  }
  localStorage.removeItem('casa_fcm_token')
}

export async function listenForegroundPush(
  onPayload: (title: string, body: string, url?: string) => void,
) {
  const messaging = await getMessagingInstance()
  if (!messaging) return () => undefined
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title || 'Casa'
    const body = payload.notification?.body || 'Tenés un nuevo mensaje'
    const url = payload.data?.url
    onPayload(title, body, url)
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg', data: { url } })
    }
  })
}

export function showLocalNotification(title: string, body: string, url?: string) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return
  // Si la pestaña está enfocada y es el chat, no molestar
  if (document.visibilityState === 'visible' && window.location.pathname.startsWith('/chat')) {
    return
  }
  const n = new Notification(title, {
    body,
    icon: '/favicon.svg',
    tag: `casa-${url || title}`,
    data: { url },
  })
  n.onclick = () => {
    window.focus()
    if (url) window.location.href = url
    n.close()
  }
}
