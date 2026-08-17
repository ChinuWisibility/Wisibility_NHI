import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?:    ReactNode
  title:    string
  message?: string
  action?:  ReactNode
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      {icon && <div className="text-slate-400 dark:text-muted">{icon}</div>}
      <p className="text-sm font-extrabold text-bright">{title}</p>
      {message && <p className="text-sm text-slate-600 dark:text-muted max-w-xs font-medium">{message}</p>}
      {action}
    </div>
  )
}
