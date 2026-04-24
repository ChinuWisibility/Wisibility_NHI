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
          <label htmlFor={inputId} className="font-mono text-[10px] tracking-widest uppercase text-[#5a7a9a]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-surface-2 border border-surface-border rounded px-3 py-2 text-sm text-[#b8cfe6]',
            'placeholder:text-[#5a7a9a] focus:outline-none focus:border-cyber-cyan transition-colors',
            error && 'border-cyber-red',
            className,
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-cyber-red">{error}</p>}
        {hint && !error && <p className="text-[11px] text-[#5a7a9a]">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
