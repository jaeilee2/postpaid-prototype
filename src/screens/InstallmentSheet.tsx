import { useState } from 'react'

import { IcClose } from '../components/Icon'
import { Radio } from '../components/Radio'
import { INSTALLMENTS } from '../data/order'
import { useOrder } from '../state/OrderContext'

/* 할부 선택 시트 (1730:197143)
 *
 * 시트 높이 641. 목록은 스크롤되고, 아래 버튼 두 개(취소 / 선택 완료)는 고정입니다.
 * 고른 값은 "선택 완료"를 눌러야 반영됩니다.
 */

export function InstallmentSheet({ onClose }: { onClose: () => void }) {
  const { installment, setInstallment } = useOrder()
  const [picked, setPicked] = useState(installment)

  return (
    <>
      <div className="dimmed dimmed--top" onClick={onClose} />
      <div className="sheet is__sheet">
        <div className="sheet__header is__header">
          <span className="t-subtitle1-18-bold">할부</span>
          <button className="sheet__close" onClick={onClose} aria-label="닫기">
            <IcClose />
          </button>
        </div>

        <div className="is__list">
          {INSTALLMENTS.map((option) => (
            <button
              className="is__option"
              key={option}
              onClick={() => setPicked(option)}
              aria-pressed={picked === option}
            >
              <Radio checked={picked === option} />
              <span className="t-body2-16-regular">{option}</span>
            </button>
          ))}
        </div>

        <div className="sheet__actions is__actions">
          <button className="btn-tertiary btn--h48 t-body2-16-medium" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-primary btn--h48 t-body2-16-medium"
            onClick={() => {
              setInstallment(picked)
              onClose()
            }}
          >
            선택 완료
          </button>
        </div>
      </div>
    </>
  )
}
