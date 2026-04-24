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
  cyan:   { border: 'border-t-cyber-cyan',   text: 'text-cyber-cyan'   },
  green:  { border: 'border-t-cyber-green',  text: 'text-cyber-green'  },
  amber:  { border: 'border-t-cyber-amber',  text: 'text-cyber-amber'  },
  red:    { border: 'border-t-cyber-red',    text: 'text-cyber-red'    },
  purple: { border: 'border-t-cyber-purple', text: 'text-cyber-purple' },
}

export function StatCard({ label, value, sub, icon, accent = 'cyan', className }: StatCardProps) {
  const a = accents[accent]
  return (
    <div className={cn('bg-surface-2 border border-surface-border border-t-2 rounded p-4', a.border, className)}>
      <div className="flex items-start justify-between mb-2">
        <p className="font-mono text-[9px] tracking-[1.5px] uppercase text-[#5a7a9a]">{label}</p>
        {icon && <span className={cn('opacity-60', a.text)}>{icon}</span>}
      </div>
      <p className={cn('font-display text-2xl font-bold', a.text)}>{value}</p>
      {sub && <p className="text-[11px] text-[#5a7a9a] mt-1">{sub}</p>}
    </div>
  )
}
