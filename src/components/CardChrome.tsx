import { useEffect } from 'react'

import { ORDER, formatWon } from '../data/order'
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

export function CardTotal() {
  return (
    <div className="card-total">
      <p className="card-total__label t-body2-16-medium">총 결제 금액</p>
      <p className="card-total__amount t-h2-28-bold">{formatWon(ORDER.amount)}원</p>
    </div>
  )
}

/*
 * 결제 진행중 (1723:157658)
 *
 * Figma의 as_circular_progress는 애니메이션 노드라서 export하면 첫 프레임(점 하나)만 나옵니다.
 * 원형 진행 표시는 아이콘이 아니라 도형이므로, 디자인과 같은 호를 SVG로 그리고 CSS로 회전시킵니다.
 * 지름 40px, 선 두께 4px, 둥근 끝, 약 90° 호.
 */
export function Spinner({
  size = 40,
  className = 'progress-dialog__spinner',
}: {
  size?: number
  className?: string
}) {
  const radius = 17
  const circumference = 2 * Math.PI * radius

  return (
    <div className={className}>
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
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

export function PaymentProgress() {
  return (
    <>
      <div className="dimmed" />
      <div className="progress-dialog" role="status" aria-live="polite">
        <Spinner />
        <p className="progress-dialog__label t-subtitle1-18-bold">결제 진행중</p>
      </div>
    </>
  )
}
