import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
}

const base = 'inline-flex items-center justify-center gap-2 font-mono text-xs tracking-wide rounded border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:   'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/40 hover:bg-cyber-cyan/20 hover:border-cyber-cyan',
  secondary: 'bg-surface-2 text-text border-surface-border hover:bg-surface-3 hover:border-surface-border',
  danger:    'bg-cyber-red/10 text-cyber-red border-cyber-red/40 hover:bg-cyber-red/20 hover:border-cyber-red',
  ghost:     'bg-transparent text-dim border-transparent hover:text-hi hover:bg-surface-2',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-4 py-2',
  lg: 'px-5 py-2.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
