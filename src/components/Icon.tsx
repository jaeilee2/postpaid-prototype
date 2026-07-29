import type { CSSProperties, ReactNode } from 'react'

import ic123 from '../assets/ic-123.svg'
import icBack from '../assets/ic-back.svg'
import icCall from '../assets/ic-call.svg'
import icCamera from '../assets/ic-camera.svg'
import icCreditCard from '../assets/ic-credit-card.svg'
import icNfc from '../assets/ic-nfc.svg'
import icCardA from '../assets/ic-card-a.svg'
import icCardB from '../assets/ic-card-b.svg'
import icCardC from '../assets/ic-card-c.svg'
import icCashA from '../assets/ic-cash-a.svg'
import icCashB from '../assets/ic-cash-b.svg'
import icCashReceipt from '../assets/ic-cash-receipt.svg'
import icChevronRight from '../assets/ic-chevron-right.svg'
import icClose from '../assets/ic-close.svg'
import icCloseWhite from '../assets/ic-close-white.svg'
import icFabMylocation from '../assets/ic-fab-mylocation.svg'
import icMission from '../assets/ic-mission.svg'
import icMore from '../assets/ic-more.svg'
import icMypage from '../assets/ic-mypage.svg'
import icNavigate from '../assets/ic-navigate.svg'
import icQrA from '../assets/ic-qr-a.svg'
import icQrB from '../assets/ic-qr-b.svg'
import icReceipt from '../assets/ic-receipt.svg'
import icSms from '../assets/ic-sms.svg'
import icSplitA from '../assets/ic-split-a.svg'
import icSplitB from '../assets/ic-split-b.svg'
import icCardAOff from '../assets/ic-card-a-off.svg'
import icCardBOff from '../assets/ic-card-b-off.svg'
import icCardCOff from '../assets/ic-card-c-off.svg'
import icCardCancel from '../assets/ic-card-cancel.svg'
import icCashAOff from '../assets/ic-cash-a-off.svg'
import icCashBOff from '../assets/ic-cash-b-off.svg'
import icQrAOff from '../assets/ic-qr-a-off.svg'
import icQrBOff from '../assets/ic-qr-b-off.svg'
import icDropdown from '../assets/ic-dropdown.svg'
import icEmojiHappy from '../assets/ic-emoji-happy.svg'
import icRefresh from '../assets/ic-refresh.svg'
import icVcc from '../assets/ic-vcc.svg'
import icWarning from '../assets/ic-warning.svg'
import icWeatherA from '../assets/ic-weather-a.svg'
import icWeatherB from '../assets/ic-weather-b.svg'

/*
 * Figma의 아이콘은 여러 벡터 레이어가 각자의 inset(%)으로 배치된 구조입니다.
 * 레이어를 직접 그리지 않고 export된 에셋을 그 inset 그대로 얹습니다.
 * (직접 SVG를 작성하면 원본 벡터와 달라지므로 하지 않습니다.)
 */

type Layer = { src: string; style: CSSProperties }

/** Figma의 inset 표기(top right bottom left, %)를 CSS로 옮깁니다. */
function inset(top: number, right: number, bottom = top, left = right): CSSProperties {
  return { top: `${top}%`, right: `${right}%`, bottom: `${bottom}%`, left: `${left}%` }
}

function IconBase({
  layers,
  size = 20,
  className,
  children,
}: {
  layers: Layer[]
  size?: 14 | 20 | 24
  className?: string
  children?: ReactNode
}) {
  return (
    <span className={['icon', `icon--${size}`, className].filter(Boolean).join(' ')}>
      {layers.map((layer, i) => (
        <span key={i} style={{ position: 'absolute', ...layer.style }}>
          <img src={layer.src} alt="" style={{ width: '100%', height: '100%' }} />
        </span>
      ))}
      {children}
    </span>
  )
}

export const IcCall = () => <IconBase layers={[{ src: icCall, style: inset(14.58, 14.58) }]} />

