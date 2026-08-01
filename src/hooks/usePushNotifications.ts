import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeChatActivity } from '@/services/chat'
import {
  listenForegroundPush,
  requestPushPermission,
  showLocalNotification,
} from '@/services/push'

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  useEffect(() => {
    if (!user) return

    let unsubActivity: (() => void) | undefined
    let unsubFg: (() => void) | undefined
    let cancelled = false

    void (async () => {
      const result = await requestPushPermission(user.uid)
      if (cancelled) return
      setPermission(result === 'unsupported' ? 'unsupported' : Notification.permission)

      unsubFg = await listenForegroundPush((title, body, url) => {
        showLocalNotification(title, body, url)
      })

      unsubActivity = subscribeChatActivity(user.uid, ({ chatId, message, title }) => {
        showLocalNotification(
          title,
          `${message.createdByName}: ${message.text}`,
          `/chat?c=${encodeURIComponent(chatId)}`,
        )
      })
    })()

    return () => {
      cancelled = true
      unsubActivity?.()
      unsubFg?.()
    }
  }, [user])

  return { permission }
}
