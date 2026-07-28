import { useEffect, useRef, useState } from 'react'

/*
 * 실제 카메라를 씁니다.
 *
 * - 미리보기: `getUserMedia`로 뒷면 카메라를 켭니다. HTTPS(또는 localhost)에서만 됩니다.
 *   iframe 안에서 열릴 때는 `allow="camera"`가 없으면 브라우저가 막습니다.
 * - QR 인식: `BarcodeDetector`가 있는 브라우저(안드로이드 크롬 등)에서는 **진짜로 읽습니다**.
 *   없으면(iOS 사파리 등) 인식은 타이머로 대신합니다.
 * - 카드 OCR: 브라우저 표준 API가 없어 인식 자체는 타이머로 대신합니다.
 *
 * 카메라를 쓸 수 없으면 `state`가 'unavailable'이 되고, 화면은 디자인의 카메라 캡처 이미지를
 * 그대로 보여줍니다.
 */

export type CameraState = 'starting' | 'live' | 'unavailable'

export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [state, setState] = useState<CameraState>('starting')

  useEffect(() => {
    if (!active) return

    // 안전하지 않은 출처(http)에서는 mediaDevices 자체가 없습니다.
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable')
      return
    }

    let stream: MediaStream | null = null
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((granted) => {
        if (cancelled) {
          granted.getTracks().forEach((track) => track.stop())
          return
        }
        stream = granted
        const video = videoRef.current
        if (video) {
          video.srcObject = granted
          video.play().catch(() => {})
        }
        setState('live')
      })
      .catch(() => {
        if (!cancelled) setState('unavailable')
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [active])

  return { videoRef, state }
}

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue?: string }[]>
}

/** BarcodeDetector가 있는 브라우저에서만 실제로 QR을 읽습니다. */
export function useQrDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onDetect: () => void,
) {
  const onDetectRef = useRef(onDetect)
  onDetectRef.current = onDetect

  useEffect(() => {
    if (!enabled) return
    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike
      }
    ).BarcodeDetector
    if (!Detector) return

    let detector: BarcodeDetectorLike
    try {
      detector = new Detector({ formats: ['qr_code'] })
    } catch {
      return
    }

    let stopped = false
    const timer = window.setInterval(async () => {
      const video = videoRef.current
      if (stopped || !video || video.readyState < 2) return
      try {
        const codes = await detector.detect(video)
        if (!stopped && codes.length > 0) {
          stopped = true
          onDetectRef.current()
        }
      } catch {
        // 프레임을 못 읽는 경우가 있어 다음 주기에 다시 시도합니다.
      }
    }, 350)

    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [enabled, videoRef])
}
