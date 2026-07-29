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
} from '../components/Icon'
import { ORDER, PAYMENT_METHOD_LABEL, formatWon, splitProgress } from '../data/order'
import type { PaymentMethod, SplitPayment } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { CashConfirmDialog } from './CashConfirmDialog'
import { PaymentMethodSheet } from './PaymentMethodSheet'
import { SplitPaymentSheet } from './SplitPaymentSheet'

/* 배달지 상세 · 픽업후 · 후불현금 (1723:158379) */

const METHOD_ICON: Record<PaymentMethod, React.ReactNode> = {
  cash: <IcCash />,
  card: <IcCard />,
  qr: <IcQr />,
  split: <IcSplit />,
}

type Overlay = null | 'method' | 'cash-confirm' | 'split' | 'split-cash-confirm'

export function DeliveryDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { method, setMethod, splitPayments, addSplitPayment, setPendingSplit } = useOrder()
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [toast, setToast] = useState<[string, string] | null>(null)
  /** 분할 결제 시트에서 고른 이번 회차 금액 (현금 확인 얼럿을 거칠 때 잠시 들고 있습니다) */
  const [splitPart, setSplitPart] = useState<Omit<SplitPayment, 'method'> | null>(null)

  const split = splitProgress(splitPayments)
  const splitInProgress = splitPayments.length > 0 && !split.done

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(null), 2600)
  }

  function showToast(lines: [string, string]) {
    setToast(lines)
    window.setTimeout(() => setToast(null), 3000)
  }

  const state = location.state as { notice?: string; splitToast?: [string, string] } | null
  // 카메라 권한을 허용하지 않아 결제를 못 하고 돌아온 경우 (1747:121729의 "허용 안함")
  // 또는 분할 결제로 일부를 받고 돌아온 경우 (1730:196158)
  useEffect(() => {
    if (!state?.notice && !state?.splitToast) return
    if (state.notice) showNotice(state.notice)
    if (state.splitToast) showToast(state.splitToast)
    navigate('/delivery', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.notice, state?.splitToast])

  /** 분할 결제 한 건을 기록하고, 남았으면 이 화면에 머물고 다 받았으면 완료 화면으로 갑니다. */
  function completeSplitPart(payMethod: SplitPayment['method'], part: Omit<SplitPayment, 'method'>) {
    addSplitPayment({ method: payMethod, ...part })
    setOverlay(null)
    setSplitPart(null)
    const next = splitProgress([...splitPayments, { method: payMethod, ...part }])
    if (next.done) {
      navigate('/complete')
      return
    }
    showToast([
      `${PAYMENT_METHOD_LABEL[payMethod]} ${formatWon(part.product + part.cup)}원이 결제되었어요`,
      '전체 결제 후 영수증 발송이 가능해요',
    ])
  }

  /** 카드·QR은 각자의 화면으로 넘어갑니다 — 이번 회차 금액을 컨텍스트에 실어 보냅니다. */
  function handleSplitPay(
    payMethod: SplitPayment['method'],
    part: Omit<SplitPayment, 'method'>,
  ) {
    if (payMethod === 'cash') {
      setSplitPart(part)
      setOverlay('split-cash-confirm')
      return
    }
    setPendingSplit(part)
    navigate(payMethod === 'card' ? '/card' : '/qr')
  }

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
    // 분할은 금액을 나눠 받는 시트가 뜹니다 (1730:197705).
    setOverlay('split')
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
        <div className={`dd__action ${splitInProgress ? 'dd__action--remaining' : ''}`}>
          <div className="dd__divider" />
          <div className="dd__method">
            {/* 디자인은 후불현금 상태(1723:158379)뿐이라 현금 아이콘만 있습니다 —
                결제 방법을 바꾸면 아이콘도 함께 바뀌는 게 맞아 시트와 같은 아이콘을 씁니다. */}
            {METHOD_ICON[method]}
            <span className="t-body3-14-medium">{PAYMENT_METHOD_LABEL[method]} 결제</span>
          </div>
          <button className="dd__method-change" onClick={() => setOverlay('method')}>
            <span className="t-body3-14-regular">결제 방법 변경</span>
            <IcChevronRight />
          </button>
          {/* 분할 결제로 일부만 받은 상태 (1730:196158) */}
          {splitInProgress && (
            <p className="dd__remaining t-body3-14-bold">
              <span className="dd__remaining-mark">⚠</span> 잔여 결제 금액 있음
            </p>
          )}
          <button
            className="dd__cta btn-primary btn--h56 t-body2-16-medium"
            onClick={() => startPayment()}
          >
            {/* 분할 결제는 VAN 단말로 나눠 받으므로 라벨이 다릅니다 (1730:195840). */}
            {method === 'split' ? '결제하기 (VAN)' : `${formatWon(ORDER.amount)}원 결제하기`}
          </button>
        </div>
      </div>

      {notice && <Snackbar text={notice} />}
      {toast && <CenterToast lines={toast} />}

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

      {overlay === 'split' && (
        <SplitPaymentSheet onClose={() => setOverlay(null)} onPay={handleSplitPay} />
      )}

      {/* 분할 결제에서 현금을 고르면 같은 확인 얼럿이 뜹니다 (1730:195338). */}
      {overlay === 'split-cash-confirm' && splitPart && (
        <CashConfirmDialog
          onCancel={() => setOverlay('split')}
          onConfirm={() => completeSplitPart('cash', splitPart)}
        />
      )}
    </div>
  )
}
