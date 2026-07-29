import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import check from '../assets/check.png'
import { Snackbar, StatusBar } from '../components/Chrome'
import { IcBack, IcCall, IcCardCancel, IcCashReceipt, IcSms } from '../components/Icon'
import {
  CARD_APPROVAL,
  ORDER,
  PAYMENT_METHOD_LABEL,
  formatWon,
  splitPaymentAmount,
  splitProgress,
} from '../data/order'
import type { SplitPayment } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { CashReceiptSheet } from './CashReceiptSheet'
import { VccCall } from './ExternalApp'

/* 결제 내역
 *   1730:196892  카드 결제 후          1730:198254  카드 취소 후
 *   1730:196850  현금 결제 후          1730:197002  현금 취소 후
 *   1730:196990  현금 취소 얼럿 (현금영수증 발급된 경우)
 *   1730:196997  현금 취소 얼럿 (미발급)
 *   1773:130318  VCC 전화 앱           1730:197003  취소 후 다시 결제한 상태
 *
 * 수행목록의 `결제내역`으로 들어옵니다. 결제 한 건씩 카드로 쌓입니다.
 * 카드는 결제했던 카드를 다시 태그해 즉시 취소되고, 현금은 VCC에 전화해 취소를 요청합니다.
 */

/** 결제 한 건 (카드 188 / 카드 취소 212 / 현금 152 / 현금 취소 96) */
function Record({
  payment,
  index,
  cashReceiptIssued,
  onCancel,
  onSendReceipt,
  onIssueCashReceipt,
  onViewReceipt,
}: {
  payment: SplitPayment
  index: number
  cashReceiptIssued: boolean
  onCancel: (index: number) => void
  onSendReceipt: () => void
  onIssueCashReceipt: () => void
  onViewReceipt: () => void
}) {
  const cancelled = !!payment.cancelledAt
  const label = PAYMENT_METHOD_LABEL[payment.method]
  const isCash = payment.method === 'cash'

  return (
    <div
      className={`ph__record ph__record--${isCash ? 'cash' : 'card'} ${
        cancelled ? 'ph__record--cancelled' : ''
      } ${isCash && !cancelled && cashReceiptIssued ? 'ph__record--cash-issued' : ''}`}
    >
      <p className={`ph__amount t-body1-18-bold ${cancelled ? 'ph__amount--cancelled' : ''}`}>
        {formatWon(splitPaymentAmount(payment))}원
      </p>
      <p className={`ph__method t-body4-13-regular ${cancelled ? 'ph__method--cancelled' : ''}`}>
        {cancelled ? `${label} 취소` : label}
      </p>

      <dl className="ph__rows">
        <div className="ph__row">
          <dt className="t-body3-14-regular">결제일시</dt>
          <dd className="t-body4-13-regular">{payment.paidAt}</dd>
        </div>
        {cancelled && (
          <div className="ph__row">
            <dt className="t-body3-14-regular">취소일시</dt>
            <dd className="t-body4-13-regular">{payment.cancelledAt}</dd>
          </div>
        )}
        {/* 카드는 VAN 승인 정보가 함께 남습니다 (현금은 결제일시만, 1730:196850) */}
        {!isCash && (
          <>
            <div className="ph__row">
              <dt className="t-body3-14-regular">카드종류</dt>
              <dd className="t-body4-13-regular">{CARD_APPROVAL.type}</dd>
            </div>
            <div className="ph__row">
              <dt className="t-body3-14-regular">카드번호</dt>
              <dd className="t-caption1-12-regular">{CARD_APPROVAL.number}</dd>
            </div>
            <div className="ph__row">
              <dt className="t-body3-14-regular">승인번호</dt>
              <dd className="t-caption1-12-regular">{CARD_APPROVAL.approval}</dd>
            </div>
          </>
        )}
      </dl>

      {/* 취소된 건에는 버튼이 없습니다 (1730:197002) — 카드 취소는 영수증만 남습니다 */}
      {cancelled ? (
        !isCash && (
          <div className="ph__buttons">
            <button className="btn-outline t-body3-14-medium" onClick={onSendReceipt}>
              <IcSms />
              영수증 발송
            </button>
          </div>
        )
      ) : isCash ? (
        <>
          {/* 현금영수증을 발급하면 확인 버튼이 한 줄 더 붙습니다 (1730:196850) */}
          {cashReceiptIssued && (
            <div className="ph__buttons ph__buttons--view">
              <button className="btn-outline t-body3-14-medium" onClick={onViewReceipt}>
                <IcCashReceipt />
                영수증 확인
              </button>
            </div>
          )}
          <div className="ph__buttons">
            <button className="btn-outline t-body3-14-medium" onClick={() => onCancel(index)}>
              <IcCall />
              결제 취소 요청
            </button>
            <button
              className="btn-outline t-body3-14-medium"
              disabled={cashReceiptIssued}
              onClick={onIssueCashReceipt}
            >
              <IcCashReceipt />
              현금 영수증 발급
            </button>
          </div>
        </>
      ) : (
        <div className="ph__buttons">
          <button className="btn-outline t-body3-14-medium" onClick={() => onCancel(index)}>
            <IcCardCancel />
            카드 결제 취소
          </button>
          <button className="btn-outline t-body3-14-medium" onClick={onSendReceipt}>
            <IcSms />
            영수증 발송
          </button>
        </div>
      )}
    </div>
  )
}

