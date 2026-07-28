import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Figma의 체크 표시는 Lottie 애니메이션(https://lottiefiles.com/animations/check-tD5r7tZ8zu)이라
// export 결과가 애니메이션 GIF입니다.
import check from '../assets/check.gif'
import { MapMainBackground, Snackbar } from '../components/Chrome'
import { IcCashReceipt, IcMission, IcReceipt } from '../components/Icon'
import { MISSIONS, MISSION_COUNT, ORDER, formatWon } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { CashReceiptSheet } from './CashReceiptSheet'

/* 결제·배달 완료 (1723:157236 = 발급 가능 / 1723:157237 = 발급 완료로 disabled) */

function Amount({ value, focus = false }: { value: number; focus?: boolean }) {
  return (
    <span className={`cp__price-value t-body2-16-bold ${focus ? 'cp__price-value--focus' : ''}`}>
      {formatWon(value)}
      <span className="unit">원</span>
    </span>
  )
}

export function Complete() {
  const navigate = useNavigate()
  const location = useLocation()
  const { method, cashReceiptIssued, issueCashReceipt, feeToastShown, markFeeToastShown } =
    useOrder()
  const isCash = method === 'cash'
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(!feeToastShown)
  const [notice, setNotice] = useState<string | null>(null)

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(null), 2600)
  }

  function dismissToast() {
    setToastVisible(false)
    markFeeToastShown()
  }

  // 배송수수료 입금 헤드업 알림은 잠시 뜬 뒤 사라집니다.
  // 문자 앱에 다녀와 다시 이 화면으로 돌아올 때는 뜨지 않습니다.
  useEffect(() => {
    if (feeToastShown) return
    const timer = window.setTimeout(dismissToast, 4500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeToastShown])

  // 문자 앱에서 영수증을 보내고 돌아오면 결과를 알려줍니다.
  const returnNotice = (location.state as { notice?: string } | null)?.notice
  useEffect(() => {
    if (!returnNotice) return
    showNotice(returnNotice)
    // 뒤로가기로 다시 들어왔을 때 또 뜨지 않도록 네비게이션 state를 비웁니다.
    navigate('/complete', { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnNotice])

  return (
    <div className="screen">
      <MapMainBackground />
      <div className="dimmed" />

      <div className="sheet cp__sheet">
        <div className="cp__scroll">
          <div className="cp__summary">
            <div className="cp__top">
              <img className="cp__check" src={check} alt="" />
              <div className="cp__title">
                <p className="cp__store t-body2-16-medium" style={{ margin: 0 }}>
                  {ORDER.store}
                </p>
                <p className="cp__headline t-h2-28-bold" style={{ margin: 0 }}>
                  결제·배달 완료
                </p>
              </div>
            </div>

            <div className="cp__price-group">
              <div className="cp__price-card">
                <div className="cp__price-row">
                  {/* 현금은 "현금 결제 금액 (M캐시 차감)"(157236), 카드는 "카드 결제 금액"(157270) */}
                  <span className="cp__price-label t-body3-14-medium">
                    {isCash ? '현금 결제 금액 (M캐시 차감)' : '카드 결제 금액'}
                  </span>
                  <Amount value={ORDER.amount} />
                </div>
                <div className="cp__price-divider" />
                <div className="cp__price-row">
                  <span className="cp__price-label t-body3-14-medium">배송료</span>
                  <Amount value={ORDER.deliveryFee} focus />
                </div>
              </div>

              {/*
                현금 결제는 버튼 2개(1723:157236), 카드 결제는 영수증 발송만 있고
                버튼이 전체 폭으로 늘어납니다(1723:157270). 카드는 현금영수증 발급이 없습니다.
              */}
              <div className="cp__receipt-buttons">
                {/* 영수증 발송은 단말의 문자 앱으로 넘어갑니다. */}
                <button
                  className="btn-outline t-body2-16-medium"
                  style={{ padding: '13px 12px' }}
                  onClick={() => navigate('/sms')}
                >
                  <IcReceipt />
                  영수증 발송
                </button>
                {isCash && (
                  <button
                    className="btn-outline t-body2-16-medium"
                    style={{ padding: '13px 12px' }}
                    disabled={cashReceiptIssued}
                    onClick={() => setSheetOpen(true)}
                  >
                    <IcCashReceipt />
                    현금영수증 발급
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="cp__missions">
            <div className="cp__missions-head">
              <IcMission />
              <span className="t-body3-14-medium">진행한 미션</span>
              <span className="t-body3-14-bold">{MISSION_COUNT}개</span>
            </div>
            <div className="cp__missions-list">
              {MISSIONS.map((mission, index) => (
                <div className="cp__mission" key={index}>
                  <div
                    className="cp__mission-fill"
                    style={{ width: `${(mission.current / mission.total) * 100}%` }}
                  />
                  <span className="cp__mission-label t-body3-14-medium">{mission.label}</span>
                  <span className="cp__mission-count t-body3-14-medium">
                    {mission.current}/{mission.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cp__action">
          <div className="cp__action-divider" />
          <button
            className="btn-primary btn--h56 t-body2-16-medium"
            onClick={() => navigate('/main')}
          >
            확인
          </button>
        </div>
      </div>

      {toastVisible && (
        <button className="toast" onClick={dismissToast}>
          <span className="toast__title t-body3-14-bold">배송수수료 입금</span>
          <span className="toast__body t-body3-14-regular">
            배송수수료 입금으로 인해 M캐시 잔액이 변경되었습니다.
          </span>
        </button>
      )}

      {notice && <Snackbar text={notice} />}

      {sheetOpen && (
        <CashReceiptSheet
          onCancel={() => setSheetOpen(false)}
          onConfirm={() => {
            issueCashReceipt()
            setSheetOpen(false)
            showNotice('현금영수증을 발급했어요')
          }}
        />
      )}
    </div>
  )
}
