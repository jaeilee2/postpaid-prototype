import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import icClearRing from '../assets/ic-clear-ring.svg'
import icClearX from '../assets/ic-clear-x.svg'
import {
  AppBar,
  CardTotal,
  PaymentProgress,
  useEnsureCardMethod,
  usePaymentSettle,
  useNeedsSignature,
} from '../components/CardChrome'
import { Snackbar } from '../components/Chrome'
import { IcCamera, IcCreditCard } from '../components/Icon'
import { SecurityKeypad } from '../components/SecurityKeypad'
import { useOrder } from '../state/OrderContext'

/* 카드 직접 입력 (1723:157655 입력 전 / 1723:157657 입력 완료)
 *
 * 화면에 들어오면 카드번호 필드가 활성화되고 보안키패드가 바로 올라옵니다.
 * 카드번호 16자리를 채우면 유효기간으로 넘어가고, 유효기간 4자리를 채우면
 * 키패드가 내려가면서 결제하기 버튼이 나옵니다.
 *
 * `/card/cancel/keyin`으로 들어오면 **취소 모드**입니다 — 카드를 태그하지 못할 때
 * 카드번호를 직접 입력해서 결제를 취소합니다. 금액 라벨과 버튼 문구만 달라집니다.
 */

const CARD_DIGITS = 16
const EXPIRY_DIGITS = 4
/** 카드번호는 앞 8자리만 보이고 뒤 8자리는 마스킹합니다. */
const CARD_VISIBLE_DIGITS = 8

type Field = 'card' | 'expiry'

/** 카드번호를 "1234 - 1234 - •••• - ••••" 형태로 만듭니다. */
function formatCardNumber(digits: string) {
  const masked = digits
    .split('')
    .map((char, index) => (index < CARD_VISIBLE_DIGITS ? char : '•'))
    .join('')
  return (masked.match(/.{1,4}/g) ?? []).join(' - ')
}

/** 유효기간은 전부 마스킹해 "•• / ••"로 보여줍니다. */
function formatExpiry(digits: string) {
  const dots = '•'.repeat(digits.length)
  if (digits.length <= 2) return dots
  return `${dots.slice(0, 2)} / ${dots.slice(2)}`
}

/**
 * 입력 커서. 실제 `<input>`이 아니라 직접 그리므로 위치도 직접 잡습니다 —
 * 비어 있을 때는 플레이스홀더 앞(맨 앞), 입력 중에는 마지막 글자 뒤입니다.
 */
function Caret({
  visible,
  at,
  empty,
}: {
  visible: boolean
  at: 'before' | 'after'
  empty: boolean
}) {
  if (!visible) return null
  if (at === 'before' ? !empty : empty) return null
  return <span className="keyin__caret" />
}

