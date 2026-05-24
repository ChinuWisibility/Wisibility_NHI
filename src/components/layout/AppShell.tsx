import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import { Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="min-h-screen bg-bg-dark text-main font-body">
      <Sidebar />
      <div className="ml-[260px] flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
