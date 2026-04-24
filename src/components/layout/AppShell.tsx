import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { Toaster } from 'react-hot-toast'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-dark text-[#b8cfe6] font-body">
      <Sidebar />
      <div className="ml-[260px] flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0c1a2e',
            color:      '#b8cfe6',
            border:     '1px solid #162840',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize:   '12px',
          },
        }}
      />
    </div>
  )
}
