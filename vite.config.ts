import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

/*
 * 빌드 결과는 dist/index.html 한 장입니다.
 * JS·CSS·이미지·폰트를 모두 파일 안에 넣어 외부 요청이 0이 되도록 합니다 —
 * 이렇게 해야 Wi-Fi나 서버 없이 링크만으로 공유해서 볼 수 있습니다.
 *
 * 라우팅은 해시 방식(#/delivery)이라 새로고침·딥링크도 동작합니다. → src/main.tsx
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    // 모든 에셋을 data URI로 인라인 (기본값은 4KB 이하만)
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
  },
})
