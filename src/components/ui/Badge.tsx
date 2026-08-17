import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type BadgeColor = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'dim' | 'blue'

interface BadgeProps {
  color?:    BadgeColor
  children:  ReactNode
  className?: string
}

const colors: Record<BadgeColor, string> = {
  cyan:   'text-blue-800   bg-blue-50   border-blue-200 dark:text-cyber-cyan dark:bg-cyber-cyan/15 dark:border-cyber-cyan/40',
  green:  'text-green-800  bg-green-50  border-green-200 dark:text-cyber-green dark:bg-cyber-green/15 dark:border-cyber-green/40',
  amber:  'text-amber-800  bg-amber-50  border-amber-300 dark:text-cyber-amber dark:bg-cyber-amber/15 dark:border-cyber-amber/40',
  red:    'text-red-800    bg-red-50    border-red-200 dark:text-cyber-red dark:bg-cyber-red/15 dark:border-cyber-red/40',
  purple: 'text-purple-800 bg-purple-50 border-purple-200 dark:text-cyber-purple dark:bg-cyber-purple/15 dark:border-cyber-purple/40',
  dim:    'text-slate-700  bg-slate-100 border-slate-300 dark:text-muted dark:bg-surface-2 dark:border-surface-border',
  blue:   'text-blue-800   bg-blue-50   border-blue-200',
}

export function Badge({ color = 'cyan', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-[12px] font-bold px-2 py-0.5 rounded border h-[22px]',
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  )
}
