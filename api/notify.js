/**
 * Push con FCM HTTP v1 (API actual).
 * NO usa FCM_SERVER_KEY (API heredada, deshabilitada).
 *
 * Env en Vercel:
 *   FIREBASE_SERVICE_ACCOUNT = JSON completo de la cuenta de servicio (una sola línea)
 *
 * Body: { tokens: string[], title: string, body: string, url?: string }
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    // Por si Vercel guarda con comillas escapadas
    try {
      return JSON.parse(JSON.parse(raw))
    } catch {
      return null
    }
  }
}

function initAdmin() {
  if (getApps().length) return true
  const sa = getServiceAccount()
  if (!sa) return false
  initializeApp({
    credential: cert(sa),
    projectId: sa.project_id || 'casa-a0dfc',
  })
  return true
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { tokens = [], title, body, url } = req.body || {}

    if (!Array.isArray(tokens) || !tokens.length || !title || !body) {
      res.status(400).json({ error: 'tokens, title y body son requeridos' })
      return
    }

    if (!initAdmin()) {
      res.status(200).json({
        ok: false,
        sent: 0,
        note: 'Falta FIREBASE_SERVICE_ACCOUNT en Vercel (FCM HTTP v1). Las notificaciones locales igual funcionan con la app abierta.',
      })
      return
    }

    const unique = [...new Set(tokens.filter(Boolean))]
    const link = url || '/chat'
    const messaging = getMessaging()

    const result = await messaging.sendEachForMulticast({
      tokens: unique,
      notification: {
        title,
        body,
      },
      data: {
        url: link,
      },
      webpush: {
        fcmOptions: { link },
        notification: {
          icon: '/favicon.svg',
          title,
          body,
        },
      },
    })

    res.status(200).json({
      ok: true,
      sent: result.successCount,
      failed: result.failureCount,
      api: 'http-v1',
    })
  } catch (error) {
    console.error('[Casa notify]', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
}
