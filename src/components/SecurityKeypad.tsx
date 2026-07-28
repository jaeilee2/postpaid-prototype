import { useCallback, useState } from 'react'

/*
 * 보안키패드 (1723:157655 하단)
 *
 * 디자인에서는 실제 키패드를 캡처한 이미지로 들어가 있어서, 같은 모양으로 동작하는
 * 컴포넌트를 만들었습니다. 숫자는 보안키패드 특성대로 무작위 배치되고 빈칸이 생기며,
 * 셔플 키로 다시 섞을 수 있습니다.
 *
 * OS 키보드가 아니라 앱이 그리는 키패드이므로 실제 <input>을 쓰지 않습니다 —
 * 그래야 폰에서 OS 키보드가 함께 올라오지 않습니다.
 */

/** 숫자 10개 + 빈칸 2개를 3×4로 섞습니다. */
function shuffledKeys(): (number | null)[] {
  const keys: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, null, null]
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
  }
  return keys
}

function IconBackspace() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
      <path
        d="M7 1h13a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7L1 9l6-8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="m10 6 6 6M16 6l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function IconShuffle() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
      <path
        d="M2 4h4l10 10h4M2 14h4L16 4h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="m17 1 3 3-3 3M17 11l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconEnter() {
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
      <path
        d="M20 2v7a3 3 0 0 1-3 3H3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="m7 8-4 4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SecurityKeypad({
  onDigit,
  onBackspace,
  onEnter,
}: {
  onDigit: (digit: number) => void
  onBackspace: () => void
  onEnter: () => void
}) {
  const [keys, setKeys] = useState<(number | null)[]>(shuffledKeys)
  const reshuffle = useCallback(() => setKeys(shuffledKeys()), [])

  return (
    <div className="keypad">
      <div className="keypad__grid">
        {keys.map((key, index) =>
          key === null ? (
            <span className="keypad__key keypad__key--empty" key={`empty-${index}`} />
          ) : (
            <button className="keypad__key" key={key} onClick={() => onDigit(key)}>
              {key}
            </button>
          ),
        )}

        <button
          className="keypad__key keypad__key--fn"
          onClick={onBackspace}
          aria-label="한 글자 지우기"
        >
          <IconBackspace />
        </button>
        <button className="keypad__key keypad__key--fn" onClick={reshuffle} aria-label="숫자 재배치">
          <IconShuffle />
        </button>
        <button
          className="keypad__key keypad__key--fn keypad__key--wide"
          onClick={onEnter}
          aria-label="입력 완료"
        >
          <IconEnter />
        </button>
      </div>

      {/* 디자인 캡처에 포함된 OS 내비게이션 바 */}
      <div className="keypad__navbar" aria-hidden="true">
        <span>|||</span>
        <span>○</span>
        <span>‹</span>
      </div>
    </div>
  )
}
