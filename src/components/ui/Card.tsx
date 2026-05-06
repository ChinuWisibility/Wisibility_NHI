import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type AccentColor = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'none'

interface CardProps {
  children:  ReactNode
  accent?:   AccentColor
  className?: string
  padding?:  boolean
}

const accents: Record<AccentColor, string> = {
  cyan:   'border-t-cyber-cyan',
  green:  'border-t-cyber-green',
  amber:  'border-t-cyber-amber',
  red:    'border-t-cyber-red',
  purple: 'border-t-cyber-purple',
  none:   '',
}

export function Card({ children, accent = 'none', className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface rounded border border-surface-border',
        accent !== 'none' && `border-t-2 ${accents[accent]}`,
        padding && 'p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('font-mono text-[9px] tracking-[1.5px] uppercase text-muted mb-3', className)}>
      {children}
    </div>
  )
}
