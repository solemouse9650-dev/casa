/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyD9MsiQ1VTlXNp9HLmYyCyn9ghqEHYYrrk',
  authDomain: 'casa-a0dfc.firebaseapp.com',
  projectId: 'casa-a0dfc',
  storageBucket: 'casa-a0dfc.firebasestorage.app',
  messagingSenderId: '890269158381',
  appId: '1:890269158381:web:355ef9df227d1b451df5e4',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Casa'
  const options = {
    body: payload.notification?.body || 'Nuevo mensaje',
    icon: '/favicon.svg',
    data: payload.data || {},
  }
  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/chat'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    }),
  )
})
