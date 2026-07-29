import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { INSTALLMENTS, PAYMENT_TIME } from '../data/order'
import type { PaymentMethod, SplitPayment } from '../data/order'

type OrderState = {
  /** 선택된 결제 방법. 디자인 기본값은 현금입니다. */
  method: PaymentMethod
  setMethod: (method: PaymentMethod) => void
  /** 현금영수증 발급 완료 여부 — 완료되면 발급 버튼이 disabled 됩니다 (1723:157237) */
  cashReceiptIssued: boolean
  issueCashReceipt: () => void
  /**
   * "배송수수료 입금" 헤드업 알림을 이미 보여줬는지.
   * 문자 앱에 다녀온 뒤 완료 화면으로 돌아올 때 알림이 다시 뜨면 안 되므로 화면 밖에서 기억합니다.
   */
  feeToastShown: boolean
  markFeeToastShown: () => void
  /**
   * 카메라 권한을 "앱 사용 중에만 허용"으로 받아둔 상태인지 (1747:121729).
   * true면 카드 스캔·QR 스캔에 들어갈 때 권한 팝업을 다시 띄우지 않습니다.
   * "이번만 허용"은 기억하지 않으므로 다음에 다시 물어봅니다 — 안드로이드와 같습니다.
   */
  cameraAllowed: boolean
  allowCamera: () => void
  /**
   * 지금까지 받은 결제 내역. 분할이면 여러 건, 한 번에 다 받으면 한 건입니다 (1730:197705).
   * 결제 내역 화면(1730:196892)이 이 목록을 보여주고 취소도 여기에 기록합니다.
   */
  splitPayments: SplitPayment[]
  addSplitPayment: (payment: SplitPayment) => void
  /** 결제 취소 (1730:197134 → 1730:198254) — 기록을 지우지 않고 취소일시를 남깁니다. */
  cancelPayment: (index: number) => void
  /** 서명 등록 결과 — 고객이 그린 서명 (1730:197573). null이면 아직 안 받았습니다. */
  signature: string | null
  setSignature: (value: string | null) => void
  /** 카드 결제에서 고른 할부 (1730:197143) */
  installment: string
  setInstallment: (value: string) => void
  /**
   * 분할 결제에서 카드·QR을 골라 그 화면으로 넘어간 상태.
   * 카드/QR 화면이 "이번에 받을 금액"을 알아야 하고, 결제되면 이 값으로 내역을 추가합니다.
   */
  pendingSplit: Omit<SplitPayment, 'method'> | null
  setPendingSplit: (value: Omit<SplitPayment, 'method'> | null) => void
  /** 프로토타입을 처음 상태로 되돌립니다. */
  reset: () => void
}

const OrderContext = createContext<OrderState | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashReceiptIssued, setCashReceiptIssued] = useState(false)
  const [feeToastShown, setFeeToastShown] = useState(false)
  const [cameraAllowed, setCameraAllowed] = useState(false)
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([])
  const [pendingSplit, setPendingSplit] = useState<Omit<SplitPayment, 'method'> | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [installment, setInstallment] = useState(INSTALLMENTS[0])

  const issueCashReceipt = useCallback(() => setCashReceiptIssued(true), [])
  const markFeeToastShown = useCallback(() => setFeeToastShown(true), [])
  const allowCamera = useCallback(() => setCameraAllowed(true), [])
  const addSplitPayment = useCallback((payment: SplitPayment) => {
    setSplitPayments((current) => [...current, payment])
    setPendingSplit(null)
  }, [])
  const cancelPayment = useCallback((index: number) => {
    setSplitPayments((current) =>
      current.map((payment, i) =>
        i === index ? { ...payment, cancelledAt: PAYMENT_TIME.cancelled } : payment,
      ),
    )
  }, [])

  const reset = useCallback(() => {
    setMethod('cash')
    setCashReceiptIssued(false)
    setFeeToastShown(false)
    setCameraAllowed(false)
    setSplitPayments([])
    setPendingSplit(null)
    setSignature(null)
    setInstallment(INSTALLMENTS[0])
  }, [])

  const value = useMemo(
    () => ({
      method,
      setMethod,
      cashReceiptIssued,
      issueCashReceipt,
      feeToastShown,
      markFeeToastShown,
      cameraAllowed,
      allowCamera,
      splitPayments,
      addSplitPayment,
      cancelPayment,
      signature,
      setSignature,
      installment,
      setInstallment,
      pendingSplit,
      setPendingSplit,
      reset,
    }),
    [
      method,
      cashReceiptIssued,
      issueCashReceipt,
      feeToastShown,
      markFeeToastShown,
      cameraAllowed,
      allowCamera,
      splitPayments,
      addSplitPayment,
      cancelPayment,
      signature,
      installment,
      pendingSplit,
      reset,
    ],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (!context) throw new Error('useOrder must be used inside <OrderProvider>')
  return context
}
