import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import signHand from '../assets/sign-hand.svg'
import signStroke from '../assets/sign-stroke.svg'
import { AppBar, PaymentProgress, useCardAmount, usePaymentSettle } from '../components/CardChrome'
import { IcDropdown, IcEmojiHappy, IcRefresh } from '../components/Icon'
import { formatWon } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { InstallmentSheet } from './InstallmentSheet'

/* 서명 등록 (1730:197571 빈 상태 / 1730:197573 서명 후 / 1730:197143 할부 시트)
 *
 * 5만원 이상 카드로 결제할 때 고객에게 폰을 넘겨 서명을 받는 화면입니다.
 * 등록하면 결제 진행중을 거쳐 완료로 넘어갑니다.
 *
 * 서명은 손가락·마우스로 실제로 그립니다 — Pointer Events로 좌표를 모아 SVG path로 그립니다.
 * canvas 대신 SVG를 쓰면 프레임이 확대돼도 선이 흐려지지 않고, 되돌리기도 간단합니다.
 */

/** 서명란 크기 (디자인 좌표) */
const PAD = { width: 320, height: 280 }

type Stroke = { x: number; y: number }[]

function strokePath(stroke: Stroke) {
  return stroke.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ')
}

export function SignatureScreen() {
  const navigate = useNavigate()
  const amount = useCardAmount()
  const settle = usePaymentSettle('card')
  const { installment, setSignature } = useOrder()

  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [drawing, setDrawing] = useState<Stroke | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [paying, setPaying] = useState(false)
  const padRef = useRef<HTMLDivElement>(null)
  /** 지금 그리는 중인 선 — 상태 갱신이 몰려도 점이 빠지지 않게 ref로 들고 있습니다. */
  const strokeRef = useRef<Stroke | null>(null)

  const signed = strokes.length > 0
  const all = drawing ? [...strokes, drawing] : strokes

  /** 화면이 확대돼 있어도 서명란 안의 좌표로 바꿔줍니다. */
  function pointAt(event: React.PointerEvent) {
    const box = padRef.current?.getBoundingClientRect()
    if (!box) return { x: 0, y: 0 }
    return {
      x: ((event.clientX - box.left) / box.width) * PAD.width,
      y: ((event.clientY - box.top) / box.height) * PAD.height,
    }
  }

  function register() {
    // 그린 서명을 그대로 들고 갑니다 — 완료 화면·영수증에서 쓸 수 있게.
    setSignature(all.map(strokePath).join(' '))
    setPaying(true)
    window.setTimeout(settle, 1500)
  }

  return (
    <div className="screen sign">
      <AppBar title="서명 등록" onBack={() => navigate(-1)} actionLabel={null} />

      {/* 고객에게 폰을 넘기는 화면이라 안내가 맨 위에 붙습니다 */}
      <div className="sign__notice">
        <IcEmojiHappy />
        <div className="sign__notice-text">
          <p className="sign__notice-title t-body2-16-bold">고객님이 보는 화면이에요</p>
          <p className="sign__notice-sub t-body3-14-regular">
            5만원 이상 결제할 때 서명을 등록해야 해요
          </p>
        </div>
      </div>

      <div className="sign__price">
        <p className="sign__price-label t-body2-16-medium">총 결제 금액</p>
        <p className="sign__price-amount t-h2-28-bold">{formatWon(amount)}원</p>
      </div>

      <p className="sign__label t-body4-13-medium">할부</p>
      <button className="sign__dropdown t-body2-16-regular" onClick={() => setSheetOpen(true)}>
        <span className="sign__dropdown-value">{installment}</span>
        <IcDropdown />
      </button>

      <div
        className="sign__pad"
        ref={padRef}
        onPointerDown={(event) => {
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            /* 마우스로 그릴 때 캡처가 안 되는 브라우저가 있습니다 — 없어도 그려집니다. */
          }
          const start = [pointAt(event)]
          strokeRef.current = start
          setDrawing(start)
        }}
        onPointerMove={(event) => {
          // 좌표는 ref에 모읍니다 — 이벤트가 한 번에 몰려 들어와도 점이 빠지지 않습니다.
          if (!strokeRef.current) return
          const next = [...strokeRef.current, pointAt(event)]
          strokeRef.current = next
          setDrawing(next)
        }}
        onPointerUp={() => {
          const stroke = strokeRef.current
          strokeRef.current = null
          setDrawing(null)
          // 점 하나만 찍힌 건 서명으로 보지 않습니다.
          if (stroke && stroke.length > 1) setStrokes((current) => [...current, stroke])
        }}
        onPointerCancel={() => {
          strokeRef.current = null
          setDrawing(null)
        }}
      >
        <p className="sign__pad-placeholder t-body2-16-regular">여기에 서명해주세요</p>

        {/* 빈 상태에는 서명해 달라는 일러스트가 있습니다 (Lottie sign-here-gesture의 첫 프레임) */}
        {!signed && !drawing && (
          <span className="sign__guide" aria-hidden="true">
            <img className="sign__guide-stroke" src={signStroke} alt="" />
            <img className="sign__guide-hand" src={signHand} alt="" />
          </span>
        )}

        <svg
          className="sign__ink"
          viewBox={`0 0 ${PAD.width} ${PAD.height}`}
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          {all.map((stroke, index) => (
            <path
              key={index}
              d={strokePath(stroke)}
              fill="none"
              stroke="#121417"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {/* 다시 그리기 (1730:197573) */}
        {signed && (
          <button
            className="sign__reset btn-outline"
            onClick={() => setStrokes([])}
            aria-label="서명 다시 하기"
          >
            <IcRefresh />
          </button>
        )}
      </div>

      <div className="sign__action">
        <button
          className="btn-primary btn--h56 t-body2-16-medium"
          disabled={!signed}
          onClick={register}
        >
          등록하기
        </button>
      </div>

      {sheetOpen && <InstallmentSheet onClose={() => setSheetOpen(false)} />}
      {paying && <PaymentProgress />}
    </div>
  )
}
