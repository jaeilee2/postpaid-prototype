import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 단일 HTML 파일로 배포해도 새로고침·딥링크가 동작하도록 해시 라우팅을 씁니다 (#/delivery).
import { HashRouter } from 'react-router-dom'

import App from './App.tsx'
import './styles/tokens.css'
import './styles/app.css'
import './styles/screens.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
