import { useState } from 'react'

import { IcCard, IcCash, IcClose, IcQr } from '../components/Icon'
import { SPLIT, formatWon, splitProgress } from '../data/order'
import type { SplitPayment } from '../data/order'
import { useOrder } from '../state/OrderContext'

/* 분할 결제 시트
 *   1730:197705  입력 전 (플레이스홀더 "입력하세요", 결제 버튼 3개 비활성)
 *   1730:195938  상품가액에 0 입력
 *   1730:195946  잔여 금액보다 크게 입력 → 빨간 테두리 + 안내
 *   1730:195840  유효한 금액 입력 → 결제 버튼 활성
 *   1730:196227  상품가액을 다 받은 뒤 (필드 비활성, 컵 보증금만 남음)
 */

/** "60,000" 처럼 콤마가 들어간 문자열에서 숫자만 뽑습니다. */
function toNumber(text: string) {
  const digits = text.replace(/[^\d]/g, '')
  return digits === '' ? null : Number(digits)
}

export function SplitPaymentSheet({
  onClose,
  onPay,
}: {
  onClose: () => void
  onPay: (method: SplitPayment['method'], part: Omit<SplitPayment, 'method'>) => void
}) {
  const { splitPayments } = useOrder()
  const { remainingProduct, remainingCup } = splitProgress(splitPayments)

  const [productText, setProductText] = useState('')
  const [cup, setCup] = useState(0)

  const product = toNumber(productText) ?? 0
  const productOverflow = product > remainingProduct
  const amount = product + cup
  const canPay = amount > 0 && !productOverflow
  // 상품가액을 다 받으면 필드가 비활성되고 컵 보증금만 남습니다 (1730:196227).
  const productDone = remainingProduct === 0

  function handleProductChange(value: string) {
    const next = toNumber(value)
    setProductText(next === null ? '' : formatWon(next))
  }

  return (
    <>
      <div className="dimmed" onClick={onClose} />
      <div className="sheet sp__sheet">
        <div className="sheet__header sp__header">
          <span className="t-subtitle1-18-bold">분할 결제</span>
          <button className="sheet__close" onClick={onClose} aria-label="닫기">
            <IcClose />
          </button>
        </div>

        {/* 디자인은 프레임마다 60,900 / 60,000으로 갈리는데, 라벨 뜻대로 주문 총액을 보여줍니다. */}
        <p className="sp__total-label t-body2-16-medium">총 결제 금액</p>
        <p className="sp__total-amount t-h2-28-bold">
          {formatWon(SPLIT.productAmount + SPLIT.cupDeposit)}원
        </p>

        <div className="sp__summary">
          <div className="sp__summary-row">
            <span className="sp__summary-label t-body3-14-regular">잔여 상품가액</span>
            <span className="sp__summary-value t-body2-16-bold">
              {formatWon(remainingProduct)}
              <span className="unit">원</span>
            </span>
          </div>
          <div className="sp__summary-row">
            <span className="sp__summary-label t-body3-14-regular">잔여 컵 보증금</span>
            <span className="sp__summary-value t-body2-16-bold">
              {formatWon(remainingCup)}
              <span className="unit">원</span>
            </span>
          </div>
        </div>

        <div className="sp__divider" />

        {/* 상품가액 */}
        <p className="sp__field-label sp__field-label--product t-body2-16-regular">상품가액</p>
        <div
          className={`sp__field ${productOverflow ? 'sp__field--error' : ''} ${
            productDone ? 'sp__field--disabled' : ''
          }`}
        >
          <input
            className="sp__input t-body2-16-regular"
            inputMode="numeric"
            placeholder="입력하세요"
            value={productDone ? '0' : productText}
            disabled={productDone}
            onChange={(event) => handleProductChange(event.target.value)}
          />
          {productOverflow && (
            <button className="sp__clear" onClick={() => setProductText('')} aria-label="지우기">
              <IcClose />
            </button>
          )}
        </div>
        <span className="sp__unit sp__unit--product t-body2-16-medium">원</span>
        {productOverflow && (
          <p className="sp__error t-caption1-12-medium">잔여 상품가액 보다 작게 입력하세요</p>
        )}

        {/* 컵 보증금 */}
        <p className="sp__field-label sp__field-label--cup t-body2-16-regular">컵 보증금</p>
        <button
          className="sp__step sp__step--minus"
          disabled={cup === 0}
          onClick={() => setCup(Math.max(0, cup - SPLIT.cupStep))}
          aria-label="컵 보증금 줄이기"
        >
          <span className="sp__step-glyph sp__step-glyph--minus" />
        </button>
        <span className="sp__cup-value t-body1-18-regular">{formatWon(cup)}</span>
        <button
          className="sp__step sp__step--plus"
          disabled={cup + SPLIT.cupStep > remainingCup}
          onClick={() => setCup(Math.min(remainingCup, cup + SPLIT.cupStep))}
          aria-label="컵 보증금 늘리기"
        >
          <span className="sp__step-glyph sp__step-glyph--plus" />
        </button>
        <span className="sp__unit sp__unit--cup t-body2-16-medium">원</span>

        <div className="sp__buttons">
          <button
            className="btn-tertiary sp__btn sp__btn--qr"
            disabled={!canPay}
            onClick={() => onPay('qr', { product, cup })}
            aria-label="QR 간편 결제"
          >
            <IcQr />
          </button>
          <button
            className="btn-tertiary sp__btn t-body2-16-medium"
            disabled={!canPay}
            onClick={() => onPay('cash', { product, cup })}
          >
            <IcCash />
            현금
          </button>
          <button
            className="btn-tertiary sp__btn t-body2-16-medium"
            disabled={!canPay}
            onClick={() => onPay('card', { product, cup })}
          >
            <IcCard />
            카드
          </button>
        </div>
      </div>
    </>
  )
}
