import { useState } from 'react'

import { IcClose } from '../components/Icon'
import { CASH_RECEIPT_PLACEHOLDER } from '../data/order'
import radioOffA from '../assets/radio-off-a.svg'
import radioOffB from '../assets/radio-off-b.svg'
import radioOnDot from '../assets/radio-on-dot.svg'
import radioOnRing from '../assets/radio-on-ring.svg'

/* 현금영수증 발급번호 입력 (1723:157212)
 *
 * 디자인의 오른쪽 버튼은 라벨이 "버튼"인 disabled 상태로 놓여 있습니다.
 * 발급번호를 입력해야 활성화되는 "확인" 버튼으로 구현했습니다.
 */

type ReceiptType = keyof typeof CASH_RECEIPT_PLACEHOLDER

const OPTIONS: { key: ReceiptType; label: string }[] = [
  { key: 'personal', label: '개인 소득공제용' },
  { key: 'business', label: '사업자 지출증빙' },
]

function Radio({ checked }: { checked: boolean }) {
  return (
    <span className="radio">
      <img src={radioOffA} alt="" />
      <img src={checked ? radioOnRing : radioOffB} alt="" />
      {checked && (
        <span className="radio__dot">
          <img src={radioOnDot} alt="" />
        </span>
      )}
    </span>
  )
}

export function CashReceiptSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  const [type, setType] = useState<ReceiptType>('personal')
  const [number, setNumber] = useState('')

  return (
    <>
      <div className="dimmed dimmed--top" onClick={onCancel} />
      <div className="sheet cr__sheet">
        <div className="sheet__header cr__header">
          <span className="t-subtitle1-18-bold">현금영수증 발급번호 입력</span>
          <button className="sheet__close" onClick={onCancel} aria-label="닫기">
            <IcClose />
          </button>
        </div>

        <div className="cr__list">
          {OPTIONS.map((option) => (
            <button
              key={option.key}
              className="cr__option"
              onClick={() => setType(option.key)}
              aria-pressed={type === option.key}
            >
              <Radio checked={type === option.key} />
              <span className="t-body2-16-regular">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="cr__field">
          <input
            className="textfield t-body2-16-regular"
            placeholder={CASH_RECEIPT_PLACEHOLDER[type]}
            inputMode="numeric"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
          />
        </div>

        <div className="sheet__actions" style={{ marginTop: 'auto' }}>
          <button className="btn-tertiary btn--h48 t-body2-16-medium" onClick={onCancel}>
            취소
          </button>
          <button
            className="btn-primary btn--h48 t-body2-16-medium"
            disabled={number.trim().length === 0}
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </>
  )
}
