import { useState } from 'react'

import { IcClose } from '../components/Icon'
import { NumberKeypad } from '../components/NumberKeypad'
import { Radio } from '../components/Radio'
import { CASH_RECEIPT_PLACEHOLDER } from '../data/order'

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

export function CashReceiptSheet({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  const [type, setType] = useState<ReceiptType>('personal')
  const [number, setNumber] = useState('')
  /* 카드번호 입력(1723:157655)처럼 앱이 그리는 키패드가 바로 올라옵니다. */
  const [keypadOpen, setKeypadOpen] = useState(true)

  const MAX_DIGITS = 13

  return (
    <>
      <div className="dimmed dimmed--top" onClick={onCancel} />
      <div className={`sheet cr__sheet ${keypadOpen ? 'sheet--lifted' : ''}`}>
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
          <button
            className={`textfield textfield--tap t-body2-16-regular ${
              keypadOpen ? 'textfield--active' : ''
            }`}
            onClick={() => setKeypadOpen(true)}
          >
            {number === '' ? (
              <>
                {keypadOpen && <span className="caret" />}
                <span className="textfield__placeholder">{CASH_RECEIPT_PLACEHOLDER[type]}</span>
              </>
            ) : (
              <>
                <span>{number}</span>
                {keypadOpen && <span className="caret" />}
              </>
            )}
          </button>
        </div>

        <div className="sheet__actions" style={{ marginTop: 'auto' }}>
          <button className="btn-tertiary btn--h48 t-body2-16-medium" onClick={onCancel}>
            취소
          </button>
          <button
            className="btn-primary btn--h48 t-body2-16-medium"
            disabled={number.length === 0}
            onClick={onConfirm}
          >
            확인
          </button>
        </div>
      </div>

      {keypadOpen && (
        <NumberKeypad
          onDigit={(digit) => setNumber((v) => (v.length >= MAX_DIGITS ? v : v + digit))}
          onBackspace={() => setNumber((v) => v.slice(0, -1))}
          onDone={() => setKeypadOpen(false)}
        />
      )}
    </>
  )
}
