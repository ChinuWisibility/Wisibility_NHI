import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
}

const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary:
    'text-white border-transparent bg-gradient-to-br from-[#3b82f6] to-[#2563EB] shadow-[0_4px_0_rgba(30,58,138,0.28),0_6px_12px_rgba(37,99,235,0.22)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(30,58,138,0.28),0_10px_16px_rgba(37,99,235,0.28)] active:translate-y-0.5 active:shadow-[0_2px_0_rgba(30,58,138,0.28)]',
  secondary:
    'bg-white dark:bg-surface text-slate-800 dark:text-main border-slate-300 dark:border-surface-border shadow-sm hover:border-blue-400 hover:text-brand hover:bg-blue-50 hover:-translate-y-px',
  danger:
    'bg-red-50 text-red-700 border-red-300 shadow-sm hover:bg-red-100 hover:-translate-y-px',
  ghost:
    'bg-transparent text-slate-600 dark:text-muted border-transparent hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-surface-2',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2 text-sm',
  lg: 'px-5 py-3 text-[15px] rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