/** 카드 결제 취소 확인 (1730:197134) */
function CardCancelDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div className="dimmed" onClick={onClose} />
      <div className="dialog" role="alertdialog">
        <p className="dialog__title t-subtitle1-18-bold" style={{ margin: 0 }}>
          카드 결제 취소
        </p>
        <p className="dialog__body t-body2-16-regular" style={{ margin: 0 }}>
          결제를 취소하시나요?
          <br />
          결제했던 수단으로 취소해 주세요.
        </p>
        <button
          className="dialog__cancel btn-tertiary btn--h48 t-body2-16-medium"
          onClick={onClose}
        >
          닫기
        </button>
        <button
          className="dialog__confirm dialog__confirm--wide btn-primary btn--h48 t-body2-16-medium"
          onClick={onConfirm}
        >
          카드 결제 취소
        </button>
      </div>
    </>
  )
}

/**
 * 현금 결제 취소 요청 (1730:196997 기본 / 1730:196990 현금영수증 발급된 경우)
 *
 * 현금은 기사가 직접 취소할 수 없어 VCC(상담)를 거칩니다. 제목이 없고 본문만 있습니다.
 */
function CashCancelDialog({
  cashReceiptIssued,
  onClose,
  onCall,
}: {
  cashReceiptIssued: boolean
  onClose: () => void
  onCall: () => void
}) {
  return (
    <>
      <div className="dimmed" onClick={onClose} />
      <div className="dialog dialog--body-only" role="alertdialog">
        <p className="dialog__body t-body2-16-regular" style={{ margin: 0 }}>
          현금 결제 취소는 VCC를 통해 처리됩니다. 지금 VCC로 전화하시겠어요?
          {cashReceiptIssued && (
            <>
              <br />
              <br />
              현금결제 취소 시 현금영수증 발급 내역도 함께 취소됩니다.
            </>
          )}
        </p>
        <button
          className="dialog__cancel btn-tertiary btn--h48 t-body2-16-medium"
          onClick={onClose}
        >
          취소
        </button>
        <button
          className="dialog__confirm dialog__confirm--wide btn-primary btn--h48 t-body2-16-medium"
          onClick={onCall}
        >
          VCC 전화연결
        </button>
      </div>
    </>
  )
}

/** 결제 취소 완료 시트 (1730:197701) — 카드 취소에만 나옵니다. 시트 높이 388 */
function CancelCompleteSheet({
  amount,
  label,
  onClose,
  onRepay,
  onSendReceipt,
}: {
  amount: number
  label: string
  onClose: () => void
  onRepay: () => void
  onSendReceipt: () => void
}) {
  return (
    <>
      <div className="dimmed" />
      <div className="sheet cc__sheet">
        <img className="cc__check" src={check} alt="" />
        <p className="cc__title t-h2-28-bold">결제 취소 완료</p>

        <div className="cc__price">
          <span className="t-body3-14-medium">{label} 취소 금액</span>
          <span className="cc__price-value t-body2-16-bold">{formatWon(amount)}원</span>
        </div>

        <button
          className="cc__receipt btn-outline btn--h48 t-body2-16-medium"
          onClick={onSendReceipt}
        >
          <IcSms />
          영수증 발송
        </button>

        <div className="sheet__actions cc__actions">
          <button className="btn-tertiary btn--h48 t-body2-16-medium" onClick={onClose}>
            닫기
          </button>
          <button className="btn-primary btn--h48 t-body2-16-medium" onClick={onRepay}>
            다시 결제하기
          </button>
        </div>
      </div>
    </>
  )
}

type Overlay = null | { kind: 'ask'; index: number } | { kind: 'call'; index: number } | 'receipt'

