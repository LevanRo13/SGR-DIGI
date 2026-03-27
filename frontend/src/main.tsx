import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GuaranteeProvider } from './context/GuaranteeContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GuaranteeProvider>
        <App />
      </GuaranteeProvider>
    </BrowserRouter>
  </StrictMode>,
)

