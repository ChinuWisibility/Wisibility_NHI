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

const renderApp = (instance: any) => {
  const root = createRoot(document.getElementById('root')!)
  const content = (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </StrictMode>
  )

  root.render(
    instance ? <MsalProvider instance={instance}>{content}</MsalProvider> : content
  )
}

if (msalInstance) {
  msalInstance.initialize().then(() => renderApp(msalInstance))
} else {
  renderApp(null)
}
