/*
 * 숫자 키패드 — 앱이 그리는 키패드입니다.
 *
 * 원래 현금영수증 발급번호와 분할 결제 금액은 실제 `<input>`이라 OS 키보드가 올라왔는데,
 * 이 프로토타입은 360×740 프레임을 `transform: scale`로 띄우는 구조라 사파리가 "입력 필드를
 * 보이게" 하려고 **페이지 전체를 밀어올려서** 화면이 깨졌습니다. 시트를 키보드 높이만큼
 * 올려봐도 사파리가 높이를 알려주기 전에 이미 밀어버려서 완전히 막을 수 없었습니다.
 *
 * 그래서 OS 키보드를 아예 쓰지 않습니다. 카드번호 입력이 보안키패드를 쓰는 것과 같은 방식이고
 * (`SecurityKeypad`), 높이를 우리가 정하니 시트가 잘리지도 않습니다.
 */

function IconBackspace() {
  return (
    <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden="true">
      <path
        d="M8.5 1.5H24a.5.5 0 0 1 .5.5v16a.5.5 0 0 1-.5.5H8.5L1.2 10.3a.5.5 0 0 1 0-.6L8.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="m12 6.5 7 7M19 6.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function NumberKeypad({
  onDigit,
  onBackspace,
  onDone,
}: {
  onDigit: (digit: number) => void
  onBackspace: () => void
  onDone: () => void
}) {
  return (
    <div className="numpad">
      <div className="numpad__bar">
        <button className="numpad__done t-body2-16-medium" onClick={onDone}>
          완료
        </button>
      </div>
      <div className="numpad__grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button className="numpad__key" key={digit} onClick={() => onDigit(digit)}>
            {digit}
          </button>
        ))}
        <span className="numpad__key numpad__key--empty" />
        <button className="numpad__key" onClick={() => onDigit(0)}>
          0
        </button>
        <button
          className="numpad__key numpad__key--fn"
          onClick={onBackspace}
          aria-label="한 글자 지우기"
        >
          <IconBackspace />
        </button>
      </div>
    </div>
  )
}
