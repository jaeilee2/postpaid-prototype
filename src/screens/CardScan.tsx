import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import cameraCard from '../assets/camera-card.webp'
import {
  CameraPermissionDialog,
  CameraViewport,
  FlashlightButton,
} from '../components/CameraChrome'
import {
  AppBar,
  PaymentProgress,
  useEnsureCardMethod,
  usePaymentSettle,
  useNeedsSignature,
} from '../components/CardChrome'
import { Snackbar } from '../components/Chrome'
import { Ic123, IcClose, IcCreditCard } from '../components/Icon'
import { SCANNED_CARD } from '../data/order'
import { useCamera } from '../hooks/useCamera'
import { useOrder } from '../state/OrderContext'

/* 카드 스캔 (OCR)
 *   1747:121729  카메라 권한 팝업 — 허용해야 결제 플로우로 들어갑니다
 *   1742:54122   스캔 전 (흰 테두리)
 *   1742:54182   인식 중 (테두리가 Border_primary로 바뀌고 가운데에 원형 진행 표시)
 *   1742:54183   카드 정보 확인 시트 → [결제하기] → 결제 진행중 → 카드 결제 완료
 */

type Step = 'permission' | 'scanning' | 'reading' | 'confirm' | 'paying'

/*
 * 디자인(740 높이)에서 미리보기는 80..652, 네모는 244..451, 아래 버튼 띠는 88입니다.
 * 네모 중심(347.5)이 미리보기 중심(366)보다 18.5px 위에 있습니다.
 */
const BOTTOM_BAND = 88
const FRAME = { offsetY: -18.5, width: 328, height: 207 }

export function CardScan() {
  const navigate = useNavigate()
  const { cameraAllowed, allowCamera } = useOrder()
  useEnsureCardMethod()
  const settle = usePaymentSettle('card')
  const needsSignature = useNeedsSignature()

  const [step, setStep] = useState<Step>(cameraAllowed ? 'scanning' : 'permission')
  const [notice, setNotice] = useState<string | null>(null)
  const cameraOn = step !== 'permission'
  const { videoRef, state: cameraState } = useCamera(cameraOn)

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(null), 2600)
  }

  /* 카드 OCR은 브라우저 표준 API가 없어 인식 자체는 시간으로 대신합니다.
   * 네모를 눌러 바로 넘길 수도 있습니다. */
  useEffect(() => {
    if (step !== 'scanning') return
    const timer = window.setTimeout(() => setStep('reading'), 2400)
    return () => window.clearTimeout(timer)
  }, [step])

  useEffect(() => {
    if (step !== 'reading') return
    const timer = window.setTimeout(() => setStep('confirm'), 1300)
    return () => window.clearTimeout(timer)
  }, [step])

  function pay() {
    // 5만원 이상이면 결제 진행 전에 서명을 받습니다 (1730:197571).
    if (needsSignature) {
      navigate('/sign')
      return
    }
    setStep('paying')
    window.setTimeout(settle, 1500)
  }

  const scanned = step === 'reading' || step === 'confirm' || step === 'paying'

  return (
    <div className="card-screen">
      {/* 이 화면으로 들어오는 입구는 카드 직접 입력의 "카드 스캔하기"입니다 (1723:157655).
          앱바의 "카드 리더기로 결제"는 KIS Pay로 넘어갑니다 (1772:130317). */}
      <AppBar
        title="카드 스캔"
        onBack={() => navigate('/card/keyin')}
        onAction={() => navigate('/kispay')}
      />

      <CameraViewport
        bottomBand={BOTTOM_BAND}
        /* 카메라를 쓸 수 없을 때만 디자인의 캡처 이미지를 씁니다 — 인식되면 카드가 놓인 캡처로 바뀝니다. */
        still={scanned ? cameraCard : undefined}
        cameraState={cameraState}
        videoRef={videoRef}
        frame={{ ...FRAME, scanned }}
        frameChildren={
          step === 'scanning' && (
            <button
              className="scan__hit"
              onClick={() => setStep('reading')}
              aria-label="카드 인식 (프로토타입에서는 눌러서 진행)"
            />
          )
        }
      >
        <div className="scan__text">
          <p className="scan__headline t-subtitle1-18-bold">카드를 네모 안에 맞춰주세요</p>
          <p className="scan__sub t-body2-16-regular">카메라로 자동 촬영돼요</p>
        </div>

        <FlashlightButton bottom={209} onClick={() => showNotice('플래시는 디자인 범위 밖이에요')} />

        <button className="scan__keyin btn-tertiary" onClick={() => navigate('/card/keyin')}>
          <span className="scan__keyin-inner t-body2-16-medium">
            <Ic123 />
            카드 직접 입력
          </span>
        </button>
      </CameraViewport>

      {step === 'permission' && (
        <CameraPermissionDialog
          onAllowWhileUsing={() => {
            allowCamera()
            setStep('scanning')
          }}
          // "이번만 허용"은 기억하지 않으므로 다음에 들어오면 다시 물어봅니다.
          onAllowOnce={() => setStep('scanning')}
          onDeny={() =>
            navigate('/delivery', {
              replace: true,
              state: { notice: '카메라 권한을 허용해야 카드 스캔으로 결제할 수 있어요' },
            })
          }
        />
      )}

      {step === 'confirm' && (
        <>
          <div className="dimmed" />
          <div className="sheet cs__sheet">
            <div className="sheet__header cs__header">
              <span className="t-subtitle1-18-bold">카드 정보 확인</span>
              <button className="sheet__close" onClick={() => setStep('scanning')} aria-label="닫기">
                <IcClose />
              </button>
            </div>

            <div className="cs__info">
              <div className="cs__field">
                <p className="cs__label t-caption1-12-medium">카드 번호</p>
                <div className="cs__value t-body1-18-medium">
                  <IcCreditCard />
                  {SCANNED_CARD.number}
                </div>
              </div>
              <div className="cs__field">
                <p className="cs__label t-caption1-12-medium">유효기간</p>
                <p className="cs__value t-body1-18-medium">{SCANNED_CARD.expiry}</p>
              </div>
            </div>

            <div className="cs__help">
              <span className="t-body3-14-regular">카드 인식이 안 되나요?</span>
              <button className="cs__help-link t-body3-14-medium" onClick={() => navigate('/card/keyin')}>
                카드 직접 입력
              </button>
            </div>

            <div className="sheet__actions cs__actions">
              <button className="btn-tertiary btn--h56 t-body2-16-medium" onClick={() => setStep('scanning')}>
                다시 스캔하기
              </button>
              <button className="btn-primary btn--h56 t-body2-16-medium" onClick={pay}>
                결제하기
              </button>
            </div>
          </div>
        </>
      )}

      {notice && <Snackbar text={notice} />}

      {/* 인식 중과 결제 중 모두 같은 "결제 진행중" 다이얼로그입니다 (1730:197562 / 1723:157658) */}
      {(step === 'reading' || step === 'paying') && <PaymentProgress />}
    </div>
  )
}
