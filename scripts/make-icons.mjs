/*
 * 홈 화면 아이콘(PNG)을 그립니다.
 *
 * 안드로이드에서 "홈 화면에 추가"로 앱처럼(주소창 없이) 실행하려면 웹 앱 매니페스트가 필요하고,
 * 매니페스트에는 **192·512 PNG 아이콘**이 있어야 설치가 됩니다 (SVG는 크롬이 거부합니다).
 * 외부 도구 없이 만들려고 픽셀을 직접 찍고 zlib로 PNG를 씁니다 — index.html의 파비콘과 같은
 * 그림입니다(파란 배경 + 흰 카드 + 줄무늬).
 *
 * `maskable`로 쓰이므로 글리프는 안전 영역(가운데 80%) 안에만 그립니다.
 */

import { deflateSync } from 'node:zlib'

const BG = [13, 109, 216] // --vds-primary #0d6dd8
const FG = [255, 255, 255]

/** CRC-32 (PNG 청크용) */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

/** RGB 픽셀 배열(size×size)을 PNG 버퍼로 만듭니다. */
function encodePng(size, pixels) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 3 + 1)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = pixels[y * size + x]
      raw[rowStart + 1 + x * 3] = r
      raw[rowStart + 2 + x * 3] = g
      raw[rowStart + 3 + x * 3] = b
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** 안티에일리어싱 없이 그리면 512px에서도 계단이 보이므로 2×2 서브샘플링합니다. */
function shade(size, inside) {
  const pixels = new Array(size * size)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let hits = 0
      for (const dy of [0.25, 0.75]) {
        for (const dx of [0.25, 0.75]) if (inside(x + dx, y + dy)) hits += 1
      }
      const t = hits / 4
      pixels[y * size + x] = [
        Math.round(BG[0] + (FG[0] - BG[0]) * t),
        Math.round(BG[1] + (FG[1] - BG[1]) * t),
        Math.round(BG[2] + (FG[2] - BG[2]) * t),
      ]
    }
  }
  return pixels
}

export function drawIcon(size) {
  const u = size / 100 // 100 단위 좌표로 그립니다
  // 파비콘(32 기준)의 카드: x 8..24, y 12..22, r 2 → 100 기준 25..75, 37.5..68.75
  const card = { x0: 25 * u, x1: 75 * u, y0: 37.5 * u, y1: 68.75 * u, r: 6.25 * u }
  // 줄무늬(마그네틱 띠): 파비콘의 y 15..17 → 46.9..53.1
  const stripe = { y0: 46.875 * u, y1: 53.125 * u }

  function inRoundedRect(x, y, rect) {
    if (x < rect.x0 || x > rect.x1 || y < rect.y0 || y > rect.y1) return false
    const cx = Math.min(Math.max(x, rect.x0 + rect.r), rect.x1 - rect.r)
    const cy = Math.min(Math.max(y, rect.y0 + rect.r), rect.y1 - rect.r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= rect.r ** 2
  }

  return encodePng(
    size,
    shade(size, (x, y) => {
      if (!inRoundedRect(x, y, card)) return false
      // 줄무늬는 배경색으로 파냅니다.
      return !(y >= stripe.y0 && y <= stripe.y1)
    }),
  )
}
