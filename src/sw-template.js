/* Service worker Pocket — généré au build (voir vite.config.ts). Aucune donnée financière n'est mise en cache ici :
   les données vivent dans IndexedDB. Seule l'interface (HTML/JS/CSS) est stockée pour le hors ligne. */
const CACHE = 'pocket-shell-__VERSION__'
const PRECACHE = __PRECACHE__

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')))
    return
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)))
})
