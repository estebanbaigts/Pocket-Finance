import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import { App } from '@/app/App'
import { APP_NAME } from '@/app/config'
import { registerServiceWorker } from '@/app/bootstrap'
import { applyTheme, storedTheme } from '@/lib/theme'

document.title = APP_NAME
registerServiceWorker()
applyTheme(storedTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
