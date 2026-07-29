import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { CardKeyin } from './screens/CardKeyin'
import { CardNfc } from './screens/CardNfc'
import { CardScan } from './screens/CardScan'
import { Complete } from './screens/Complete'
import { DeliveryDetail } from './screens/DeliveryDetail'
import { MainMap } from './screens/MainMap'
import { QrScan } from './screens/QrScan'
import { SmsApp } from './screens/SmsApp'
import { useImmersive } from './hooks/useImmersive'
import { OrderProvider, useOrder } from './state/OrderContext'

const SCREEN_NAMES: Record<string, string> = {
  '/delivery': '배달지 상세 · 픽업후 · 후불현금',
  '/card': '카드 결제 · NFC',
  '/card/keyin': '카드 결제 · 카드 직접 입력',
  '/card/scan': '카드 결제 · 카드 스캔 (OCR)',
  '/qr': 'QR 간편 결제 · 스캔',
  '/complete': '결제·배달 완료',
  '/sms': '문자 앱 (영수증 발송) · 디자인 없음',
  '/main': '메인 지도 · 신규배차 ON',
}

const SCREEN_WIDTH = 360
const SCREEN_HEIGHT = 740

/**
 * 360×740 프레임을 뷰포트에 맞게 축소합니다 (확대는 하지 않음).
 * 폰에서도 디자인의 픽셀 위치가 그대로 유지되도록 레이아웃 대신 transform으로 처리합니다.
 *
 * 폰에서는 **폭만** 기준으로 맞춥니다. 높이까지 맞추면 브라우저 주소창이나 아티팩트 헤더가
 * 차지한 만큼 프레임이 작아져서(70% 수준) 실제 앱처럼 보이지 않습니다.
 * 폭 기준이면 대부분의 폰에서 1:1 실제 크기로 꽉 차고, 대신 아래로 조금 스크롤됩니다.
 */
function useDeviceScale(immersive: boolean) {
  useEffect(() => {
    function update() {
      const isPhone = window.innerWidth <= 480
      const gutter = isPhone ? 0 : 48
      // 전체화면·홈 화면 실행 중에는 캡션을 감추므로 그만큼도 화면에 씁니다.
      const captionSpace = immersive ? 0 : isPhone ? 28 : 60
      const byWidth = (window.innerWidth - gutter) / SCREEN_WIDTH
      const scale = isPhone
        ? Math.min(byWidth, 1)
        : Math.min(byWidth, (window.innerHeight - gutter - captionSpace) / SCREEN_HEIGHT, 1)

      /*
       * 폰에서는 화면 높이를 기기 높이에 맞춥니다 — 실제 앱처럼 하단 바가 화면 밑에 붙습니다.
       * 데스크톱에서는 디자인 그대로 740px 프레임을 보여줍니다.
       */
      const screenHeight = isPhone
        ? Math.min(Math.max(Math.round((window.innerHeight - captionSpace) / scale), 480), 1200)
        : SCREEN_HEIGHT

      const root = document.documentElement.style
      root.setProperty('--device-scale', String(Math.max(scale, 0.3)))
      root.setProperty('--screen-height', `${screenHeight}px`)
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    // iOS Safari는 주소창이 접힐 때 visualViewport가 먼저 바뀝니다.
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [immersive])
}

function CaptionLink({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <>
      {' · '}
      <button
        className="stage__caption"
        style={{ textDecoration: 'underline', display: 'inline' }}
        onClick={onClick}
      >
        {children}
      </button>
    </>
  )
}

function Caption({
  canFullscreen,
  onFullscreen,
}: {
  canFullscreen: boolean
  onFullscreen: () => void
}) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { reset } = useOrder()

  return (
    <p className="stage__caption">
      {SCREEN_NAMES[pathname] ?? pathname}
      {pathname !== '/delivery' && (
        <CaptionLink
          onClick={() => {
            reset()
            navigate('/delivery')
          }}
        >
          처음으로
        </CaptionLink>
      )}
      {/*
        브라우저 주소창·하단 바를 없애는 두 가지 방법.
        전체화면 API가 없는 아이폰 사파리에서는 "홈 화면에 추가"만 가능해서 안내만 둡니다.
      */}
      {canFullscreen ? (
        <CaptionLink onClick={onFullscreen}>전체화면</CaptionLink>
      ) : (
        <span> · 홈 화면에 추가 → 전체화면</span>
      )}
    </p>
  )
}

export default function App() {
  const { immersive, canFullscreen, toggleFullscreen } = useImmersive()
  useDeviceScale(immersive)

  // 몰입 모드에서는 문서가 스크롤되지 않아야 흰 여백이 비치지 않습니다.
  useEffect(() => {
    document.documentElement.classList.toggle('is-immersive', immersive)
    return () => document.documentElement.classList.remove('is-immersive')
  }, [immersive])

  return (
    <OrderProvider>
      <div className={`stage ${immersive ? 'stage--immersive' : ''}`}>
        <div className="device-frame">
          <div className="device">
            <Routes>
              <Route path="/" element={<Navigate to="/delivery" replace />} />
              <Route path="/delivery" element={<DeliveryDetail />} />
              <Route path="/card" element={<CardNfc />} />
              <Route path="/card/keyin" element={<CardKeyin />} />
              <Route path="/card/scan" element={<CardScan />} />
              <Route path="/qr" element={<QrScan />} />
              <Route path="/complete" element={<Complete />} />
              <Route path="/sms" element={<SmsApp />} />
              <Route path="/main" element={<MainMap />} />
            </Routes>
          </div>
        </div>
        {!immersive && (
          <Caption canFullscreen={canFullscreen} onFullscreen={toggleFullscreen} />
        )}
      </div>
    </OrderProvider>
  )
}