export function CardKeyin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { cancelPayment, cancelTarget } = useOrder()
  /** 취소 모드 — 결제가 아니라 결제 취소를 위해 카드번호를 입력합니다. */
  const cancelMode = location.pathname === '/card/cancel/keyin'
  useEnsureCardMethod()
  const settle = usePaymentSettle('card')
  const needsSignature = useNeedsSignature()

  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [field, setField] = useState<Field>('card')
  const [keypadOpen, setKeypadOpen] = useState(true)
  const [paying, setPaying] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const cardDone = card.length === CARD_DIGITS
  const expiryDone = expiry.length === EXPIRY_DIGITS
  const canPay = cardDone && expiryDone

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(null), 2600)
  }

  function focusField(next: Field) {
    setField(next)
    setKeypadOpen(true)
  }

  /*
   * 입력은 이전 값을 함수로 받아 이어붙입니다 — 빠르게 여러 번 눌려도 숫자가 빠지지 않습니다.
   * 필드 전환과 키패드 내리기는 값이 다 찬 것을 보고 따라갑니다.
   */
  function handleDigit(digit: number) {
    if (field === 'card') {
      setCard((current) => (current + digit).slice(0, CARD_DIGITS))
      return
    }
    setExpiry((current) => (current + digit).slice(0, EXPIRY_DIGITS))
  }

  function handleBackspace() {
    if (field === 'expiry') {
      if (expiry.length > 0) {
        setExpiry((current) => current.slice(0, -1))
        return
      }
      // 유효기간이 비어 있으면 카드번호로 돌아갑니다.
      setField('card')
      setCard((current) => current.slice(0, -1))
      return
    }
    setCard((current) => current.slice(0, -1))
  }

  // 카드번호가 다 차면 유효기간으로 자동 이동합니다.
  useEffect(() => {
    if (cardDone && field === 'card') setField('expiry')
  }, [cardDone, field])

  // 유효기간까지 채우면 키패드가 내려가고 결제하기가 나옵니다.
  useEffect(() => {
    if (expiryDone) setKeypadOpen(false)
  }, [expiryDone])

  function handleEnter() {
    if (field === 'card' && cardDone) {
      setField('expiry')
      return
    }
    if (field === 'expiry' && expiryDone) {
      setKeypadOpen(false)
      return
    }
    showNotice(field === 'card' ? '카드번호 16자리를 입력해 주세요' : '유효기간을 입력해 주세요')
  }

  function pay() {
    if (paying) return
    setKeypadOpen(false)

    // 취소 모드는 서명 없이 바로 취소합니다 (1730:197613의 카드 직접 입력 경로).
    if (cancelMode) {
      const index = cancelTarget ?? 0
      setPaying(true)
      window.setTimeout(() => {
        cancelPayment(index)
        navigate('/tasks/payment', { replace: true, state: { cancelled: index } })
      }, 1500)
      return
    }

    // 5만원 이상이면 결제 진행 전에 서명을 받습니다 (1730:197571).
    if (needsSignature) {
      navigate('/sign')
      return
    }
    setPaying(true)
    window.setTimeout(settle, 1500)
  }

  function clearExpiry() {
    setExpiry('')
    focusField('expiry')
  }

  return (
    <div className="card-screen">
      <AppBar
        title="카드 직접 입력"
        onBack={() => navigate(cancelMode ? '/card/cancel' : '/card')}
        onAction={() => navigate('/kispay')}
      />

      <div
        className="card-body card-body--keyin"
        style={{ paddingBottom: keypadOpen && !paying ? 250 : 96 }}
      >
        <span className="spacer spacer--k1" />
        <CardTotal cancel={cancelMode} />
        <span className="spacer spacer--k2" />

        {/* 카드번호 */}
        <div className="keyin__field keyin__field--card">
          <p className="keyin__label t-body4-13-medium">카드번호</p>
          <button
            className={`keyin__input-row ${field === 'card' ? 'keyin__input-row--active' : ''}`}
            onClick={() => focusField('card')}
            aria-label="카드번호 입력"
          >
            <IcCreditCard />
            <span
              className={`keyin__value t-body2-16-regular ${
                card ? '' : 'keyin__value--placeholder'
              }`}
            >
              {/* 캐럿은 실제 입력 커서 자리에 둡니다 — 비어 있으면 플레이스홀더 앞, 입력 중이면 뒤. */}
              <Caret visible={field === 'card' && keypadOpen} at="before" empty={!card} />
              {card ? formatCardNumber(card) : '0000 - 0000 - 0000 - 0000'}
              <Caret visible={field === 'card' && keypadOpen} at="after" empty={!card} />
            </span>
          </button>
        </div>

        {/* 유효기간 — 카드번호를 다 채우면 나타납니다. */}
        {cardDone && (
          <div className="keyin__field keyin__field--expiry">
            <p className="keyin__label t-body4-13-medium">유효기간</p>
            <button
              className={`keyin__input-row ${field === 'expiry' ? 'keyin__input-row--active' : ''}`}
              onClick={() => focusField('expiry')}
              aria-label="유효기간 입력"
            >
              <span
                className={`keyin__value t-body2-16-regular ${
                  expiry ? '' : 'keyin__value--placeholder'
                }`}
              >
                <Caret visible={field === 'expiry' && keypadOpen} at="before" empty={!expiry} />
                {expiry ? formatExpiry(expiry) : 'MM / YY'}
                <Caret visible={field === 'expiry' && keypadOpen} at="after" empty={!expiry} />
              </span>
              {expiry.length > 0 && (
                <span
                  className="keyin__clear"
                  onClick={(event) => {
                    event.stopPropagation()
                    clearExpiry()
                  }}
                  role="button"
                  aria-label="유효기간 지우기"
                >
                  <img className="keyin__clear-ring" src={icClearRing} alt="" />
                  <img className="keyin__clear-x" src={icClearX} alt="" />
                </span>
              )}
            </button>
          </div>
        )}

        {/* 카드 스캔하기는 카드번호를 입력하는 동안만 보입니다 (1723:157655).
            취소 모드에는 스캔으로 취소하는 화면이 없어 숨깁니다. */}
        {!cardDone && !cancelMode && (
          <button
            className="keyin__scan btn-chip t-body3-14-medium"
            onClick={() => navigate('/card/scan')}
          >
            <IcCamera />
            카드 스캔하기
          </button>
        )}

        <span className="spacer spacer--fill" />
      </div>

      {/* 키패드가 내려가면 결제하기가 보입니다 (1723:157657). */}
      {!keypadOpen && !paying && (
        <div className="keyin__action-bar">
          <button
            className="btn-primary btn--h56 t-body2-16-medium"
            disabled={!canPay}
            onClick={pay}
          >
            {cancelMode ? '카드 결제 취소' : '결제하기'}
          </button>
        </div>
      )}

      {keypadOpen && !paying && (
        <SecurityKeypad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          onEnter={handleEnter}
        />
      )}

      {notice && <Snackbar text={notice} />}
      {paying && <PaymentProgress label={cancelMode ? '취소 진행중' : '결제 진행중'} />}
    </div>
  )
}
