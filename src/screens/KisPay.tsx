import { useNavigate } from 'react-router-dom'

import kispay from '../assets/kispay.webp'

/* KIS Pay (키스페이) — 카드 리더기로 결제 (1772:130317)
 *
 * `카드 리더기로 결제`를 누르면 외부 결제 앱(KIS Pay)으로 넘어갑니다.
 * 디자인 노드가 **폰으로 찍은 플레이스토어 화면 캡처 한 장**이라 이미지를 그대로 씁니다
 * (360×800 기준, 원본 1080×2400을 2배인 720×1600 WebP로 넣었습니다).
 *
 * 캡처 안의 뒤로가기 화살표 자리에 투명한 버튼을 얹어서 이전 화면으로 돌아갑니다.
 */

export function KisPay() {
  const navigate = useNavigate()

  return (
    <div className="screen kis">
      <img className="kis__shot" src={kispay} alt="KIS Pay (키스페이) 결제 앱" />

      {/* 캡처의 ← 화살표 위에 얹은 투명 버튼 (360×800에서 16,44 크기 24) */}
      <button className="kis__back" onClick={() => navigate(-1)} aria-label="뒤로" />
    </div>
  )
}
