import clock from '../assets/clock.svg'
// Figma export는 2.3MB PNG였습니다. 표시 크기의 2배 해상도(1720×1594)를 그대로 유지하면서
// WebP q85로 변환해 287KB로 줄였습니다 — 단일 HTML로 배포할 때 용량이 중요합니다.
import mapImg from '../assets/map.webp'
import mylocationArrow from '../assets/mylocation-arrow.svg'
import mylocationFill from '../assets/mylocation-fill.svg'
import mylocationStroke from '../assets/mylocation-stroke.svg'
import naver from '../assets/naver.png'
import signalA from '../assets/signal-a.svg'
import signalB from '../assets/signal-b.svg'
import statusbar from '../assets/statusbar.svg'
import toggleHandle from '../assets/toggle-handle.svg'
import { IcMore, IcMyLocation, IcMypage, IcWeather } from './Icon'

export function StatusBar() {
  return (
    <div className="statusbar">
      <img className="statusbar__bg" src={statusbar} alt="" />
      <img className="statusbar__clock" src={clock} alt="12:00" />
      <img className="statusbar__signal-a" src={signalA} alt="" />
      <img className="statusbar__signal-b" src={signalB} alt="" />
    </div>
  )
}

/** 오더 받기 토글 (항상 ON 상태로 디자인돼 있습니다) */
export function OrderToggle() {
  return (
    <span className="toggle">
      <span className="toggle__surface" />
      <span className="toggle__handle">
        <img src={toggleHandle} alt="" />
      </span>
    </span>
  )
}

function OrderReceiveFab() {
  return (
    <div className="fab fab--label" style={{ left: 16, top: 32 }}>
      <OrderToggle />
      <span className="t-body3-14-medium">오더 받기</span>
    </div>
  )
}

/** 배달지 상세 화면의 지도 배경 — 상단 FAB 3개 (1723:158379) */
export function MapPickupBackground({ onTasks }: { onTasks?: () => void }) {
  return (
    <div className="map">
      <img className="map__image" src={mapImg} alt="" />
      <OrderReceiveFab />
      <div className="fab fab--icon" style={{ right: 107, top: 32 }}>
        <IcMypage />
      </div>
      {/* 수행목록으로 들어가는 입구입니다 (1765:130135 → 1730:196848) */}
      <button className="fab fab--label" style={{ right: 12, top: 32 }} onClick={onTasks}>
        <span className="t-body3-14-medium">수행목록</span>
      </button>
      <StatusBar />
    </div>
  )
}

/** 메인 지도 화면 — 완료 화면과 현금영수증 시트의 배경 (1723:157212 / 1723:157236) */
export function MapMainBackground() {
  return (
    <div className="map">
      <img className="map__image" src={mapImg} alt="" />

      <div className="map__marker">
        <img className="map__marker-fill" src={mylocationFill} alt="" />
        <img className="map__marker-stroke" src={mylocationStroke} alt="" />
        <img className="map__marker-arrow" src={mylocationArrow} alt="" />
      </div>

      <div className="naver-logo">
        <img src={naver} alt="NAVER" />
      </div>

      <OrderReceiveFab />
      <div className="fab fab--icon" style={{ left: 300, top: 32 }}>
        <IcMypage />
      </div>
      {/* 화면 높이가 달라져도 하단에 붙어 있도록 bottom 기준으로 둡니다 (디자인 740에서 top 672). */}
      <div className="fab fab--icon" style={{ left: 16, bottom: 24 }}>
        <IcMyLocation />
      </div>
      <div className="fab fab--label" style={{ left: 268, bottom: 24 }}>
        <span className="t-body3-14-medium">대기오더</span>
      </div>

      <div className="snackbar">
        <IcMore />
        <span className="t-body3-14-medium">주변 오더를 찾고 있어요</span>
      </div>

      <div className="banner">
        <span className="banner__icon">
          <IcWeather />
        </span>
        <span className="t-body3-14-medium">기상할증 적용중</span>
      </div>

      <StatusBar />
    </div>
  )
}

/**
 * 화면 가운데 토스트 (1730:196202) — 결과를 알리는 안내는 모두 이 형태입니다.
 * 분할 결제 회차 안내는 두 줄(232×56)이고, 나머지는 한 줄입니다.
 *
 * 지도 화면의 "주변 오더를 찾고 있어요"(1730:197354)는 `...` 아이콘이 붙은 스낵바인데,
 * 그건 오더를 찾는 중이라는 진행 표시라서 다른 컴포넌트로 남겨뒀습니다.
 */
export function CenterToast({ lines }: { lines: string[] }) {
  return (
    <div className="toast-center" role="status" aria-live="polite">
      {lines.map((line) => (
        <p key={line} className="t-body3-14-regular" style={{ margin: 0 }}>
          {line}
        </p>
      ))}
    </div>
  )
}

/** 한 줄 안내 토스트 */
export function Snackbar({ text }: { text: string }) {
  return <CenterToast lines={[text]} />
}
