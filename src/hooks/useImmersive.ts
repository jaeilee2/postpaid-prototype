import { useCallback, useEffect, useState } from 'react'

/*
 * 브라우저 UI 없이 실제 앱처럼 보이게 하기.
 *
 * 두 가지 경로가 있습니다.
 * 1. **전체화면 API** — 안드로이드 크롬·데스크톱에서 주소창과 하단 바가 사라집니다.
 *    나가려면 뒤로 제스처(안드로이드) 또는 Esc(데스크톱).
 * 2. **홈 화면에 추가** — 아이폰 사파리는 임의 요소의 전체화면을 지원하지 않으므로 이 방법만
 *    됩니다. `apple-mobile-web-app-capable` 메타가 있어 홈에서 실행하면 브라우저 UI가 없습니다.
 *
 * 둘 중 하나로 들어오면 `immersive`가 true가 되고, 프레임 아래 캡션을 감춰서 화면을 꽉 채웁니다.
 */

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    // iOS 사파리는 표준 display-mode 대신 navigator.standalone을 씁니다.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function useImmersive() {
  const [fullscreen, setFullscreen] = useState(false)
  const [standalone, setStandalone] = useState(isStandalone)

  const canFullscreen =
    typeof document !== 'undefined' && !!document.documentElement.requestFullscreen

  useEffect(() => {
    function sync() {
      setFullscreen(!!document.fullscreenElement)
      setStandalone(isStandalone())
    }
    sync()
    document.addEventListener('fullscreenchange', sync)
    const query = window.matchMedia?.('(display-mode: standalone)')
    query?.addEventListener('change', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      query?.removeEventListener('change', sync)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      return
    }
    // 실패해도(권한·미지원) 조용히 넘어갑니다 — 캡션이 그대로 남습니다.
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
  }, [])

  return { immersive: fullscreen || standalone, fullscreen, canFullscreen, toggleFullscreen }
}
