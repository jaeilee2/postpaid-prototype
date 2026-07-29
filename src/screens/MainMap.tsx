import { useNavigate } from 'react-router-dom'

import { MapMainBackground } from '../components/Chrome'

/* 메인 지도 · 신규배차 ON — 완료 화면에서 "확인"을 누르면 도달합니다.
 *
 * 결제를 마친 뒤 결제 취소를 보려면 수행목록으로 다시 들어가야 하므로
 * 여기에도 `수행목록` FAB을 뒀습니다 (디자인에는 없습니다 — Chrome.tsx 주석 참고).
 */

export function MainMap() {
  const navigate = useNavigate()

  return (
    <div className="screen">
      <MapMainBackground onTasks={() => navigate('/tasks')} />
    </div>
  )
}
