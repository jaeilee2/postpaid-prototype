/* 현금 결제 확인 다이얼로그 (1723:156090) */

export function CashConfirmDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <div className="dimmed" onClick={onCancel} />
      <div className="dialog" role="dialog" aria-modal="true">
        <p className="dialog__title t-subtitle1-18-bold" style={{ margin: 0 }}>
          현금으로 결제하시겠어요?
        </p>
        <p className="dialog__body t-body2-16-regular" style={{ margin: 0 }}>
          고객에게 받은 현금만큼 기사님의 M캐시가 차감돼요.
        </p>
        <button className="dialog__cancel btn-tertiary btn--h48 t-body2-16-medium" onClick={onCancel}>
          취소
        </button>
        <button
          className="dialog__confirm btn-primary btn--h48 t-body2-16-medium"
          onClick={onConfirm}
        >
          현금 결제
        </button>
      </div>
    </>
  )
}
