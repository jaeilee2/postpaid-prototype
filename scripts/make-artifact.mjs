/*
 * dist/index.html (단일 파일 빌드) → dist/artifact.html
 *
 * Artifact로 배포할 때는 <!doctype>·<html>·<head>·<body>를 직접 넣지 않고 본문만 올려야 합니다.
 * 배포 시점에 문서 골격이 씌워지기 때문입니다.
 * 그래서 인라인된 <style>·<script>와 #root만 뽑아 껍데기 없는 조각으로 다시 씁니다.
 *
 * 사용: npm run build:artifact
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const html = readFileSync(join(dist, 'index.html'), 'utf8')

/** <tag ...>…</tag> 블록을 전부 뽑아냅니다. */
function extractBlocks(source, tag) {
  const blocks = []
  const open = `<${tag}`
  const close = `</${tag}>`
  let at = 0

  while (true) {
    const start = source.indexOf(open, at)
    if (start === -1) break
    const end = source.indexOf(close, start)
    if (end === -1) break
    blocks.push(source.slice(start, end + close.length))
    at = end + close.length
  }

  return blocks
}

const styles = extractBlocks(html, 'style')
const scripts = extractBlocks(html, 'script')

if (styles.length === 0 || scripts.length === 0) {
  throw new Error(
    `인라인 블록을 찾지 못했습니다 (style ${styles.length}개, script ${scripts.length}개). ` +
      'vite-plugin-singlefile이 동작했는지 확인하세요.',
  )
}

// <script type="module">은 defer 동작이라 #root보다 먼저 와도 되지만, 순서를 명확히 둡니다.
const out = [
  '<title>후불결제 프로토타입 · 부릉플러스</title>',
  ...styles,
  '<div id="root"></div>',
  ...scripts,
].join('\n')

/*
 * 외부 요청이 남아 있으면 Artifact의 CSP에서 차단되므로 미리 잡습니다.
 * 검사는 실제로 배포되는 조각(out)만 대상으로 하고, 경로처럼 생긴 참조만 봅니다 —
 * 번들 안의 템플릿 문자열이나 React 에러 메시지 URL은 요청이 아니라서 걸러야 합니다.
 */
const looksLikePath = /^(https?:|\/\/|\/|\.\.?\/)/
const externalRefs = [...out.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((url) => looksLikePath.test(url))

if (externalRefs.length > 0) {
  console.warn(`⚠ 인라인되지 않은 외부 참조: ${[...new Set(externalRefs)].join(', ')}`)
} else {
  console.log('외부 참조 없음 — CSP 안전')
}

const target = join(dist, 'artifact.html')
writeFileSync(target, out, 'utf8')
console.log(
  `dist/artifact.html — ${(out.length / 1024).toFixed(0)} KB ` +
    `(style ${styles.length}, script ${scripts.length})`,
)
