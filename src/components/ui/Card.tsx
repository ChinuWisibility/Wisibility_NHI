import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type AccentColor = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'none'

interface CardProps {
  children:  ReactNode
  accent?:   AccentColor
  className?: string
  padding?:  boolean
  onClick?:  () => void
}

const accents: Record<AccentColor, string> = {
  cyan:   'before:bg-cyber-cyan',
  green:  'before:bg-cyber-green',
  amber:  'before:bg-cyber-amber',
  red:    'before:bg-cyber-red',
  purple: 'before:bg-cyber-purple',
  none:   '',
}

export function Card({ children, accent = 'none', className, padding = true, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-surface rounded-xl border border-surface-border shadow-card overflow-hidden',
        accent !== 'none' && `before:absolute before:inset-x-0 before:top-0 before:h-[3px] ${accents[accent]}`,
        padding && 'p-4',
        onClick && 'cursor-pointer hover:border-brand/50 hover:shadow-card-hover transition-all duration-200',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-xs font-bold tracking-[0.09em] uppercase text-slate-600 dark:text-muted mb-3', className)}>
      {children}
    </div>
  )
}
