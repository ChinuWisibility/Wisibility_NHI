import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface StatCardProps {
  label:      string
  value:      string | number
  sub?:       string
  icon?:      ReactNode
  accent?:    'cyan' | 'green' | 'amber' | 'red' | 'purple'
  className?: string
}

const accents = {
  cyan:   { bar: 'from-cyber-cyan/80 to-cyber-cyan',   text: 'text-cyber-cyan',   iconBg: 'bg-cyber-cyan/10' },
  green:  { bar: 'from-cyber-green/80 to-cyber-green',  text: 'text-cyber-green',  iconBg: 'bg-cyber-green/10' },
  amber:  { bar: 'from-cyber-amber/80 to-cyber-amber',  text: 'text-cyber-amber',  iconBg: 'bg-cyber-amber/10' },
  red:    { bar: 'from-cyber-red/80 to-cyber-red',      text: 'text-cyber-red',    iconBg: 'bg-cyber-red/10' },
  purple: { bar: 'from-cyber-purple/80 to-cyber-purple', text: 'text-cyber-purple', iconBg: 'bg-cyber-purple/10' },
}

export function StatCard({ label, value, sub, icon, accent = 'cyan', className }: StatCardProps) {
  const a = accents[accent]
  return (
    <div className={cn('relative bg-surface border border-surface-border rounded-xl p-4 shadow-card overflow-hidden', className)}>
      <div className={cn('absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r', a.bar)} />
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-bold tracking-[0.09em] uppercase text-slate-600 dark:text-muted">{label}</p>
        {icon && (
          <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', a.iconBg, a.text)}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn('text-2xl font-extrabold tracking-tight', a.text)}>{value}</p>
      {sub && <p className="text-[12px] text-slate-600 dark:text-muted mt-1 font-medium">{sub}</p>}
    </div>
  )
}
