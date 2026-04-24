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
        <h1 className="font-display text-xl font-semibold text-[#e2eeff] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#5a7a9a] mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
    </div>
  )
}
