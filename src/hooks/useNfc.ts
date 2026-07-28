import { useEffect, useRef } from 'react'

/*
 * NFC 태그 감지.
 *
 * 웹에서 **카드 결제를 읽는 것은 불가능합니다.** 신용·후불교통카드는 ISO 14443/EMV로 통신하는데
 * 브라우저에는 그 명령을 보낼 API가 없습니다 (네이티브 앱만 가능).
 *
 * 다만 안드로이드 크롬의 Web NFC(`NDEFReader`)로 **카드가 닿는 순간은 감지할 수 있습니다.**
 * 카드는 NDEF 포맷이 아니므로 `reading`이 아니라 `readingerror`가 오는데, 그 이벤트 자체가
 * "무언가 태그가 닿았다"는 신호라서 태그 트리거로 씁니다.
 *
 * 안 되는 환경(iOS, 데스크톱, HTTPS 아님, 권한 거부)에서는 아무 일도 하지 않고,
 * 화면의 일러스트를 눌러 진행하는 기존 방법이 그대로 남습니다.
 */

type NdefReaderLike = {
  scan: (options?: { signal?: AbortSignal }) => Promise<void>
  addEventListener: (type: string, listener: () => void) => void
}

export function useNfcTap(enabled: boolean, onTap: () => void) {
  const onTapRef = useRef(onTap)
  onTapRef.current = onTap

  useEffect(() => {
    if (!enabled) return

    const NdefReader = (window as unknown as { NDEFReader?: new () => NdefReaderLike }).NDEFReader
    if (!NdefReader) return

    let reader: NdefReaderLike
    try {
      reader = new NdefReader()
    } catch {
      return
    }

    const controller = new AbortController()
    const fire = () => {
      if (!controller.signal.aborted) onTapRef.current()
    }

    reader.addEventListener('reading', fire)
    reader.addEventListener('readingerror', fire)
    // 권한을 거부하거나 사용자 조작이 필요한 브라우저에서는 조용히 실패합니다.
    reader.scan({ signal: controller.signal }).catch(() => {})

    return () => controller.abort()
  }, [enabled])
}
