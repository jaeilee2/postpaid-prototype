import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 디자인의 NFC 일러스트는 4초 루프 애니메이션입니다. Figma 타임라인을 MP4로 렌더한 뒤
// 일러스트 영역만 잘라 애니메이션 WebP(498×400, 96프레임)로 변환해 넣었습니다.
import nfcIllustration from '../assets/nfc-illustration.webp'
import payApple from '../assets/pay-apple.png'
import paySamsung from '../assets/pay-samsung.png'
import {
  AppBar,
  CardTotal,
  PaymentProgress,
  useEnsureCardMethod,
  usePaymentSettle,
  useNeedsSignature,
} from '../components/CardChrome'
import { Ic123, IcNfc } from '../components/Icon'
import { useNfcTap } from '../hooks/useNfc'

/* 카드 결제 · NFC (1723:157653 기본 / 1723:157654 툴팁 노출)
 *
 * 카드 결제를 고르면 기본으로 나오는 화면입니다.
 */

export function CardNfc() {
  const navigate = useNavigate()
  useEnsureCardMethod()
  const settle = usePaymentSettle('card')
  const needsSignature = useNeedsSignature()
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [paying, setPaying] = useState(false)

  // 툴팁은 잠시 기다린 뒤 나타납니다 (디자인에 노출 시점이 없어 2.5초로 뒀습니다).
  useEffect(() => {
    const timer = window.setTimeout(() => setTooltipVisible(true), 2500)
    return () => window.clearTimeout(timer)
  }, [])


  /* 카드를 폰 뒷면에 대면 진행됩니다.
   * 안드로이드 크롬에서는 실제 태그 감지로, 그 외에는 일러스트를 눌러 대신합니다. */
  function handleTag() {
    if (paying) return
    setTooltipVisible(false)
    // 5만원 이상이면 결제 진행 전에 서명을 받습니다 (1730:197571).
    if (needsSignature) {
      navigate('/sign')
      return
    }
    setPaying(true)
    window.setTimeout(settle, 1500)
  }

  useNfcTap(!paying, handleTag)

  return (
    <div className="card-screen">
      <AppBar
        title="카드 결제"
        onBack={() => navigate('/delivery')}
        onAction={() => navigate('/kispay')}
      />

      <div className="card-body">
        <span className="spacer spacer--a" />
        <CardTotal />
        <span className="spacer spacer--b" />

        <button
          className="nfc__illustration"
          onClick={handleTag}
          aria-label="카드를 휴대폰 뒷면에 대기 (프로토타입에서는 눌러서 진행)"
        >
          <img src={nfcIllustration} alt="" />
        </button>

        <div className="nfc__text">
          <p className="nfc__headline t-subtitle1-18-bold">
            <em>카드를 휴대폰 뒷면</em>에 대주세요
          </p>
          <p className="nfc__sub t-body3-14-regular">후불교통카드, 삼성페이, 애플페이 등 가능</p>
        </div>

        <span className="spacer spacer--c" />

        <div className="nfc__pay-icons">
          <IcNfc />
          <img src={paySamsung} alt="삼성페이" style={{ width: 23.903, height: 23.903 }} />
          <img src={payApple} alt="애플페이" style={{ width: 36.945, height: 23.793 }} />
        </div>

        <span className="spacer spacer--d" />

        <div className="nfc__keyin-wrap">
          {tooltipVisible && (
            <button
              className="nfc__tooltip t-caption1-12-medium"
              onClick={() => setTooltipVisible(false)}
            >
              카드번호를 직접 입력할 수도 있어요
            </button>
          )}
          <button className="btn-chip t-body3-14-medium" onClick={() => navigate('/card/keyin')}>
            <Ic123 />
            카드 직접 입력
          </button>
        </div>

        <span className="spacer spacer--e" />
      </div>

      {paying && <PaymentProgress />}
    </div>
  )
}
