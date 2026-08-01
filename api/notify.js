/**
 * Vercel Serverless Function
 * Env requerida: FCM_SERVER_KEY (Firebase Console → Project settings → Cloud Messaging)
 *
 * Body: { tokens: string[], title: string, body: string, url?: string }
 */

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
    const key = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY

    if (!key) {
      res.status(200).json({
        ok: false,
        sent: 0,
        note: 'Falta FCM_SERVER_KEY en Vercel. Las notificaciones locales igual funcionan con la app abierta.',
      })
      return
    }

    if (!Array.isArray(tokens) || !tokens.length || !title || !body) {
      res.status(400).json({ error: 'tokens, title y body son requeridos' })
      return
    }

    const unique = [...new Set(tokens.filter(Boolean))]
    let sent = 0

    await Promise.all(
      unique.map(async (token) => {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            Authorization: `key=${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title,
              body,
              icon: '/favicon.svg',
            },
            data: {
              url: url || '/chat',
            },
          }),
        })
        if (response.ok) sent += 1
      }),
    )

    res.status(200).json({ ok: true, sent })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: String(error?.message || error) })
  }
}
