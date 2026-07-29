/*
 * 목업 데이터.
 *
 * 참고: Figma 프레임마다 금액이 달랐습니다 — 배달지 상세는 58,500원,
 * 결제 방법 선택 시트는 60,900원(현금) / 120,900원(카드).
 * 클릭해서 넘어가는 프로토타입에서 금액이 화면마다 바뀌면 고장난 것처럼 보이므로
 * 배달지 상세의 58,500원 하나로 통일했습니다.
 */

export type PaymentMethod = 'cash' | 'card' | 'qr' | 'split'

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: '현금',
  card: '카드',
  qr: 'QR 간편',
  split: '분할',
}

export const ORDER = {
  store: '부릉치킨 선릉점',
  status: '배달지로 이동해주세요',
  address: '강남대로 114길 10',
  addressDetail: ['강남대로 114길 10 부릉아파트 113동', '1906호 (역삼동)'],
  deliveryMessage: '벨 누르지 말고 문 앞에 두고 노크해주세요',
  pickupNumber: 'F2512011457J8ME2',
  orderNumber: '20249230141#1212',
  amount: 58500,
  deliveryFee: 5000,
  /** 고객 안심번호 — 영수증을 보낼 수신번호. 안심번호는 050으로 시작합니다. */
  safeNumber: '050-7124-8836',
  /** 영수증에 찍히는 결제일시 (목업이라 고정값) */
  paidAt: '2026. 07. 28. 19:42',
}

/*
 * 분할 결제 (1730:197705)
 *
 * 상품가액과 컵 보증금을 나눠서 여러 번에 걸쳐 받습니다. 두 값의 합이 총 결제 금액입니다.
 * 디자인의 분할 결제 시트는 60,000원 + 900원 = 60,900원으로 그려져 있는데, 프로토타입은
 * 금액을 58,500원으로 통일했으므로 컵 보증금 900원을 뺀 57,600원을 상품가액으로 둡니다.
 */
export const SPLIT = {
  productAmount: 57600,
  cupDeposit: 900,
  /** 컵 보증금 스테퍼 단위 — 컵 1개(300원)씩 올리고 내립니다. 디자인 값(300 / 900)에서 유추했습니다. */
  cupStep: 300,
}

/**
 * 결제 한 건. 분할 결제는 여러 건이 되고, 한 번에 다 받으면 한 건입니다.
 * 결제 내역 화면(1730:196892)과 취소(1730:198254)가 이 기록을 씁니다.
 */
export type SplitPayment = {
  method: Exclude<PaymentMethod, 'split'>
  /** 이번에 받은 상품가액 */
  product: number
  /** 이번에 받은 컵 보증금 */
  cup: number
  /** 결제일시 — 결제 내역에 찍힙니다 */
  paidAt?: string
  /** 취소일시 — 있으면 취소된 결제입니다 */
  cancelledAt?: string
  /** 카드 결제일 때 고른 할부 (1730:197143) */
  installment?: string
}

export function splitPaymentAmount(payment: SplitPayment) {
  return payment.product + payment.cup
}

/**
 * 5만원 이상 카드로 결제하면 서명을 등록해야 합니다 (1730:197571).
 * 안내 문구("5만원 이상 결제할 때 서명을 등록해야 해요")에 적힌 기준입니다.
 */
export const SIGNATURE_THRESHOLD = 50000

/**
 * 할부 개월 (1730:197143)
 * 디자인 목록은 11개월에서 잘려 있는데 **12개월까지**입니다 (2026-07-29 이재이 확인).
 */
export const INSTALLMENTS = [
  '일시불',
  ...Array.from({ length: 11 }, (_, index) => `${index + 2}개월`),
]

/** VAN 승인 결과 — 결제 내역에 찍히는 값. 디자인(1730:196892)에 적힌 값 그대로입니다. */
export const CARD_APPROVAL = {
  type: '신한',
  number: '5050-37**-****-****',
  approval: '24872930',
}

/** 결제 내역의 결제일시·취소일시 (목업이라 고정값, 1730:196892 / 1730:198254) */
export const PAYMENT_TIME = {
  paid: '2025.12.15 10:37:16',
  cancelled: '2025.12.15 10:50:16',
}

/** 분할 결제 진행 상황 — 남은 금액과 완료 여부. 취소된 결제는 받지 않은 것으로 봅니다. */
export function splitProgress(payments: SplitPayment[]) {
  const active = payments.filter((payment) => !payment.cancelledAt)
  const paidProduct = active.reduce((sum, p) => sum + p.product, 0)
  const paidCup = active.reduce((sum, p) => sum + p.cup, 0)
  // 과결제는 정상 흐름에서 나오지 않지만, 음수가 되면 화면 문구가 깨지므로 0에서 멈춥니다.
  const remainingProduct = Math.max(0, SPLIT.productAmount - paidProduct)
  const remainingCup = Math.max(0, SPLIT.cupDeposit - paidCup)
  return {
    paidProduct,
    paidCup,
    remainingProduct,
    remainingCup,
    remainingTotal: remainingProduct + remainingCup,
    done: remainingProduct === 0 && remainingCup === 0,
  }
}

/** 완료 화면의 결제 금액 라벨 (1723:157236 현금 / 1723:157270 카드 / 1730:197353 QR) */
export const COMPLETE_PRICE_LABEL: Record<PaymentMethod, string> = {
  cash: '현금 결제 금액 (M캐시 차감)',
  card: '카드 결제 금액',
  qr: 'QR 결제 금액',
  /* 분할은 총액 아래에 결제 내역이 줄줄이 붙습니다 (1730:197859) */
  split: '총 결제 금액',
}

/**
 * 카드 스캔(OCR)으로 읽어낸 값.
 * 디자인(1742:54183)에 적힌 값 그대로입니다 — 실제 OCR이 아니라 인식된 결과를 보여주는 화면입니다.
 */
export const SCANNED_CARD = {
  number: '1234 - 1234 - 1234 - 1234',
  expiry: '12 / 30',
}

/** 현금영수증 발급 유형별 입력 안내 */
export const CASH_RECEIPT_PLACEHOLDER = {
  personal: '휴대폰번호 또는 사업자등록번호',
  business: '사업자등록번호',
} as const

export type Mission = {
  label: string
  current: number
  total: number
}

export const MISSION_COUNT = 11

export const MISSIONS: Mission[] = [
  { label: '9건 더 하면 10,000원', current: 1, total: 10 },
  ...Array.from({ length: MISSION_COUNT - 1 }, () => ({
    label: '50건 더 하면 40,000원',
    current: 30,
    total: 80,
  })),
]

export function formatWon(value: number) {
  return value.toLocaleString('ko-KR')
}
