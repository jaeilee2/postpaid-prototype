import { IcCard, IcCash, IcClose, IcQr, IcSplit } from '../components/Icon'
import { PAYMENT_METHOD_LABEL, formatWon } from '../data/order'
import type { PaymentMethod, PostpaidType } from '../data/order'

/* 결제 방법 선택 (1723:157638 / 1723:158481, 문구는 1737:24157)
 * 상단 배지는 **주문의 결제 수단**입니다 — 157638은 후불현금, 158481은 후불카드 주문.
 * 아래에서 어떤 방법으로 받든 이 배지는 바뀌지 않습니다.
 */

const METHODS: { key: PaymentMethod; icon: React.ReactNode; wide: boolean }[] = [
  { key: 'cash', icon: <IcCash />, wide: true },
  { key: 'card', icon: <IcCard />, wide: true },
  { key: 'qr', icon: <IcQr />, wide: false },
  { key: 'split', icon: <IcSplit />, wide: false },
]

export function PaymentMethodSheet({
  total,
  postpaid,
  onSelect,
  onClose,
}: {
  total: number
  /** 주문의 결제 수단 — 배지에 그대로 나옵니다 */
  postpaid: PostpaidType
  onSelect: (method: PaymentMethod) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="dimmed" onClick={onClose} />
      <div className="sheet pm__sheet">
        <div className="sheet__header pm__header">
          <span className="t-subtitle1-18-bold">어떻게 결제하시겠어요?</span>
          <button className="sheet__close" onClick={onClose} aria-label="닫기">
            <IcClose />
          </button>
        </div>

        <p className="pm__total-label t-body2-16-medium" style={{ margin: '12px 0 0' }}>
          총 결제 금액
        </p>

        <div className="pm__amount">
          <span className="t-h1-32-bold">{formatWon(total)}원</span>
          {/* 후불현금은 badge_2(teal), 후불카드는 badge_3(magenta) — 디자인에 있는 두 색입니다. */}
          <span className={`badge badge--sm t-caption2-10-bold badge--${postpaid}`}>
            {PAYMENT_METHOD_LABEL[postpaid]}
          </span>
        </div>

        <div className="pm__buttons">
          {METHODS.map(({ key, icon, wide }) => (
            <button
              key={key}
              className={`btn-tertiary btn--h56 ${wide ? 'pm__btn--full' : 'pm__btn--half'}`}
              onClick={() => onSelect(key)}
            >
              <span className="pm__btn-inner">
                {icon}
                <span className="t-body2-16-medium">{PAYMENT_METHOD_LABEL[key]}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
