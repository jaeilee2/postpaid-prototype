import { IcClose } from '../components/Icon'
import { PAYMENT_METHOD_LABEL, formatWon, splitPaymentAmount } from '../data/order'
import type { SplitPayment } from '../data/order'

/* 영수증 발송 시트 (1730:198565)
 *
 * 분할 결제는 여러 건으로 나뉘므로 전체 내역과 건별 영수증을 따로 보낼 수 있습니다.
 * 시트 높이 321, 좌표는 시트 기준입니다.
 */

export function ReceiptSendSheet({
  payments,
  onSend,
  onClose,
}: {
  payments: SplitPayment[]
  /** 어떤 영수증인지 — null이면 전체 결제 내역 */
  onSend: (payment: SplitPayment | null) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="dimmed dimmed--top" onClick={onClose} />
      <div className="sheet rs__sheet">
        <div className="sheet__header rs__header">
          <span className="t-subtitle1-18-bold">영수증 발송</span>
          <button className="sheet__close" onClick={onClose} aria-label="닫기">
            <IcClose />
          </button>
        </div>

        <div className="rs__row">
          <span className="t-body3-14-medium">전체 결제 내역</span>
          <button className="btn-secondary rs__send t-body4-13-medium" onClick={() => onSend(null)}>
            발송
          </button>
        </div>

        <div className="rs__divider" />

        <div className="rs__list">
          {payments.map((payment, index) => (
            <div className="rs__row" key={index}>
              <span className="t-body2-16-medium">
                {formatWon(splitPaymentAmount(payment))}원 {PAYMENT_METHOD_LABEL[payment.method]}{' '}
                결제
              </span>
              <button
                className="btn-outline rs__send t-body4-13-medium"
                onClick={() => onSend(payment)}
              >
                발송
              </button>
            </div>
          ))}
        </div>

        <div className="rs__action">
          <button className="btn-tertiary btn--h48 t-body2-16-medium" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </>
  )
}
