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

/** 완료 화면의 결제 금액 라벨 (1723:157236 현금 / 1723:157270 카드 / 1730:197353 QR) */
export const COMPLETE_PRICE_LABEL: Record<PaymentMethod, string> = {
  cash: '현금 결제 금액 (M캐시 차감)',
  card: '카드 결제 금액',
  qr: 'QR 결제 금액',
  split: '분할 결제 금액',
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
