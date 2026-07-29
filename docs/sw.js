/* 자동 생성 — scripts/build-pages.mjs */
const CACHE = 'postpaid-prototype'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  event.respondWith(
    // 항상 새로 받아옵니다. 받아온 것을 캐시에 넣어두고, 오프라인일 때만 캐시로 답합니다.
    fetch(event.request)
      .then((response) => {
        const copy = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})
