import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import { SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED } from './constants'

export function AppShell() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const width = sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED

  return (
    <div className="min-h-screen bg-bg-dark text-main font-body">
      <Sidebar />
      <div
        className={cn('flex flex-col min-h-screen transition-[margin] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]')}
        style={{ marginLeft: width }}
      >
        <TopNav />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
