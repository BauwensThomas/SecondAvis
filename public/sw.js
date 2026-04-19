// Service Worker Avisbox - gère les notifications push

self.addEventListener('push', function (event) {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body:    data.body    || '',
    icon:    data.icon    || '/avisbox-clair.png',
    badge:   data.badge   || '/avisbox-clair.png',
    data:    { url: data.url || '/' },
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Avisbox', options)
  )
})

// Clic sur la notification : ouvre ou met en avant l'onglet concerné
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
