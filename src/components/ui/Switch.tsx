interface SwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label?: string
  size?: 'sm' | 'md'
  className?: string
}

export function Switch({ enabled, onChange, label, size = 'md', className = '' }: SwitchProps) {
  const isSm = size === 'sm'

  const button = (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex flex-shrink-0 transition-colors duration-200 ease-in-out border-2 border-transparent rounded-full cursor-pointer focus:outline-none ${
        isSm ? 'h-5 w-9' : 'h-6 w-11'
      } ${enabled ? 'bg-brand' : 'bg-slate-300 dark:bg-surface-border'} ${className}`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
          isSm ? 'h-4 w-4' : 'h-5 w-5'
        } ${
          enabled
            ? (isSm ? 'translate-x-4' : 'translate-x-5')
            : 'translate-x-0'
        }`}
      />
    </button>
  )

  if (!label) return button

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-muted">
        {label}
      </label>
      {button}
    </div>
  )
}
