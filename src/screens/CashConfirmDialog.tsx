import { IcClose } from '../components/Icon'

/* 현금 결제 확인 다이얼로그 (1723:156090)
 *
 * 디자인의 왼쪽 버튼은 `취소`인데, 여기서 다른 결제 방법으로 바로 갈 수 있어야 해서
 * `다른 결제방법`으로 바꾸고 닫기는 오른쪽 위 X로 옮겼습니다 (2026-07-29 이재이 확인).
 */

export function CashConfirmDialog({
  onClose,
  onOtherMethod,
  onConfirm,
}: {
  onClose: () => void
  onOtherMethod: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <div className="dimmed" onClick={onClose} />
      <div className="dialog" role="dialog" aria-modal="true">
        <button className="dialog__close" onClick={onClose} aria-label="닫기">
          <IcClose />
        </button>

        <p className="dialog__title dialog__title--with-close t-subtitle1-18-bold" style={{ margin: 0 }}>
          현금으로 결제하시겠어요?
        </p>
        <p className="dialog__body t-body2-16-regular" style={{ margin: 0 }}>
          고객에게 받은 현금만큼 기사님의 M캐시가 차감돼요.
        </p>

        <div className="dialog__actions">
          <button className="btn-tertiary btn--h48 t-body2-16-medium" onClick={onOtherMethod}>
            다른 결제방법
          </button>
          <button
            className="dialog__actions-confirm btn-primary btn--h48 t-body2-16-medium"
            onClick={onConfirm}
          >
            현금 결제
          </button>
        </div>
      </div>
    </>
  )
}
