import { IcCard, IcCash, IcClose, IcQr, IcSplit } from '../components/Icon'
import { PAYMENT_METHOD_LABEL, formatWon } from '../data/order'
import type { PaymentMethod } from '../data/order'

/* 결제 방법 선택 (1723:157638 / 1723:158481, 문구는 1737:24157)
 * 상단 배지는 "현재 선택된 결제 방법"입니다 — 157638은 현금, 158481은 카드 상태.
 */

const METHODS: { key: PaymentMethod; icon: React.ReactNode; wide: boolean }[] = [
  { key: 'cash', icon: <IcCash />, wide: true },
  { key: 'card', icon: <IcCard />, wide: true },
  { key: 'qr', icon: <IcQr />, wide: false },
  { key: 'split', icon: <IcSplit />, wide: false },
]

export function PaymentMethodSheet({
  total,
  method,
  onSelect,
  onClose,
}: {
  total: number
  method: PaymentMethod
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
          {/* 현금은 badge_2(teal), 그 외는 badge_3(magenta) — 디자인에 있는 두 색입니다. */}
          <span
            className={`badge badge--sm t-caption2-10-bold ${
              method === 'cash' ? 'badge--cash' : 'badge--card'
            }`}
          >
            {PAYMENT_METHOD_LABEL[method]}
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
