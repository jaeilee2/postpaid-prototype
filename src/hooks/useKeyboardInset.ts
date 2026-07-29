import { useEffect } from 'react'

/*
 * OS 키보드에 시트가 가리지 않게 하기.
 *
 * 폰에서 입력 필드를 누르면 OS 키보드가 화면 아래 절반을 덮습니다. 이 프로토타입은 360×740
 * 프레임을 `transform: scale`로 띄우는 구조라, 사파리가 "입력 필드를 보이게" 하려고 **페이지
 * 전체를 위로 밀어버립니다.** 그러면 프레임 위쪽이 잘리고 아래에는 배경이 드러나 화면이
 * 깨져 보입니다 (홈 화면에서 실행할 때 특히 심합니다).
 *
 * 그래서 키보드가 덮은 높이를 재서 `--keyboard-inset`으로 알려주고, 시트가 그만큼 위로
 * 올라가게 했습니다 (`.sheet { bottom: var(--keyboard-inset) }`). 실제 앱이 키보드에 맞춰
 * 시트를 올리는 것과 같은 동작이고, 페이지가 밀릴 이유도 없어집니다.
 *
 * 값은 **디자인 px**입니다 — 시트는 확대된 프레임 안에 있으므로 실제 픽셀을 배율로 나눕니다.
 */

/** 키보드가 뜨기 전에 미리 올려둘 높이의 어림값 (아이폰 숫자 키패드는 화면의 40% 남짓입니다). */
const ESTIMATE_RATIO = 0.42

/** 화면 회전이나 주소창 접힘과 키보드를 구분하는 최소 높이 */
const MIN_KEYBOARD = 60

export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    let focused = false

    function set(px: number) {
      const scale = parseFloat(getComputedStyle(root).getPropertyValue('--device-scale')) || 1
      root.style.setProperty('--keyboard-inset', `${Math.round(px / scale)}px`)
    }

    /** 키보드가 있는 기기에서만 어림값을 씁니다 — 데스크톱에서는 시트가 움직이면 안 됩니다. */
    function hasVirtualKeyboard() {
      return window.matchMedia?.('(hover: none) and (pointer: coarse)').matches === true
    }

    function measure() {
      const viewport = window.visualViewport
      const covered = viewport
        ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
        : 0
      if (covered > MIN_KEYBOARD) set(covered)
      else if (!focused) set(0)
      // 사파리가 이미 페이지를 밀어놨으면 되돌립니다.
      if (window.scrollY !== 0) window.scrollTo(0, 0)
    }

    function onFocusIn(event: FocusEvent) {
      const target = event.target as HTMLElement | null
      if (!target?.matches('input, textarea')) return
      focused = true
      // 키보드 높이는 아직 알 수 없습니다 — 사파리가 페이지를 밀기 전에 먼저 올려둡니다.
      if (hasVirtualKeyboard()) set(window.innerHeight * ESTIMATE_RATIO)
    }

    /*
     * 포커스가 빠져도 바로 0으로 내리지 않습니다 — 키보드가 내려가는 동안(약 250ms)
     * 시트가 먼저 내려가면 키보드에 가려 보입니다. 실제 뷰포트를 다시 재서 판단합니다.
     */
    let timer = 0
    function onFocusOut() {
      focused = false
      timer = window.setTimeout(measure, 50)
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    window.visualViewport?.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('scroll', measure)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      window.visualViewport?.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('scroll', measure)
      root.style.removeProperty('--keyboard-inset')
    }
  }, [])
}
