import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OrderToggle, StatusBar } from '../components/Chrome'
import {
  IcBack,
  IcCall,
  IcCard,
  IcChevronRight,
  IcCashReceipt,
  IcSms,
  IcWarning,
} from '../components/Icon'
import { ORDER, formatWon, splitProgress } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { usePaymentFlow } from './usePaymentFlow'

/* 수행목록 (1730:196848)
 *
 * 배달지 상세의 `수행목록` FAB(1765:130135)을 누르면 나옵니다.
 * 픽업·배달 지점이 순서대로 쌓여 있고, 지금 수행 중인 배달만 펼쳐져 있습니다.
 * 펼쳐진 항목의 `결제내역`으로 들어가 결제를 취소할 수 있습니다.
 *
 * 잔여 금액이 있으면(취소했거나 분할 중) 노란 안내 박스에 `결제내역` `결제하기`가 함께
 * 들어갑니다 (1730:196061). `결제하기`는 배달지 상세와 같은 결제 방법 시트를 띄웁니다.
 *
 * 목록의 다른 지점들은 화면을 채우기 위한 목업입니다 — 디자인에 있는 그대로 두고 접힌 상태입니다.
 */

type Stop = {
  kind: '픽업' | '배달'
  title: string
  sub: string
  /** 완료된 지점은 회색으로 흐려집니다 */
  done?: boolean
  /** 준비완료는 초록색 핀입니다 */
  ready?: boolean
}

const STOPS: Stop[] = [
  { kind: '픽업', title: ORDER.store, sub: '', done: true },
  { kind: '픽업', title: ORDER.store, sub: '준비완료', ready: true },
  { kind: '픽업', title: ORDER.store, sub: '10분 후 픽업' },
  { kind: '배달', title: ORDER.address, sub: `${ORDER.store} 고객` },
  { kind: '픽업', title: ORDER.store, sub: '25분 후 픽업' },
  { kind: '배달', title: ORDER.address, sub: `${ORDER.store} 고객` },
]

/**
 * 지점 핀. 디자인에서는 이미지가 아니라 도형(둥근 사각형 + 꼬리)에 글자가 들어간 형태라
 * CSS로 그렸습니다 — 픽업/배달 두 글자가 실제 텍스트여야 폰트도 함께 맞습니다.
 */
function Pin({ kind, done, ready }: { kind: Stop['kind']; done?: boolean; ready?: boolean }) {
  const tone = done ? 'done' : ready ? 'ready' : kind === '배달' ? 'delivery' : 'pickup'
  return <span className={`tl__pin tl__pin--${tone} t-caption1-12-medium`}>{kind}</span>
}

function CollapsedStop({ stop }: { stop: Stop }) {
  return (
    <div className={`tl__row ${stop.done ? 'tl__row--done' : ''}`}>
      <Pin kind={stop.kind} done={stop.done} ready={stop.ready} />
      <div className="tl__row-text">
        <p className="tl__row-title t-body2-16-bold">{stop.title}</p>
        {stop.sub && (
          <p className={`tl__row-sub t-body4-13-regular ${stop.ready ? 'tl__row-sub--ready' : ''}`}>
            {stop.sub}
          </p>
        )}
      </div>
      <span className="tl__chevron tl__chevron--down">
        <IcChevronRight />
      </span>
    </div>
  )
}

