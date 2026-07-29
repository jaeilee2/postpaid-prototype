import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/*
 * Figma의 체크 표시는 Lottie 애니메이션(https://lottiefiles.com/animations/check-tD5r7tZ8zu)이라
 * export 결과가 60프레임 GIF였습니다. 그런데 앞 프레임들이 거의 비어 있고 브라우저가 캐시된
 * 애니메이션을 다시 재생하지 않아서, 완료 화면에 들어와도 체크가 안 보이고 위쪽이 빈 채로
 * 남는 일이 잦았습니다. 그래서 **마지막 프레임을 PNG로 뽑아** 쓰고, 나타나는 느낌은 CSS로
 * 대신합니다 (120KB → 4.7KB).
 */
import check from '../assets/check.png'
import { MapMainBackground, Snackbar } from '../components/Chrome'
import { IcCashReceipt, IcMission, IcReceipt } from '../components/Icon'
import {
  COMPLETE_PRICE_LABEL,
  MISSIONS,
  MISSION_COUNT,
  ORDER,
  PAYMENT_METHOD_LABEL,
  formatWon,
  splitPaymentAmount,
} from '../data/order'
import { useOrder } from '../state/OrderContext'
import { CashReceiptSheet } from './CashReceiptSheet'
import { ReceiptSendSheet } from './ReceiptSendSheet'

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
  const {
    method,
    cashReceiptIssued,
    issueCashReceipt,
    feeToastShown,
    markFeeToastShown,
    splitPayments,
  } = useOrder()
  /*
   * 결제 건이 둘 이상이면(분할이거나, 취소 후 다른 방법으로 다시 받았거나)
   * 총액 아래에 건별 내역을 붙입니다 (1730:197859).
   */
  const activePayments = splitPayments.filter((p) => !p.cancelledAt)
  const isSplit = method === 'split' || activePayments.length > 1
  /*
   * M캐시가 차감되는 건 현금으로 받은 금액입니다 — 그래서 "배송수수료 입금" 알림과
   * 현금영수증 발급은 현금이 섞여 있을 때만 나옵니다 (분할 결제 포함, 1730:197859).
   */
  const hasCash = method === 'cash' || activePayments.some((p) => p.method === 'cash')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [receiptSheetOpen, setReceiptSheetOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(!feeToastShown && hasCash)
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
    if (feeToastShown || !hasCash) return
    const timer = window.setTimeout(dismissToast, 4500)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeToastShown, hasCash])

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
                  {/* 결제 방법마다 라벨이 다릅니다 — 현금 157236 / 카드 157270 / QR 1730:197353 */}
                  <span className="cp__price-label t-body3-14-medium">
                    {isSplit ? COMPLETE_PRICE_LABEL.split : COMPLETE_PRICE_LABEL[method]}
                  </span>
                  <Amount value={ORDER.amount} />
                </div>
                {/* 분할 결제는 총액 아래에 건별 내역이 붙습니다 (1730:197859) */}
                {isSplit &&
                  activePayments.map((payment, index) => (
                    <div className="cp__price-row cp__price-row--sub" key={index}>
                      <span className="cp__price-label t-body3-14-medium">
                        └ {PAYMENT_METHOD_LABEL[payment.method]} 결제 금액
                        {payment.method === 'cash' && ' (M캐시 차감)'}
                      </span>
                      {/* 건별 금액도 총액과 같은 크기입니다 (1730:197859) */}
                      <Amount value={splitPaymentAmount(payment)} />
                    </div>
                  ))}
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
                {/* 영수증 발송은 단말의 문자 앱으로 넘어갑니다.
                    분할 결제는 건별로 보낼 수 있어 시트를 한 번 거칩니다 (1730:198565). */}
                <button
                  className="btn-outline t-body2-16-medium"
                  style={{ padding: '13px 12px' }}
                  onClick={() => (isSplit ? setReceiptSheetOpen(true) : navigate('/sms'))}
                >
                  <IcReceipt />
                  영수증 발송
                </button>
                {hasCash && (
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

      {receiptSheetOpen && (
        <ReceiptSendSheet
          payments={splitPayments}
          onClose={() => setReceiptSheetOpen(false)}
          onSend={() => {
            setReceiptSheetOpen(false)
            navigate('/sms')
          }}
        />
      )}

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
