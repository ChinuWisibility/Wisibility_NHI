import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

interface PageHeaderProps {
  title:       string
  subtitle?:   string
  actions?:    ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs)

  useEffect(() => {
    if (breadcrumbs) setBreadcrumbs(breadcrumbs)
    return () => setBreadcrumbs([])
  }, [breadcrumbs, setBreadcrumbs])

  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-[1.5rem] font-extrabold text-bright tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600 dark:text-muted mt-1 max-w-2xl font-medium">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
    </div>
  )
}
