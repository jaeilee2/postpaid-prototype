/* 자동 생성 — scripts/build-pages.mjs */
const CACHE = 'postpaid-prototype'

// 설치할 때 첫 화면을 미리 담아둡니다 — 두 번째 방문 전에 오프라인이 되어도 열립니다.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('./').catch(() => {})))
  self.skipWaiting()
})
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
      .catch(async () => {
        /*
         * 캐시에도 없으면 **아무것도 반환하지 않아야** 브라우저의 기본 오류 화면이 나옵니다.
         * undefined를 respondWith에 넘기면 빈 화면이 떠서 "갑자기 안 나온다"가 됩니다.
         */
        const cached = await caches.match(event.request)
        if (cached) return cached
        return new Response('오프라인이에요. 네트워크에 연결하고 새로고침해주세요.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }),
  )
})
