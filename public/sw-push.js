// PilulierFamille - Push notification service worker handler
// This is injected into the main service worker via VitePWA

self.addEventListener('push', function(event) {
  let data = { title: 'PilulierFamille', body: 'Rappel médicament', icon: '/icons/icon-192.png' }

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() }
    } catch (e) {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'medication-reminder',
    requireInteraction: true,
    data: data.data || {},
    actions: [
      { action: 'taken', title: '✓ Pris', icon: '/icons/icon-192.png' },
      { action: 'snooze', title: '⏰ +10 min' },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()

  const action = event.action
  const data = event.notification.data

  if (action === 'taken') {
    // The app will handle the actual marking when it opens
    event.waitUntil(
      clients.openWindow('/?action=taken&scheduleId=' + (data.scheduleId || ''))
    )
  } else if (action === 'snooze') {
    // Schedule a local notification in 10 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(event.notification.title, {
            ...event.notification,
            body: '(Rappel) ' + event.notification.body,
            tag: 'medication-reminder-snooze',
          })
          resolve()
        }, 10 * 60 * 1000)
      })
    )
  } else {
    event.waitUntil(clients.openWindow('/'))
  }
})
