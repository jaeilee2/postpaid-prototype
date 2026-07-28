import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { PaymentMethod } from '../data/order'

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
  /** 프로토타입을 처음 상태로 되돌립니다. */
  reset: () => void
}

const OrderContext = createContext<OrderState | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashReceiptIssued, setCashReceiptIssued] = useState(false)
  const [feeToastShown, setFeeToastShown] = useState(false)

  const issueCashReceipt = useCallback(() => setCashReceiptIssued(true), [])
  const markFeeToastShown = useCallback(() => setFeeToastShown(true), [])

  const reset = useCallback(() => {
    setMethod('cash')
    setCashReceiptIssued(false)
    setFeeToastShown(false)
  }, [])

  const value = useMemo(
    () => ({
      method,
      setMethod,
      cashReceiptIssued,
      issueCashReceipt,
      feeToastShown,
      markFeeToastShown,
      reset,
    }),
    [method, cashReceiptIssued, issueCashReceipt, feeToastShown, markFeeToastShown, reset],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder() {
  const context = useContext(OrderContext)
  if (!context) throw new Error('useOrder must be used inside <OrderProvider>')
  return context
}
