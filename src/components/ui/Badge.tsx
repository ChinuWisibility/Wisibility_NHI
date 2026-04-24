import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeColor = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'dim'

interface BadgeProps {
  color?:    BadgeColor
  children:  ReactNode
  className?: string
}

const colors: Record<BadgeColor, string> = {
  cyan:   'text-cyber-cyan   bg-cyber-cyan/10   border-cyber-cyan/30',
  green:  'text-cyber-green  bg-cyber-green/10  border-cyber-green/30',
  amber:  'text-cyber-amber  bg-cyber-amber/10  border-cyber-amber/30',
  red:    'text-cyber-red    bg-cyber-red/10    border-cyber-red/30',
  purple: 'text-cyber-purple bg-cyber-purple/10 border-cyber-purple/30',
  dim:    'text-[#5a7a9a]    bg-surface-2       border-surface-border',
}

export function Badge({ color = 'cyan', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-mono text-[10px] tracking-wide px-2 py-0.5 rounded border',
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
