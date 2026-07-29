import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import check from '../assets/check.png'
import { StatusBar } from '../components/Chrome'
import { IcBack, IcCardCancel, IcSms } from '../components/Icon'
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

/* 결제 내역 (1730:196892 결제 후 / 1730:198254 취소 후)
 *
 * 수행목록의 `결제내역`으로 들어옵니다. 결제 한 건씩 카드로 쌓이고, 카드 결제는 여기서 취소합니다.
 * 취소하면 기록이 지워지지 않고 취소일시가 붙으면서 금액에 취소선이 그어집니다.
 */

/** 결제 한 건 (1730:196901 — 결제 188px / 취소 212px) */
function Record({
  payment,
  index,
  onCancel,
}: {
  payment: SplitPayment
  index: number
  onCancel: (index: number) => void
}) {
  const cancelled = !!payment.cancelledAt
  const label = PAYMENT_METHOD_LABEL[payment.method]

  return (
    <div className={`ph__record ${cancelled ? 'ph__record--cancelled' : ''}`}>
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
        {payment.method === 'card' && (
          <>
            <div className="ph__row">
              <dt className="t-body3-14-regular">카드종류</dt>
              <dd className="t-body4-13-regular">{CARD_APPROVAL.type}</dd>
            </div>
            <div className="ph__row">
              <dt className="t-body3-14-regular">카드번호</dt>
              <dd className="t-caption1-12-regular">{CARD_APPROVAL.number}</dd>
            </div>
          </>
        )}
        <div className="ph__row">
          <dt className="t-body3-14-regular">승인번호</dt>
          <dd className="t-caption1-12-regular">{CARD_APPROVAL.approval}</dd>
        </div>
      </dl>

      <div className="ph__buttons">
        {!cancelled && (
          <button className="btn-outline btn--h38 t-body3-14-medium" onClick={() => onCancel(index)}>
            <IcCardCancel />
            {label} 결제 취소
          </button>
        )}
        <button className="btn-outline btn--h38 t-body3-14-medium">
          <IcSms />
          영수증 발송
        </button>
      </div>
    </div>
  )
}

/** 결제 취소 확인 (1730:197134) */
function CancelDialog({
  label,
  onClose,
  onConfirm,
}: {
  label: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <div className="dimmed" onClick={onClose} />
      <div className="dialog" role="alertdialog">
        <p className="dialog__title t-subtitle1-18-bold" style={{ margin: 0 }}>
          {label} 결제 취소
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
          {label} 결제 취소
        </button>
      </div>
    </>
  )
}

/** 결제 취소 완료 시트 (1730:197701) — 시트 높이 388 */
function CancelCompleteSheet({
  amount,
  label,
  onClose,
  onRepay,
}: {
  amount: number
  label: string
  onClose: () => void
  onRepay: () => void
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

        <button className="cc__receipt btn-outline btn--h48 t-body2-16-medium">
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

export function PaymentHistory() {
  const navigate = useNavigate()
  const location = useLocation()
  const { splitPayments, cancelPayment } = useOrder()
  const [asking, setAsking] = useState<number | null>(null)
  /** 취소가 끝나면 완료 시트를 띄웁니다 — 카드 취소 화면에서 돌아올 때도 여기로 옵니다. */
  const [done, setDone] = useState<number | null>(null)

  const { remainingTotal } = splitProgress(splitPayments)

  // 카드 취소 화면(/card/cancel)에서 태그를 마치면 이 화면으로 돌아와 완료 시트를 띄웁니다.
  const cancelled = (location.state as { cancelled?: number } | null)?.cancelled
  useEffect(() => {
    if (cancelled === undefined) return
    setDone(cancelled)
    navigate('/tasks/payment', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelled])

  function startCancel(index: number) {
    setAsking(null)
    // 카드는 결제했던 카드를 다시 태그해야 취소됩니다 (1730:197613).
    if (splitPayments[index].method === 'card') {
      navigate('/card/cancel', { state: { index } })
      return
    }
    // 현금·QR은 태그할 카드가 없어 바로 취소합니다 (디자인에 화면이 없습니다).
    cancelPayment(index)
    setDone(index)
  }

  const askingPayment = asking === null ? null : splitPayments[asking]
  const donePayment = done === null ? null : splitPayments[done]

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
          <Record key={index} payment={payment} index={index} onCancel={setAsking} />
        ))}
      </div>

      {askingPayment && (
        <CancelDialog
          label={PAYMENT_METHOD_LABEL[askingPayment.method]}
          onClose={() => setAsking(null)}
          onConfirm={() => startCancel(asking!)}
        />
      )}

      {donePayment && (
        <CancelCompleteSheet
          amount={splitPaymentAmount(donePayment)}
          label={PAYMENT_METHOD_LABEL[donePayment.method]}
          onClose={() => setDone(null)}
          onRepay={() => navigate('/delivery')}
        />
      )}
    </div>
  )
}
