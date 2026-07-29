import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ORDER,
  PAYMENT_METHOD_LABEL,
  PAYMENT_TIME,
  SIGNATURE_THRESHOLD,
  SPLIT,
  formatWon,
  splitPaymentAmount,
  splitProgress,
} from '../data/order'
import type { SplitPayment } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { StatusBar } from './Chrome'
import { IcBack } from './Icon'

/* 카드 결제 화면들이 공유하는 조각들 (1723:157653 · 157655 · 157658) */

/**
 * 카드 결제 화면에 들어왔다면 결제 방법은 카드입니다.
 * 링크로 이 화면에 바로 들어온 경우에도 완료 화면 문구가 어긋나지 않게 맞춰줍니다.
 */
export function useEnsureCardMethod() {
  const { method, setMethod } = useOrder()

  useEffect(() => {
    // 분할 결제의 한 회차로 들어온 경우에는 결제 방법이 '분할'로 남아야 합니다.
    if (method === 'split') return
    if (method !== 'card') setMethod('card')
  }, [method, setMethod])
}

/** 상단 앱바 — 제목은 왼쪽 정렬(x=66)이고, 오른쪽에 보조 액션이 있습니다. */
export function AppBar({
  title,
  onBack,
  onAction,
  actionLabel = '카드 리더기로 결제',
}: {
  title: string
  onBack: () => void
  onAction?: () => void
  /** 오른쪽 텍스트 버튼. 없으면(null) 앱바에 제목만 남습니다 (QR 간편 결제 화면). */
  actionLabel?: string | null
}) {
  return (
    <>
      <div className="appbar">
        <button className="appbar__back" onClick={onBack} aria-label="뒤로">
          <IcBack />
        </button>
        <p className="appbar__title t-subtitle2-16-bold">{title}</p>
        {actionLabel && (
          <button className="appbar__action t-body3-14-medium" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
      <StatusBar />
    </>
  )
}

/** 분할 결제의 한 회차로 들어왔으면 그 금액을, 아니면 주문 총액을 보여줍니다. */
export function useCardAmount() {
  const { pendingSplit } = useOrder()
  return pendingSplit ? pendingSplit.product + pendingSplit.cup : ORDER.amount
}

/**
 * 총 결제 금액. 카드 결제 취소로 들어오면 라벨과 색이 바뀝니다 (1730:197613).
 */
export function CardTotal({ cancel = false }: { cancel?: boolean }) {
  const amount = useCardAmount()

  return (
    <div className="card-total">
      <p className="card-total__label t-body2-16-medium">
        {cancel ? '취소할 금액' : '총 결제 금액'}
      </p>
      <p className={`card-total__amount t-h2-28-bold ${cancel ? 'card-total__amount--cancel' : ''}`}>
        {formatWon(amount)}원
      </p>
    </div>
  )
}

/**
 * 5만원 이상 카드 결제는 서명을 먼저 받습니다 (1730:197571).
 * **결제할 때마다** 받습니다 — 한 번 받은 서명을 재사용하지 않습니다.
 */
export function useNeedsSignature() {
  return useCardAmount() >= SIGNATURE_THRESHOLD
}

/**
 * 결제가 끝난 뒤 어디로 갈지 결정합니다.
 * 분할 결제의 한 회차였다면 그 금액만, 아니면 주문 전액을 결제 내역에 기록합니다.
 * 남은 금액이 있으면 배달지 상세로 돌아가 토스트를 띄웁니다.
 */
export function usePaymentSettle(payMethod: SplitPayment['method']) {
  const navigate = useNavigate()
  const { pendingSplit, splitPayments, addSplitPayment, installment } = useOrder()

  return function settle() {
    const part = pendingSplit ?? { product: SPLIT.productAmount, cup: SPLIT.cupDeposit }
    const payment: SplitPayment = {
      method: payMethod,
      ...part,
      paidAt: PAYMENT_TIME.paid,
      ...(payMethod === 'card' ? { installment } : {}),
    }
    addSplitPayment(payment)
    if (splitProgress([...splitPayments, payment]).done) {
      navigate('/complete')
      return
    }
    navigate('/delivery', {
      replace: true,
      state: {
        splitToast: [
          `${PAYMENT_METHOD_LABEL[payMethod]} ${formatWon(splitPaymentAmount(payment))}원이 결제되었어요`,
          '전체 결제 후 영수증 발송이 가능해요',
        ],
      },
    })
  }
}

/*
 * 결제 진행중 (1723:157658)
 *
 * Figma의 as_circular_progress는 애니메이션 노드라서 export하면 첫 프레임(점 하나)만 나옵니다.
 * 원형 진행 표시는 아이콘이 아니라 도형이므로, 디자인과 같은 호를 SVG로 그리고 CSS로 회전시킵니다.
 * 지름 40px, 선 두께 4px, 둥근 끝, 약 90° 호.
 */
function Spinner() {
  const radius = 17
  const circumference = 2 * Math.PI * radius

  return (
    <div className="progress-dialog__spinner">
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="var(--vds-primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${circumference / 4} ${circumference}`}
        />
      </svg>
    </div>
  )
}

export function PaymentProgress({ label = '결제 진행중' }: { label?: string }) {
  return (
    <>
      <div className="dimmed" />
      <div className="progress-dialog" role="status" aria-live="polite">
        <Spinner />
        <p className="progress-dialog__label t-subtitle1-18-bold">{label}</p>
      </div>
    </>
  )
}
