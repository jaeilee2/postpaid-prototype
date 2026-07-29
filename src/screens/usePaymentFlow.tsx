import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CenterToast } from '../components/Chrome'
import {
  ORDER,
  PAYMENT_METHOD_LABEL,
  PAYMENT_TIME,
  SPLIT,
  formatWon,
  splitProgress,
} from '../data/order'
import type { PaymentMethod, SplitPayment } from '../data/order'
import { useOrder } from '../state/OrderContext'
import { CashConfirmDialog } from './CashConfirmDialog'
import { PaymentMethodSheet } from './PaymentMethodSheet'
import { SplitPaymentSheet } from './SplitPaymentSheet'

/*
 * 결제를 시작하는 흐름 — 배달지 상세와 수행목록이 함께 씁니다.
 *
 * 배달지 상세의 `결제하기`(1723:158379)와 수행목록의 `결제하기`(1730:196061)가
 * 같은 결제 방법 시트(1737:24157)를 띄우고 같은 화면들로 이어지므로 한 곳에 모았습니다.
 */

type Overlay = null | 'method' | 'cash-confirm' | 'split' | 'split-cash-confirm'

export function usePaymentFlow() {
  const navigate = useNavigate()
  const { method, setMethod, splitPayments, addSplitPayment, setPendingSplit } = useOrder()
  const progress = splitProgress(splitPayments)
  /** 일부만 받았거나 취소해서 남은 금액이 있는 상태 (1730:196113) */
  const partial = splitPayments.length > 0 && progress.remainingTotal > 0
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [toast, setToast] = useState<[string, string] | null>(null)
  /** 분할 결제 시트에서 고른 이번 회차 금액 (현금 확인 얼럿을 거칠 때 잠시 들고 있습니다) */
  const [splitPart, setSplitPart] = useState<Omit<SplitPayment, 'method'> | null>(null)

  function showToast(lines: [string, string]) {
    setToast(lines)
    window.setTimeout(() => setToast(null), 3000)
  }

  /**
   * 결제 한 건을 기록합니다. 다 받았으면 완료 화면으로 가고,
   * **분할 결제로 아직 남았으면 분할 결제 시트를 다시 엽니다** (1730:196227) —
   * 이어서 다음 회차를 받는 흐름이라 `결제하기`를 다시 누르지 않아도 됩니다.
   */
  function record(payMethod: SplitPayment['method'], part: Omit<SplitPayment, 'method'>) {
    addSplitPayment({ method: payMethod, ...part, paidAt: PAYMENT_TIME.paid })
    setSplitPart(null)
    if (splitProgress([...splitPayments, { method: payMethod, ...part }]).done) {
      setOverlay(null)
      navigate('/complete')
      return
    }
    setOverlay(method === 'split' ? 'split' : null)
    showToast([
      `${PAYMENT_METHOD_LABEL[payMethod]} ${formatWon(part.product + part.cup)}원이 결제되었어요`,
      '전체 결제 후 영수증 발송이 가능해요',
    ])
  }

  /** 카드·QR은 각자의 화면으로 넘어갑니다 — 이번 회차 금액을 컨텍스트에 실어 보냅니다. */
  function handleSplitPay(
    payMethod: SplitPayment['method'],
    part: Omit<SplitPayment, 'method'>,
  ) {
    if (payMethod === 'cash') {
      setSplitPart(part)
      setOverlay('split-cash-confirm')
      return
    }
    setPendingSplit(part)
    navigate(payMethod === 'card' ? '/card' : '/qr')
  }

  /**
   * 이번에 받을 금액. 남은 금액이 있으면 그만큼만 받습니다 —
   * 전액을 다시 받으면 과결제가 되기 때문입니다.
   */
  function amountToCollect() {
    if (partial) return { product: progress.remainingProduct, cup: progress.remainingCup }
    return { product: SPLIT.productAmount, cup: SPLIT.cupDeposit }
  }

  /** 선택된 결제 방법으로 결제를 시작합니다. */
  function startPayment(next: PaymentMethod = method) {
    if (next === 'cash') {
      setOverlay('cash-confirm')
      return
    }
    if (next === 'card' || next === 'qr') {
      // 남은 금액이 있으면 그 금액을 카드·QR 화면으로 실어 보냅니다.
      setPendingSplit(partial ? amountToCollect() : null)
      // 카드는 NFC 화면이 기본(1723:157653), QR은 카메라 권한 확인부터(1747:121729).
      navigate(next === 'card' ? '/card' : '/qr')
      return
    }
    // 분할은 금액을 나눠 받는 시트가 뜹니다 (1730:197705).
    setOverlay('split')
  }

  const overlays = (
    <>
      {toast && <CenterToast lines={toast} />}

      {overlay === 'method' && (
        <PaymentMethodSheet
          total={ORDER.amount}
          method={method}
          onSelect={(next) => {
            setMethod(next)
            // 시트에서 결제 방법을 고르면 곧바로 그 방법의 결제가 시작됩니다.
            startPayment(next)
          }}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'cash-confirm' && (
        <CashConfirmDialog
          onClose={() => setOverlay(null)}
          onOtherMethod={() => setOverlay('method')}
          onConfirm={() =>
            // 한 번에 전액을 현금으로 받은 것도 결제 내역에 남습니다 (1730:196850).
            record('cash', amountToCollect())
          }
        />
      )}

      {overlay === 'split' && (
        <SplitPaymentSheet
          initial={splitPart}
          /* 닫으면 어떤 방법으로 받을지 다시 물어봅니다 (1737:24157) */
          onClose={() => {
            setSplitPart(null)
            setOverlay('method')
          }}
          onPay={handleSplitPay}
        />
      )}

      {/* 분할 결제에서 현금을 고르면 같은 확인 얼럿이 뜹니다 (1730:195338).
          여기서는 회차 금액을 잃지 않게 닫기·다른 방법 모두 분할 결제 시트로 돌아갑니다. */}
      {overlay === 'split-cash-confirm' && splitPart && (
        <CashConfirmDialog
          onClose={() => setOverlay('split')}
          onOtherMethod={() => setOverlay('split')}
          onConfirm={() => record('cash', splitPart)}
        />
      )}
    </>
  )

  return {
    /** 결제 방법 시트를 엽니다 (`어떻게 결제하시겠어요?`) */
    openMethodSheet: () => setOverlay('method'),
    /** 분할 결제 시트를 엽니다 (카드·QR 회차를 마치고 돌아왔을 때) */
    openSplitSheet: () => setOverlay('split'),
    /**
     * 남은 금액이 있을 때의 `결제하기`.
     *
     * - **분할 결제 중**이면 분할 결제 시트를 바로 엽니다 (1730:196227 — 상품가액을 다 받았으면
     *   금액 필드가 비활성되고 컵 보증금만 남은 상태로 뜹니다).
     * - 그 밖에(취소해서 남은 경우 등)는 어떤 방법으로 받을지 다시 물어봅니다
     *   (1730:196113 → 1730:196101) — 지난번 방법으로 바로 넘어가지 않습니다.
     */
    payRemaining: () =>
      partial && method !== 'split' ? setOverlay('method') : startPayment(),
    /** 지금 선택된 방법으로 바로 결제를 시작합니다 */
    startPayment,
    showToast,
    overlays,
  }
}
