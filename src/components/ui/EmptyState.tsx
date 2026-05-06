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
      {icon && <div className="text-muted opacity-40">{icon}</div>}
      <p className="font-mono text-[11px] tracking-widest uppercase text-muted">{title}</p>
      {message && <p className="text-xs text-muted max-w-xs">{message}</p>}
      {action}
    </div>
  )
}
