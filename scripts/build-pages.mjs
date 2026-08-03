/*
 * dist/index.html → docs/ (GitHub Pages)
 *
 * 단일 HTML 하나만 올리면 **안드로이드에서는 앱처럼 실행되지 않습니다.** 아이폰 사파리는
 * `apple-mobile-web-app-capable` 메타만으로 홈 화면 실행 시 주소창이 사라지는데, 크롬은
 * **웹 앱 매니페스트**(display: standalone)와 192·512 PNG 아이콘, 그리고 오프라인에 응답하는
 * 서비스 워커가 있어야 "앱 설치"가 뜹니다.
 *
 * 매니페스트·아이콘·서비스 워커는 각각 별도 파일이라 단일 HTML(Artifact)에는 넣을 수 없습니다.
 * 그래서 Pages 사본에만 붙입니다 — dist/index.html과 dist/artifact.html은 그대로 외부 요청 0.
 *
 * 사용: npm run build:pages
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { drawIcon } from './make-icons.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const docs = join(root, 'docs')
mkdirSync(docs, { recursive: true })

const write = (name, data) => writeFileSync(join(docs, name), data)

/* ── 아이콘 ── */
write('icon-192.png', drawIcon(192))
write('icon-512.png', drawIcon(512))

/* ── 매니페스트 ──
 * 프로토타입이 상태바를 직접 그리므로(StatusBar) 기기 상태바까지 사라지는 `fullscreen`이
 * 가장 앱처럼 보입니다. 지원하지 않는 런처에서는 `standalone`으로 떨어집니다.
 */
write(
  'manifest.webmanifest',
  `${JSON.stringify(
    {
      name: '후불결제 프로토타입 · 부릉플러스',
      short_name: '후불결제',
      description: '부릉 프렌즈 기사앱 후불결제 플로우 프로토타입',
      start_url: './',
      scope: './',
      display: 'fullscreen',
      display_override: ['fullscreen', 'standalone'],
      orientation: 'portrait',
      background_color: '#e9ebee',
      theme_color: '#e9ebee',
      lang: 'ko',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  )}\n`,
)

/* ── 서비스 워커 ──
 * 크롬이 설치를 허용하려면 오프라인에서도 응답해야 합니다. 다만 **네트워크 우선**입니다 —
 * 캐시 우선으로 두면 디자인을 고쳐 배포해도 폰에 옛 화면이 계속 떠서 "수정 안 됐다"가 됩니다.
 */
write(
  'sw.js',
  `/* 자동 생성 — scripts/build-pages.mjs */
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
`,
)

/* ── index.html ── */
const html = readFileSync(join(root, 'dist', 'index.html'), 'utf8')
const head = `    <link rel="manifest" href="manifest.webmanifest" />
    <link rel="apple-touch-icon" href="icon-192.png" />
    <script>
      // 서비스 워커가 있어야 안드로이드에서 "앱 설치"가 뜹니다 (내용은 sw.js 참고).
      if ('serviceWorker' in navigator) {
        addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}))
      }
    </script>
  </head>`

if (!html.includes('</head>')) throw new Error('dist/index.html에 </head>가 없습니다')
write('index.html', html.replace('</head>', head))

write('.nojekyll', '')
write('robots.txt', 'User-agent: *\nDisallow: /\n')

console.log('docs/ — index.html, manifest.webmanifest, sw.js, icon-192.png, icon-512.png')
