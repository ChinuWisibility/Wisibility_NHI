import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { Toaster } from 'react-hot-toast'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-dark text-main font-body">
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
            background: 'var(--color-surface-2)',
            color:      'var(--color-text-main)',
            border:     '1px solid var(--color-surface-border)',
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize:   '12px',
          },
        }}
      />
    </div>
  )
}
