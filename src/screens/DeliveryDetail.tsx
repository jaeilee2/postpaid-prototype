import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { CenterToast, MapPickupBackground, Snackbar } from '../components/Chrome'
import {
  IcCall,
  IcCard,
  IcCash,
  IcChevronRight,
  IcNavigate,
  IcQr,
  IcSms,
  IcSplit,
  IcVcc,
  IcWarning,
} from '../components/Icon'
import { ORDER, PAYMENT_METHOD_LABEL, formatWon, splitProgress } from '../data/order'
import type { PaymentMethod } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { usePaymentFlow } from './usePaymentFlow'

/* 배달지 상세 · 픽업후 · 후불현금 (1723:158379) */

const METHOD_ICON: Record<PaymentMethod, React.ReactNode> = {
  cash: <IcCash />,
  card: <IcCard />,
  qr: <IcQr />,
  split: <IcSplit />,
}

export function DeliveryDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { method, splitPayments } = useOrder()
  const { openMethodSheet, openSplitSheet, payRemaining, overlays } = usePaymentFlow()
  const [notice, setNotice] = useState<string | null>(null)
  const [toast, setToast] = useState<[string, string] | null>(null)

  const split = splitProgress(splitPayments)
  const splitInProgress = splitPayments.length > 0 && !split.done

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(null), 2600)
  }

  function showReturnToast(lines: [string, string]) {
    setToast(lines)
    window.setTimeout(() => setToast(null), 3000)
  }

  const state = location.state as {
    notice?: string
    splitToast?: [string, string]
    reopenSplit?: boolean
    openMethod?: boolean
  } | null
  /*
   * 다른 화면에서 돌아온 이유를 처리합니다.
   *  - 카메라 권한을 허용하지 않아 결제를 못 한 경우 (1747:121729의 "허용 안함")
   *  - 분할 결제로 일부를 받고 돌아온 경우 (1730:196158) → 남은 금액 시트를 다시 엽니다
   *  - 결제하지 않고 카드·QR 화면에서 나온 경우 → 결제 방법 시트를 엽니다
   */
  useEffect(() => {
    if (!state?.notice && !state?.splitToast && !state?.openMethod) return
    if (state.notice) showNotice(state.notice)
    if (state.splitToast) showReturnToast(state.splitToast)
    if (state.reopenSplit && method === 'split') openSplitSheet()
    if (state.openMethod) openMethodSheet()
    navigate('/delivery', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.notice, state?.splitToast, state?.openMethod])

  return (
    <div className="screen">
      <MapPickupBackground onTasks={() => navigate('/tasks')} />

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
        <div className={`dd__action ${splitInProgress ? 'dd__action--remaining' : ''}`}>
          <div className="dd__divider" />
          {/*
            분할 결제를 일부만 받은 상태(1730:196158)에는 결제 방법을 바꿀 수 없습니다 —
            결제 방법 줄 대신 잔여 안내 한 줄만 들어갑니다.
          */}
          {splitInProgress ? (
            <p className="dd__remaining t-body4-13-medium">
              <IcWarning />
              잔여 결제 금액 있음
            </p>
          ) : (
            <>
              <div className="dd__method">
                {/* 디자인은 후불현금 상태(1723:158379)뿐이라 현금 아이콘만 있습니다 —
                    결제 방법을 바꾸면 아이콘도 함께 바뀌는 게 맞아 시트와 같은 아이콘을 씁니다. */}
                {METHOD_ICON[method]}
                <span className="t-body3-14-medium">{PAYMENT_METHOD_LABEL[method]} 결제</span>
              </div>
              <button className="dd__method-change" onClick={openMethodSheet}>
                <span className="t-body3-14-regular">다른 결제방법</span>
                <IcChevronRight />
              </button>
            </>
          )}
          <button
            className="dd__cta btn-primary btn--h56 t-body2-16-medium"
            onClick={payRemaining}
          >
            {/*
              디자인은 `결제하기 (VAN)`이지만, 얼마를 더 받아야 하는지가 보여야 해서
              남은 금액을 라벨에 넣습니다 (2026-07-29 이재이 확인).
            */}
            {formatWon(splitInProgress ? split.remainingTotal : ORDER.amount)}원 결제하기
          </button>
        </div>
      </div>

      {notice && <Snackbar text={notice} />}
      {toast && <CenterToast lines={toast} />}
      {overlays}
    </div>
  )
}
