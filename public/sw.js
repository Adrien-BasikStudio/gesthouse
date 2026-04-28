const CACHE_NAME = 'fourmis-v1'
const OFFLINE_URLS = ['/', '/tasks', '/shopping', '/recipes', '/expenses', '/stock', '/calendar']

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(cached => cached ?? caches.match('/'))
    )
  )
})

self.addEventListener('push', event => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { return }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Les Fourmis', {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url ?? '/home' },
      vibrate: [200, 100, 200],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/home'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      const existing = windows.find(w => w.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(url)
      } else {
        clients.openWindow(url)
      }
    })
  )
})
