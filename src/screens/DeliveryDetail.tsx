import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { MapPickupBackground, Snackbar } from '../components/Chrome'
import { IcCall, IcCash, IcChevronRight, IcNavigate, IcSms, IcVcc } from '../components/Icon'
import { ORDER, PAYMENT_METHOD_LABEL, formatWon } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { CashConfirmDialog } from './CashConfirmDialog'
import { PaymentMethodSheet } from './PaymentMethodSheet'

/* 배달지 상세 · 픽업후 · 후불현금 (1723:158379) */

type Overlay = null | 'method' | 'cash-confirm'

export function DeliveryDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { method, setMethod } = useOrder()
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(null), 2600)
  }

  // 카메라 권한을 허용하지 않아 결제를 못 하고 돌아온 경우 (1747:121729의 "허용 안함")
  const returnNotice = (location.state as { notice?: string } | null)?.notice
  useEffect(() => {
    if (!returnNotice) return
    showNotice(returnNotice)
    navigate('/delivery', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnNotice])

  /** 선택된 결제 방법으로 결제를 시작합니다. */
  function startPayment(next = method) {
    if (next === 'cash') {
      setOverlay('cash-confirm')
      return
    }
    if (next === 'card') {
      // 카드는 NFC 화면이 기본입니다 (1723:157653).
      navigate('/card')
      return
    }
    if (next === 'qr') {
      // QR은 카메라를 쓰므로 권한 확인부터 시작합니다 (1747:121729).
      navigate('/qr')
      return
    }
    // 분할 결제의 후속 화면은 아직 디자인 범위에 없습니다.
    setOverlay(null)
    showNotice(`${PAYMENT_METHOD_LABEL[next]} 결제 화면은 디자인 범위 밖이에요`)
  }

  return (
    <div className="screen">
      <MapPickupBackground />

      <div className="dd__sheet">
        <div className="dd__scroll">
          <div className="dd__top">
            <div className="dd__handle" />
            <p className="dd__status t-body3-14-bold" style={{ margin: '13px 0 0' }}>
              {ORDER.status}
            </p>
            <p className="dd__address t-h4-20-bold" style={{ margin: '8px 0 0' }}>
              {ORDER.address}
            </p>
            <div className="dd__address-detail t-body1-18-medium">
              {ORDER.addressDetail.map((line) => (
                <p key={line} style={{ margin: 0, lineHeight: '22px' }}>
                  {line}
                </p>
              ))}
            </div>
            <button className="dd__copy t-body4-13-regular">복사</button>

            <div className="dd__top-actions">
              <button className="btn-outline btn--h48 t-body2-16-medium">
                <IcCall />
                고객 전화
              </button>
              <button className="btn-outline btn--h48 t-body2-16-medium">
                <IcNavigate />
                길 찾기
              </button>
            </div>
          </div>

          <div className="dd__blocks">
            {/* 배송메시지 */}
            <div className="dd__block" style={{ display: 'flex', flexDirection: 'column' }}>
              <p className="dd__block-label t-body4-13-regular" style={{ margin: 0 }}>
                배송메시지
              </p>
              <p className="dd__block-value t-body1-18-bold" style={{ margin: '4px 0 0' }}>
                {ORDER.deliveryMessage}
              </p>
              <button className="btn-outline btn--h38 t-body3-14-medium">
                <IcSms />
                문자 전송
              </button>
            </div>

            {/* 상품픽업번호 */}
            <div className="dd__block">
              <p className="dd__block-label t-body4-13-regular" style={{ margin: 0 }}>
                상품픽업번호
              </p>
              <p className="dd__block-value t-h4-20-bold" style={{ margin: '4px 0 0' }}>
                {ORDER.pickupNumber}
              </p>
              <p className="dd__store t-body2-16-medium" style={{ margin: '4px 0 0' }}>
                {ORDER.store}
              </p>
              <div className="dd__pay-card">
                <span className="t-body3-14-bold">결제필요금액</span>
                <span className="t-body2-16-bold">{formatWon(ORDER.amount)}원</span>
                <span className="badge badge--md badge--cash t-caption1-12-bold">후불현금</span>
              </div>
            </div>

            {/* 부릉오더번호 */}
            <div className="dd__block" style={{ display: 'flex', flexDirection: 'column' }}>
              <p className="dd__block-label t-body4-13-regular" style={{ margin: 0 }}>
                부릉오더번호 (VCC 소통용)
              </p>
              <p className="dd__block-value t-body1-18-medium" style={{ margin: '4px 0 0' }}>
                {ORDER.orderNumber}
              </p>
              <button className="btn-outline btn--h38 t-body3-14-medium">
                <IcVcc />
                VCC 연결
              </button>
            </div>
          </div>
        </div>

        {/* 하단 결제 바 */}
        <div className="dd__action">
          <div className="dd__divider" />
          <div className="dd__method">
            <IcCash />
            <span className="t-body3-14-medium">{PAYMENT_METHOD_LABEL[method]} 결제</span>
          </div>
          <button className="dd__method-change" onClick={() => setOverlay('method')}>
            <span className="t-body3-14-regular">결제 방법 변경</span>
            <IcChevronRight />
          </button>
          <button
            className="dd__cta btn-primary btn--h56 t-body2-16-medium"
            onClick={() => startPayment()}
          >
            {formatWon(ORDER.amount)}원 결제하기
          </button>
        </div>
      </div>

      {notice && <Snackbar text={notice} />}

      {overlay === 'method' && (
        <PaymentMethodSheet
          total={ORDER.amount}
          method={method}
          onSelect={(next) => {
            setMethod(next)
            // 시트에서 결제 방법을 고르면 곧바로 그 방법의 결제가 시작됩니다.
            startPayment(next)
          }}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'cash-confirm' && (
        <CashConfirmDialog
          onCancel={() => setOverlay(null)}
          onConfirm={() => navigate('/complete')}
        />
      )}
    </div>
  )
}
