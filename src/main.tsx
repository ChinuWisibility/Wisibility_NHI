import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from '@/config/azure-config'
import { queryClient } from '@/config/queryClient'
import App from './App'
import './styles/global.css'

// Initialize MSAL (registers redirect handler) before mounting React
msalInstance.initialize().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </MsalProvider>
    </StrictMode>,
  )
})
