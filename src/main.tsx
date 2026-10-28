import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import { App } from '@/app/App'
import { APP_NAME } from '@/app/config'
import { registerServiceWorker } from '@/app/bootstrap'

document.title = APP_NAME
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
