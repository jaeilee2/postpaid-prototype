import radioOffA from '../assets/radio-off-a.svg'
import radioOffB from '../assets/radio-off-b.svg'
import radioOnDot from '../assets/radio-on-dot.svg'
import radioOnRing from '../assets/radio-on-ring.svg'

/** 라디오 버튼 — 현금영수증 유형(1723:157212)과 할부 선택(1730:197143)이 같은 컴포넌트를 씁니다. */
export function Radio({ checked }: { checked: boolean }) {
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
