import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CameraPermissionDialog, CameraViewport } from '../components/CameraChrome'
import { AppBar, PaymentProgress, usePaymentSettle } from '../components/CardChrome'
import { IcCloseWhite } from '../components/Icon'
import { ORDER, formatWon } from '../data/order'
import { useCamera, useQrDetection } from '../hooks/useCamera'
import { useOrder } from '../state/OrderContext'

/* QR 간편 결제
 *   1747:121729  카메라 권한 팝업 — 허용해야 결제 플로우로 들어갑니다
 *   1730:197575  스캔 전 (네모 가운데 스캔 라인이 위아래로 움직입니다)
 *   1730:197353  QR 결제 완료 → Complete.tsx
 */

type Step = 'permission' | 'scanning' | 'paying'

/*
 * 디자인(740 높이)에서 미리보기는 80..740(화면 끝까지), 네모는 252..482입니다.
 * 네모 중심(367)이 미리보기 중심(410)보다 43px 위에 있습니다.
 */
const FRAME = { offsetY: -43, width: 230, height: 230 }

export function QrScan() {
  const navigate = useNavigate()
  const { cameraAllowed, allowCamera, setMethod, method } = useOrder()
  const settle = usePaymentSettle('qr')

  const [step, setStep] = useState<Step>(cameraAllowed ? 'scanning' : 'permission')
  const cameraOn = step !== 'permission'
  const { videoRef, state: cameraState } = useCamera(cameraOn)

  // 링크로 바로 들어온 경우에도 완료 화면 문구가 어긋나지 않게 맞춥니다.
  // 분할 결제의 한 회차라면 결제 방법이 '분할'로 남아야 합니다.
  useEffect(() => {
    if (method === 'split' || method === 'qr') return
    setMethod('qr')
  }, [method, setMethod])

  function complete() {
    setStep('paying')
    window.setTimeout(settle, 1500)
  }

  // BarcodeDetector가 있는 브라우저에서는 실제 QR을 읽습니다.
  useQrDetection(videoRef, step === 'scanning', complete)

  // 없는 브라우저(iOS 사파리 등)에서도 흐름이 막히지 않게 시간이 지나면 인식된 것으로 봅니다.
  useEffect(() => {
    if (step !== 'scanning') return
    const timer = window.setTimeout(complete, 3600)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  return (
    <div className="card-screen">
      <AppBar title="QR 간편 결제" onBack={() => navigate('/delivery')} actionLabel={null} />

      <CameraViewport
        bottomBand={0}
        cameraState={cameraState}
        videoRef={videoRef}
        frame={FRAME}
        frameChildren={step === 'scanning' && <span className="scan__line" />}
      >
        <div className="qr__price">
          <p className="qr__price-label t-body2-16-medium">총 결제 금액</p>
          <p className="qr__price-amount t-h2-28-bold">{formatWon(ORDER.amount)}원</p>
        </div>

        <div className="scan__text scan__text--qr">
          <p className="scan__headline t-subtitle1-18-bold">QR·바코드를 네모 안에 보여주세요</p>
          <p className="scan__sub t-body2-16-regular">카메라로 자동 스캔돼요</p>
        </div>

        <button
          className="scan__flash"
          style={{ bottom: 40 }}
          onClick={() => navigate('/delivery')}
          aria-label="닫기"
        >
          <IcCloseWhite />
        </button>
      </CameraViewport>

      {step === 'permission' && (
        <CameraPermissionDialog
          onAllowWhileUsing={() => {
            allowCamera()
            setStep('scanning')
          }}
          onAllowOnce={() => setStep('scanning')}
          onDeny={() =>
            navigate('/delivery', {
              replace: true,
              state: { notice: '카메라 권한을 허용해야 QR 간편 결제를 할 수 있어요' },
            })
          }
        />
      )}

      {step === 'paying' && <PaymentProgress />}
    </div>
  )
}
