import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import nfcIllustration from '../assets/nfc-illustration.webp'
import payApple from '../assets/pay-apple.png'
import paySamsung from '../assets/pay-samsung.png'
import { AppBar, CardTotal, PaymentProgress } from '../components/CardChrome'
import { Ic123, IcNfc } from '../components/Icon'
import { useNfcTap } from '../hooks/useNfc'
import { useOrder } from '../state/OrderContext'

/* 카드 결제 취소 (1730:197613)
 *
 * 결제 내역에서 카드 결제 취소를 확인하면 나옵니다. 카드 결제 화면과 같은 화면인데
 * 금액 라벨이 `취소할 금액`이고 빨간색입니다. 결제했던 카드를 다시 대야 취소됩니다.
 *
 * 취소가 끝나면 결제 내역으로 돌아가 취소 완료 시트가 뜹니다 (1730:197701).
 */

export function CardCancel() {
  const navigate = useNavigate()
  const { cancelPayment, cancelTarget } = useOrder()
  const [cancelling, setCancelling] = useState(false)

  const index = cancelTarget ?? 0

  function handleTag() {
    if (cancelling) return
    setCancelling(true)
    window.setTimeout(() => {
      cancelPayment(index)
      navigate('/tasks/payment', { replace: true, state: { cancelled: index } })
    }, 1500)
  }

  useNfcTap(!cancelling, handleTag)

  return (
    <div className="card-screen">
      <AppBar
        title="카드 결제"
        onBack={() => navigate('/tasks/payment')}
        onAction={() => navigate('/kispay')}
      />

      <div className="card-body">
        <span className="spacer spacer--a" />
        <CardTotal cancel />
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
          {/* 태그가 안 되면 카드번호를 직접 입력해서도 취소할 수 있습니다. */}
          <button className="btn-chip t-body3-14-medium" onClick={() => navigate('/card/cancel/keyin')}>
            <Ic123 />
            카드 직접 입력
          </button>
        </div>

        <span className="spacer spacer--e" />
      </div>

      {cancelling && <PaymentProgress label="취소 진행중" />}
    </div>
  )
}
