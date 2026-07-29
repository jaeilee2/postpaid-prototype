import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { StatusBar } from '../components/Chrome'
import { ORDER, formatWon } from '../data/order'

/*
 * OS 기본 문자 앱 — 영수증 발송을 위해 부릉플러스에서 넘어온 화면입니다.
 *
 * 이 화면은 Figma 디자인에 없습니다. 부릉플러스 앱이 아니라 단말의 문자 앱이므로
 * 일부러 부릉플러스 디자인시스템을 쓰지 않고 OS 기본 앱처럼 보이게 했습니다.
 * 수신번호는 고객 안심번호(050)입니다.
 */

const MESSAGE = '[부릉플러스] 요청하신 결제 영수증을 보내드립니다.'

/** 문자에 첨부되는 영수증 이미지 (실제 이미지 대신 같은 내용을 렌더링합니다) */
function ReceiptThumbnail() {
  return (
    <div className="receipt">
      <p className="receipt__store">{ORDER.store}</p>
      <p className="receipt__date">{ORDER.paidAt}</p>
      <div className="receipt__rule" />
      <div className="receipt__row">
        <span>현금 결제</span>
        <span>{formatWon(ORDER.amount)}원</span>
      </div>
      <div className="receipt__row">
        <span>배송료</span>
        <span>{formatWon(ORDER.deliveryFee)}원</span>
      </div>
      <div className="receipt__rule" />
      <div className="receipt__row receipt__row--total">
        <span>합계</span>
        <span>{formatWon(ORDER.amount + ORDER.deliveryFee)}원</span>
      </div>
      <p className="receipt__pickup">픽업번호 {ORDER.pickupNumber}</p>
    </div>
  )
}

export function SmsApp() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sending, setSending] = useState(false)

  /* 완료 화면에서도, 결제 내역에서도 넘어오므로 온 곳으로 돌아갑니다. */
  const from = (location.state as { from?: string } | null)?.from ?? '/complete'

  function backToApp(notice?: string) {
    navigate(from, { state: notice ? { notice } : undefined })
  }

  function handleSend() {
    setSending(true)
    // 전송 후 부릉플러스 앱으로 자동 복귀합니다.
    window.setTimeout(() => backToApp('영수증을 발송했어요'), 700)
  }

  return (
    <div className="screen sms">
      <StatusBar />

      <div className="sms__appbar">
        <button className="sms__back" onClick={() => backToApp()} aria-label="부릉플러스로 돌아가기">
          ←
        </button>
        <span className="sms__appbar-title">새 메시지</span>
        <span className="sms__appbar-app">문자</span>
      </div>

      <div className="sms__recipient">
        <span className="sms__recipient-label">받는 사람</span>
        <span className="sms__recipient-number">{ORDER.safeNumber}</span>
        <span className="sms__chip">안심번호</span>
      </div>

      <div className="sms__thread">
        <div className="sms__bubble">
          <ReceiptThumbnail />
          <p className="sms__bubble-text">{MESSAGE}</p>
          <span className="sms__bubble-meta">{sending ? '전송 중…' : '전송 대기'}</span>
        </div>
      </div>

      <div className="sms__compose">
        <span className="sms__attachment">영수증.jpg 첨부됨</span>
        <button className="sms__send" onClick={handleSend} disabled={sending}>
          {sending ? '전송 중' : '전송'}
        </button>
      </div>
    </div>
  )
}
