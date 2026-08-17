import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-white dark:bg-surface-2 border-[1.5px] border-slate-300 dark:border-surface-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-main',
            'placeholder:text-slate-500 placeholder:font-normal',
            'shadow-sm',
            'focus:outline-none focus:border-brand focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40',
            'transition-all duration-200',
            error && 'border-red-400 bg-red-50 focus:ring-red-100',
            className,
          )}
          {...props}
        />
        {error && <p className="text-[11px] font-medium text-red-700">{error}</p>}
        {hint && !error && <p className="text-[11px] text-slate-600 dark:text-muted">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
