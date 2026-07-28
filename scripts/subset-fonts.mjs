/*
 * 폰트 서브셋 갱신.
 *
 * dist/index.html(빌드 결과)에 실제로 들어간 한글·기호만 모아 Noto Sans CJK KR 세 굵기를
 * woff2로 다시 만듭니다. 새 문자열을 추가하면 이 스크립트를 돌린 뒤 다시 빌드해야 합니다.
 *
 *   npm run build && node scripts/subset-fonts.mjs && npm run build
 *
 * 준비물: pyftsubset (`pip install fonttools brotli`) 과
 *         ~/Library/Fonts/NotoSansCJKkr-{Regular,Medium,Bold}.otf
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

const WEIGHTS = [
  { file: 'NotoSansCJKkr-Regular.otf', out: 'noto-sans-kr-400.woff2' },
  { file: 'NotoSansCJKkr-Medium.otf', out: 'noto-sans-kr-500.woff2' },
  { file: 'NotoSansCJKkr-Bold.otf', out: 'noto-sans-kr-700.woff2' },
]

const html = readFileSync('dist/index.html', 'utf8')

// 폰트는 base64(ASCII)로 인라인되어 있으므로 한글·CJK 범위만 걸러도 안전합니다.
const glyphs = new Set()
for (const char of html) {
  const code = char.codePointAt(0)
  const isAscii = code >= 0x20 && code <= 0x7e
  const isHangul =
    (code >= 0xac00 && code <= 0xd7a3) || // 음절
    (code >= 0x1100 && code <= 0x11ff) || // 자모
    (code >= 0x3130 && code <= 0x318f)
  const isPunct = code >= 0x2000 && code <= 0x206f // ·, …, 따옴표 등
  const isCjkSymbol = code >= 0x3000 && code <= 0x303f
  const isWon = code === 0xffe6
  if (isAscii || isHangul || isPunct || isCjkSymbol || isWon) glyphs.add(char)
}

const text = [...glyphs].join('')
const tmp = mkdtempSync(join(tmpdir(), 'vds-subset-'))
const textFile = join(tmp, 'glyphs.txt')
writeFileSync(textFile, text, 'utf8')

console.log(`고유 문자 ${glyphs.size}자`)

for (const { file, out } of WEIGHTS) {
  execFileSync('pyftsubset', [
    join(homedir(), 'Library/Fonts', file),
    `--text-file=${textFile}`,
    '--layout-features=',
    '--no-hinting',
    '--desubroutinize',
    '--flavor=woff2',
    `--output-file=src/assets/fonts/${out}`,
  ])
  console.log(`${out} 완료`)
}
