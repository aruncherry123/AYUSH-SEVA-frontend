import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './state/StoreContext.tsx'
import { AuthProvider } from './state/AuthContext.tsx'
import { ToastProvider } from './state/ToastContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </StoreProvider>
  </StrictMode>,
)