export const IcNavigate = () => (
  <IconBase layers={[{ src: icNavigate, style: inset(13.14, 12.5, 13.14, 20.83) }]} />
)

export const IcSms = () => <IconBase layers={[{ src: icSms, style: inset(18.75, 10.42) }]} />

/** 서명 등록 안내의 웃는 얼굴 (1730:197571) — 24px 컨테이너 안에 20px */
export const IcEmojiHappy = () => (
  <IconBase size={24} layers={[{ src: icEmojiHappy, style: inset(8.33, 8.33) }]} />
)

/** 할부 드롭다운 화살표 (1730:197149) */
export const IcDropdown = () => (
  <IconBase size={24} layers={[{ src: icDropdown, style: inset(42.71, 34.29, 40.07, 34.29) }]} />
)

/** 서명 다시 하기 (1730:197573) */
export const IcRefresh = () => (
  <IconBase layers={[{ src: icRefresh, style: inset(12.5, 12.69, 12.5, 12.69) }]} />
)

/** 카드 결제 취소 (1730:196903) */
export const IcCardCancel = () => (
  <IconBase layers={[{ src: icCardCancel, style: inset(10.95, 10.22, 5.81, 6.52) }]} />
)

export const IcVcc = () => (
  <IconBase layers={[{ src: icVcc, style: inset(10.42, 14.58, 7.53, 14.58) }]} />
)

/** 경고 삼각형 — 잔여 결제 금액 안내 (I1730:196200;9653:65211) */
export const IcWarning = () => (
  <IconBase layers={[{ src: icWarning, style: inset(16.27, 10.52, 14.58, 10.52) }]} />
)

/*
 * 결제 방법 아이콘은 **비활성용 회색 버전이 따로 있습니다** (1730:197778 — 분할 결제 시트의
 * 금액을 정하기 전 상태). 글리프는 같고 색만 다르므로 `off`로 에셋만 갈아끼웁니다.
 * CSS 필터로 회색을 만들면 디자인 색(#EBEDEF · #C7CCD1)과 어긋납니다.
 */

/** 현금 아이콘 — 지폐(Union) + 가운데 원(Vector Stroke) */
export const IcCash = ({ off = false }: { off?: boolean }) => (
  <IconBase
    layers={[
      { src: off ? icCashAOff : icCashA, style: inset(8.33, 8.33) },
      {
        src: off ? icCashBOff : icCashB,
        style: {
          left: '22.22%',
          right: '21.64%',
          top: 'calc(50% + 0.52px)',
          transform: 'translateY(-50%)',
          aspectRatio: '14 / 8',
        },
      },
    ]}
  />
)

export const IcCard = ({ off = false }: { off?: boolean }) => (
  <IconBase
    layers={[
      {
        src: off ? icCardAOff : icCardA,
        style: { top: '33.33%', bottom: '50%', left: '8.33%', right: '8.33%' },
      },
      { src: off ? icCardBOff : icCardB, style: inset(20.83, 8.33, 16.67, 8.33) },
      {
        src: off ? icCardCOff : icCardC,
        style: { top: '54.17%', bottom: '37.5%', left: '25%', right: '54.17%' },
      },
    ]}
  />
)

export const IcQr = ({ off = false }: { off?: boolean }) => (
  <IconBase
    layers={[
      { src: off ? icQrAOff : icQrA, style: inset(8.33, 8.33) },
      { src: off ? icQrBOff : icQrB, style: inset(26.85, 26.85) },
    ]}
  />
)

/** 분할 아이콘 — 사분면 4개 (3개는 같은 에셋을 회전 배치) */
export const IcSplit = () => (
  <IconBase
    layers={[
      { src: icSplitA, style: inset(54.69, 54.7, 12.5, 12.49) },
      { src: icSplitA, style: inset(12.5, 54.7, 54.69, 12.49) },
      { src: icSplitA, style: inset(12.5, 12.5, 54.69, 54.69) },
      { src: icSplitB, style: inset(54.69, 12.5, 12.5, 54.69) },
    ]}
  />
)

