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

/*
 * 홈 화면에서 실행된 상태인지.
 * 안드로이드는 매니페스트의 `display`에 따라 fullscreen / standalone / minimal-ui 중 하나로
 * 뜨므로 셋 다 봅니다 (매니페스트는 scripts/build-pages.mjs에서 만듭니다).
 */
const APP_MODES = ['fullscreen', 'standalone', 'minimal-ui']

function isStandalone() {
  /*
   * 주소창이 있는 **평범한 탭이면 앱 모드가 아닙니다.** 이걸 먼저 봅니다 —
   * 일부 브라우저(사파리)는 일반 탭에서도 `minimal-ui`를 참으로 보고해서, 긍정 조건만
   * 보면 브라우저에서 프레임이 전체화면처럼 늘어나 화면이 깨집니다.
   */
  if (window.matchMedia?.('(display-mode: browser)').matches === true) return false

  return (
    APP_MODES.some((mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches === true) ||
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
    const queries = APP_MODES.map((mode) => window.matchMedia?.(`(display-mode: ${mode})`))
    queries.forEach((query) => query?.addEventListener('change', sync))
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      queries.forEach((query) => query?.removeEventListener('change', sync))
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