export function PaymentHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const { splitPayments, cancelPayment, cashReceiptIssued, issueCashReceipt, setCancelTarget } =
    useOrder()
  const [overlay, setOverlay] = useState<Overlay>(null)
  /** 취소가 끝나면 완료 시트를 띄웁니다 — 카드 취소 화면에서 돌아올 때도 여기로 옵니다. */
  const [done, setDone] = useState<number | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const { remainingTotal } = splitProgress(splitPayments)

  /*
   * 카드 취소 화면(/card/cancel · /card/cancel/keyin)에서 마치면 완료 시트를 띄우고,
   * 문자 앱에서 영수증을 보내고 돌아오면 안내를 띄웁니다.
   */
  const state = location.state as { cancelled?: number; notice?: string } | null
  useEffect(() => {
    if (state?.cancelled === undefined && !state?.notice) return
    if (state.cancelled !== undefined) setDone(state.cancelled)
    if (state.notice) {
      setNotice(state.notice)
      window.setTimeout(() => setNotice(null), 2600)
    }
    navigate('/tasks/payment', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.cancelled, state?.notice])

  function sendReceipt() {
    // 영수증은 완료 화면과 같은 문자 앱 왕복 구조입니다.
    navigate('/sms', { state: { from: '/tasks/payment' } })
  }

  function confirmCancel(index: number) {
    // 카드는 결제했던 카드를 다시 태그해야 취소됩니다 (1730:197613).
    setCancelTarget(index)
    setOverlay(null)
    navigate('/card/cancel')
  }

  /** VCC 전화를 끊고 돌아오면 취소가 접수된 것으로 봅니다 (1730:197002). */
  function afterCall(index: number) {
    cancelPayment(index)
    setOverlay(null)
  }

  const asking = overlay && typeof overlay === 'object' && overlay.kind === 'ask' ? overlay : null
  const calling = overlay && typeof overlay === 'object' && overlay.kind === 'call' ? overlay : null
  const askingPayment = asking ? splitPayments[asking.index] : null
  const donePayment = done === null ? null : splitPayments[done]

  // VCC 전화는 화면 전체를 덮는 외부 앱입니다.
  if (calling) {
    return <VccCall onHangUp={() => afterCall(calling.index)} />
  }

  return (
    <div className="screen ph">
      <div className="appbar">
        <button className="appbar__back" onClick={() => navigate('/tasks')} aria-label="뒤로">
          <IcBack />
        </button>
        <p className="appbar__title t-subtitle2-16-bold">결제 내역</p>
      </div>
      <StatusBar />

      <div className="ph__summary">
        <div className="ph__summary-row">
          <span className="t-subtitle2-16-medium">총 결제 금액</span>
          <span className="t-body1-18-bold">{formatWon(ORDER.amount)}원</span>
        </div>
        <div className="ph__summary-divider" />
        <div className="ph__summary-row">
          <span className="t-subtitle2-16-medium">잔여 결제 금액</span>
          <span className="ph__remaining t-body1-18-bold">{formatWon(remainingTotal)}원</span>
        </div>
      </div>

      <div className="ph__list">
        {splitPayments.map((payment, index) => (
          <Record
            key={index}
            payment={payment}
            index={index}
            cashReceiptIssued={cashReceiptIssued}
            onCancel={(i) => setOverlay({ kind: 'ask', index: i })}
            onSendReceipt={sendReceipt}
            onIssueCashReceipt={() => setOverlay('receipt')}
            onViewReceipt={sendReceipt}
          />
        ))}
      </div>

      {askingPayment?.method === 'cash' && (
        <CashCancelDialog
          cashReceiptIssued={cashReceiptIssued}
          onClose={() => setOverlay(null)}
          onCall={() => setOverlay({ kind: 'call', index: asking!.index })}
        />
      )}

      {askingPayment && askingPayment.method !== 'cash' && (
        <CardCancelDialog
          onClose={() => setOverlay(null)}
          onConfirm={() => confirmCancel(asking!.index)}
        />
      )}

      {overlay === 'receipt' && (
        <CashReceiptSheet
          onCancel={() => setOverlay(null)}
          onConfirm={() => {
            issueCashReceipt()
            setOverlay(null)
          }}
        />
      )}

      {notice && <Snackbar text={notice} />}

      {donePayment && (
        <CancelCompleteSheet
          amount={splitPaymentAmount(donePayment)}
          label={PAYMENT_METHOD_LABEL[donePayment.method]}
          onClose={() => setDone(null)}
          onRepay={() => navigate('/delivery')}
          onSendReceipt={sendReceipt}
        />
      )}
    </div>
  )
}