export function TaskList() {
  const navigate = useNavigate()
  const { method, splitPayments } = useOrder()
  const { payRemaining, overlays } = usePaymentFlow()
  const [expanded, setExpanded] = useState(true)

  const { remainingTotal } = splitProgress(splitPayments)
  const paid = remainingTotal === 0
  /*
   * 뒤로가기는 들어온 지도 화면으로 돌아갑니다.
   * 결제를 다 받은 뒤에는 메인 지도에서(완료 → 확인) 들어오고,
   * 그 전에는 배달지 상세에서 들어옵니다. history를 되짚지 않고 상태로 판단합니다 —
   * 결제 내역을 거쳐 오면 history가 엉켜서 결제 내역으로 돌아가버립니다.
   */
  const mapScreen = paid && splitPayments.length > 0 ? '/main' : '/delivery'
  /*
   * 디자인(1730:196848)은 후불카드 예시입니다. 배지는 실제로 받은 수단을 따라갑니다 —
   * 카드·QR이 한 건이라도 섞이면 후불카드, 전부 현금이면 후불현금.
   */
  const byCard = splitPayments.some((p) => !p.cancelledAt && p.method !== 'cash')
  const badge = byCard || method === 'card' || method === 'qr' ? '후불카드' : '후불현금'

  return (
    <div className="screen tl">
      <div className="appbar">
        <button className="appbar__back" onClick={() => navigate(mapScreen)} aria-label="뒤로">
          <IcBack />
        </button>
        <p className="appbar__title t-subtitle2-16-bold">수행목록</p>
        <button className="appbar__action t-body3-14-medium">VCC 연결</button>
      </div>
      <StatusBar />

      <div className="tl__scroll">
        <CollapsedStop stop={STOPS[0]} />

        {/* 지금 수행 중인 배달 — 펼쳐진 상태 (Orderlist, 332px) */}
        <div className={`tl__order ${expanded ? '' : 'tl__order--collapsed'}`}>
          <button className="tl__order-head" onClick={() => setExpanded(!expanded)}>
            <Pin kind="배달" />
            <div className="tl__row-text">
              <p className="tl__row-title t-h4-20-bold">{ORDER.address}</p>
              <p className="tl__row-sub t-body4-13-regular">{ORDER.store} 고객</p>
            </div>
            <span className={`tl__chevron tl__chevron--${expanded ? 'up' : 'down'}`}>
              <IcChevronRight />
            </span>
          </button>

          {expanded && (
            <div className="tl__order-body">
              <div className="tl__address t-body2-16-regular">
                {ORDER.addressDetail.map((line) => (
                  <p key={line} style={{ margin: 0 }}>
                    {line}
                  </p>
                ))}
              </div>

              <div className="tl__meta t-body4-13-regular">
                <p style={{ margin: 0 }}>
                  <span className="tl__meta-label">상품번호</span>
                  {ORDER.pickupNumber}
                </p>
                <p style={{ margin: 0 }}>
                  <span className="tl__meta-label">부릉번호</span>
                  {ORDER.orderNumber}
                </p>
              </div>

              <div className={`tl__pay ${paid ? '' : 'tl__pay--unpaid'}`}>
                {/* 다 받았으면 `58,500원 결제완료`, 남았으면 `결제필요금액 58,500원` (1730:196061) */}
                <span className="t-body2-16-bold">
                  {paid ? `${formatWon(ORDER.amount)}원 결제완료` : '결제필요금액'}
                </span>
                {!paid && <span className="t-body2-16-bold">{formatWon(ORDER.amount)}원</span>}
                <span
                  className={`badge badge--md ${
                    badge === '후불현금' ? 'badge--cash' : 'badge--card'
                  } t-caption1-12-bold`}
                >
                  {badge}
                </span>
              </div>

              <div className="tl__buttons">
                <button className="btn-outline btn--h38 t-body3-14-medium">
                  <IcCall />
                  고객 전화
                </button>
                <button className="btn-outline btn--h38 t-body3-14-medium">
                  <IcSms />
                  문자 전송
                </button>
              </div>
              {/* 잔여 금액이 있으면 안내 박스 안에 결제내역·결제하기가 함께 들어갑니다 (1730:196061) */}
              {paid ? (
                <div className="tl__buttons">
                  <button
                    className="btn-outline btn--h38 t-body3-14-medium"
                    onClick={() => navigate('/tasks/payment')}
                  >
                    <IcCashReceipt />
                    결제내역
                  </button>
                </div>
              ) : (
                <div className="tl__remaining">
                  <p className="tl__remaining-label t-body2-16-bold">
                    <IcWarning />
                    잔여 결제 금액:{' '}
                    <span className="tl__remaining-amount">{formatWon(remainingTotal)}원</span>
                  </p>
                  <div className="tl__buttons">
                    <button
                      className="btn-outline btn--h38 t-body3-14-medium"
                      onClick={() => navigate('/tasks/payment')}
                    >
                      <IcCashReceipt />
                      결제내역
                    </button>
                    {/* 배달지 상세의 CTA와 같은 판단을 합니다 — 분할 중이면 분할 시트, 아니면 방법 시트 */}
                    <button className="btn-outline btn--h38 t-body3-14-medium" onClick={payRemaining}>
                      <IcCard />
                      결제하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {STOPS.slice(1).map((stop, index) => (
          <CollapsedStop stop={stop} key={index} />
        ))}
      </div>

      {/* 하단 바 — 오더 받기 스위치 */}
      <div className="tl__bottom">
        <OrderToggle />
        <span className="t-body3-14-medium">오더 받기</span>
      </div>

      {overlays}
    </div>
  )
}
