import type { ReactNode } from 'react'

import cameraFloor from '../assets/camera-floor.webp'
import icFlashlight from '../assets/ic-flashlight.svg'
import permCamera from '../assets/perm-camera.png'
import type { CameraState } from '../hooks/useCamera'

/* 카드 스캔 · QR 스캔이 공유하는 조각들 (1742:54122 · 1742:54182 · 1730:197575) */

/*
 * OS 카메라 권한 팝업 (1747:121729)
 *
 * 디자인에는 실제 안드로이드 팝업을 캡처한 이미지가 들어가 있고, 그 위에 앱 이름만 흰 사각형으로
 * 덮고 "부릉프렌즈"로 다시 타이핑되어 있습니다(캡처는 QA 빌드였습니다).
 * 여기서는 캡처에서 **카메라 아이콘만** 잘라 쓰고 텍스트는 코드로 다시 썼습니다 —
 * 그래야 세 항목이 실제로 눌리고, 확대해도 글자가 깨지지 않습니다.
 * 좌표·글자 크기는 캡처의 픽셀을 재서 맞췄습니다.
 */

/** 항목 한 줄의 세로 중심 (팝업 카드 top=486 기준) 과 줄 높이 */
const OPTION_ROW_HEIGHT = 43.4
const OPTION_CENTERS = { whileUsing: 121.9, once: 165.3, deny: 208.6 }

function PermissionOption({
  label,
  center,
  onClick,
}: {
  label: string
  center: number
  onClick: () => void
}) {
  return (
    <button
      className="perm__option t-body3-14-bold"
      style={{ top: center - OPTION_ROW_HEIGHT / 2, height: OPTION_ROW_HEIGHT }}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function CameraPermissionDialog({
  onAllowWhileUsing,
  onAllowOnce,
  onDeny,
}: {
  onAllowWhileUsing: () => void
  onAllowOnce: () => void
  onDeny: () => void
}) {
  return (
    <>
      <div className="dimmed" style={{ zIndex: 90 }} />
      <div className="perm" role="dialog" aria-label="카메라 권한 요청">
        <img className="perm__icon" src={permCamera} alt="" />
        <p className="perm__question">
          <b>부릉프렌즈</b>에서 사진을 촬영하고 동영상을 녹화하도록
          <br />
          허용하시겠습니까?
        </p>
        <PermissionOption
          label="앱 사용 중에만 허용"
          center={OPTION_CENTERS.whileUsing}
          onClick={onAllowWhileUsing}
        />
        <PermissionOption label="이번만 허용" center={OPTION_CENTERS.once} onClick={onAllowOnce} />
        <PermissionOption label="허용 안함" center={OPTION_CENTERS.deny} onClick={onDeny} />
      </div>
    </>
  )
}

/*
 * 카메라 미리보기 + 스캔 네모.
 *
 * Figma는 "딤 처리된 카메라 이미지" 위에 "딤 없는 같은 이미지"를 네모 안에 한 번 더 얹어
 * 구멍을 만듭니다. 여기서는 이미지를 한 장만 쓰고 네모의 box-shadow로 주변을 딤 처리합니다
 * (`overflow: hidden`이라 딤이 카메라 영역 밖으로 새지 않습니다).
 */

/** 디자인(740)에서 카메라 영역의 높이 — 상태바 24 + 앱바 56을 뺀 나머지 */
const STAGE_HEIGHT = 660
export function CameraViewport({
  bottomBand,
  still = cameraFloor,
  cameraState,
  videoRef,
  frame,
  frameChildren,
  children,
}: {
  /** 미리보기 아래에 남길 흰 띠의 높이 — 카드 스캔 88(버튼 자리), QR 0 */
  bottomBand: number
  still?: string
  cameraState: CameraState
  videoRef: React.RefObject<HTMLVideoElement | null>
  /**
   * offsetY는 네모를 미리보기 가운데에서 얼마나 올릴지 — 디자인 좌표에서 계산한 값입니다.
   * minTop은 네모가 위 문구를 침범하지 않는 한계선(카메라 영역 기준)입니다 —
   * 주소창이 있는 브라우저처럼 화면이 짧을 때 가운데 배치가 문구까지 밀고 올라오는 것을 막습니다.
   */
  frame: { offsetY: number; width: number; height: number; minTop: number; scanned?: boolean }
  frameChildren?: ReactNode
  children?: ReactNode
}) {
  /*
   * 네모의 위치는 세 값 중에서 고릅니다 (CSS의 max/min — screens.css의 `--frame-top`).
   *   1. 디자인 위치 — 화면이 디자인(740)보다 길어도 그대로 둡니다.
   *   2. 카메라 가운데 — 화면이 짧아지면 함께 올라옵니다.
   *   3. 최소 위치 — 위 문구를 덮기 전에 멈춥니다.
   */
  const designCamera = STAGE_HEIGHT - bottomBand
  const frameVars = {
    ['--frame-h' as string]: `${frame.height}px`,
    ['--frame-offset' as string]: `${frame.offsetY}px`,
    ['--frame-top-design' as string]: `${designCamera / 2 + frame.offsetY - frame.height / 2}px`,
    ['--frame-top-min' as string]: `${frame.minTop}px`,
  }

  return (
    <div className="scan__stage" style={frameVars}>
      <div className="scan__camera" style={{ bottom: bottomBand }}>
        <img className="scan__still" src={still} alt="" />
        <video
          ref={videoRef}
          className="scan__video"
          style={{ opacity: cameraState === 'live' ? 1 : 0 }}
          playsInline
          muted
          autoPlay
        />
        <div
          className={`scan__frame ${frame.scanned ? 'scan__frame--scanned' : ''}`}
          style={{ width: frame.width, height: frame.height }}
        >
          {frameChildren}
        </div>
      </div>
      {children}
    </div>
  )
}

/**
 * 플래시 버튼 (1742:54085) — 켜고 끄는 동작은 디자인에 없어 표시만 합니다.
 * 네모 바로 아래에 붙습니다. 화면 아래에서 재면 짧은 화면에서 네모 안으로 들어갑니다.
 */
export function FlashlightButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="scan__flash scan__flash--below-frame"
      onClick={onClick}
      aria-label="플래시"
    >
      <img src={icFlashlight} alt="" />
    </button>
  )
}
