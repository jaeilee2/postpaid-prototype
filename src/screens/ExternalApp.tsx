import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import kispay from '../assets/kispay.webp'
import vccDialer from '../assets/vcc-dialer.webp'
import { CenterToast } from '../components/Chrome'

/* 부릉플러스를 벗어나는 화면들 — 디자인 노드가 폰으로 찍은 화면 캡처 한 장입니다.
 *
 *   1772:130317  KIS Pay (키스페이)  — 앱바 `카드 리더기로 결제`
 *   1773:130318  전화 앱 (1800-8255) — 현금 결제 취소의 `VCC 전화연결`
 *
 * 캡처 안의 뒤로가기 자리에 투명 버튼을 얹어서 이전 화면으로 돌아갑니다.
 * 캡처라 눌러볼 게 없으니, 들어오면 뒤로가기를 누르라고 안내를 띄웁니다.
 */

const BACK_HINT = '테스트를 위해 뒤로가기를 다시 눌러주세요'
const CALL_HINT = '아무 곳이나 누르면 취소가 접수돼요'

function CaptureScreen({
  src,
  alt,
  onBack,
  hintText,
  /** 화면 아무 곳이나 눌러도 넘어갑니다 (전화 앱처럼 눌러볼 게 없는 캡처) */
  anywhere = false,
}: {
  src: string
  alt: string
  onBack: () => void
  hintText: string
  anywhere?: boolean
}) {
  const [hint, setHint] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setHint(false), 4000)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="screen capture">
      <img className="capture__shot" src={src} alt={alt} />
      {anywhere ? (
        /* 캡처라 눌러볼 게 없으니 어디를 눌러도 넘어갑니다 */
        <button className="capture__back capture__back--all" onClick={onBack} aria-label="계속" />
      ) : (
        <>
          {/* KIS Pay는 왼쪽 위 ←, 아래 내비게이션 바의 ‹ 두 곳입니다. */}
          <button className="capture__back capture__back--top" onClick={onBack} aria-label="뒤로" />
          <button
            className="capture__back capture__back--bottom"
            onClick={onBack}
            aria-label="뒤로"
          />
        </>
      )}
      {hint && <CenterToast lines={[hintText]} />}
    </div>
  )
}

/** KIS Pay (키스페이) — 카드 리더기로 결제 (1772:130317) */
export function KisPay() {
  const navigate = useNavigate()
  return (
    <CaptureScreen
      src={kispay}
      alt="KIS Pay (키스페이) 결제 앱"
      hintText={BACK_HINT}
      onBack={() => navigate(-1)}
    />
  )
}

/**
 * 전화 앱 — VCC 연결 (1773:130318)
 *
 * 현금 결제 취소는 VCC(상담)를 거쳐야 하므로 전화를 걸고 돌아옵니다.
 * 캡처 화면이라 눌러볼 게 없으니 **아무 곳이나 누르면** 취소가 접수된 것으로 보고
 * 결제 내역에 취소일시를 남깁니다 (1730:197002).
 */
export function VccCall({ onHangUp }: { onHangUp: () => void }) {
  return (
    <CaptureScreen
      src={vccDialer}
      alt="전화 앱 — VCC 1800-8255"
      hintText={CALL_HINT}
      anywhere
      onBack={onHangUp}
    />
  )
}