export const IcClose = () => (
  <IconBase size={24} layers={[{ src: icClose, style: inset(23.57, 23.57) }]} />
)

/** QR 스캔 화면을 닫는 버튼 안의 X (32px 컨테이너, 흰색 65%) */
export const IcCloseWhite = () => (
  <span className="icon" style={{ width: 32, height: 32 }}>
    <span style={{ position: 'absolute', ...inset(23.57, 23.57) }}>
      <img src={icCloseWhite} alt="" style={{ width: '100%', height: '100%' }} />
    </span>
  </span>
)

export const IcChevronRight = () => (
  <IconBase size={24} layers={[{ src: icChevronRight, style: inset(27.73, 38.85, 27.75, 36.07) }]} />
)

export const IcMypage = () => (
  <IconBase size={24} layers={[{ src: icMypage, style: inset(19.55, 18.75) }]} />
)

export const IcMore = () => (
  <IconBase size={24} layers={[{ src: icMore, style: inset(43.75, 19.71) }]} />
)

export const IcMyLocation = () => (
  <IconBase size={24} layers={[{ src: icFabMylocation, style: inset(10.42, 10.42) }]} />
)

/** 영수증 발송 */
export const IcReceipt = () => (
  <IconBase layers={[{ src: icReceipt, style: inset(18.75, 10.42) }]} />
)

/** 현금영수증 발급 */
export const IcCashReceipt = () => (
  <IconBase layers={[{ src: icCashReceipt, style: inset(11.53, 14.58) }]} />
)

export const IcWeather = () => (
  <IconBase
    layers={[
      { src: icWeatherA, style: inset(8.87, 3.15, 34.88, 36.05) },
      { src: icWeatherB, style: inset(20.33, 21.23, 8.87, 3.15) },
    ]}
  />
)

export const IcBack = () => (
  <IconBase size={24} layers={[{ src: icBack, style: inset(11.49, 42, 11.52, 16.67) }]} />
)

/** lucide/nfc — 23.9px 컨테이너에 배치되며 stroke가 살짝 바깥으로 나옵니다 */
export const IcNfc = () => (
  <span className="icon" style={{ width: 23.903, height: 23.903 }}>
    <span
      style={{ position: 'absolute', top: '8.33%', bottom: '8.33%', left: '25%', right: '20.73%' }}
    >
      <span style={{ position: 'absolute', inset: '-4.62% -7.09%' }}>
        <img src={icNfc} alt="" style={{ width: '100%', height: '100%' }} />
      </span>
    </span>
  </span>
)

/** 카드 직접 입력 — 테두리 사각형(CSS) 안에 "123" 벡터가 들어갑니다 */
export const Ic123 = () => (
  <span className="icon icon--20">
    <span className="ic-123__frame">
      <img className="ic-123__digits" src={ic123} alt="" />
    </span>
  </span>
)

/** 카드번호 입력 필드 앞의 카드 아이콘 (24×16) */
export const IcCreditCard = () => (
  <span className="ic-credit-card">
    <img src={icCreditCard} alt="" />
  </span>
)

export const IcCamera = () => (
  <IconBase layers={[{ src: icCamera, style: inset(13.28, 7.81, 15.63, 7.81) }]} />
)

/**
 * 진행한 미션 헤더의 불꽃 아이콘 (14px).
 *
 * export된 두 벡터(겉 빨간 불꽃 / 안 주황 불꽃)를 각각 <img>로 얹으면 14px에서 서로 따로
 * 래스터화되어 안쪽 불꽃이 밖으로 삐져나옵니다. Figma의 배치 변환을 계산해 한 장의 SVG로
 * 합쳐뒀습니다 → [ic-mission.svg](../assets/ic-mission.svg)
 */
export const IcMission = () => (
  <span className="cp__missions-icon">
    <img src={icMission} alt="" />
  </span>
)
