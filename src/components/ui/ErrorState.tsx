import { Button } from './Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <p className="font-mono text-[11px] tracking-widest uppercase text-cyber-red">Error</p>
      <p className="text-xs text-muted max-w-xs">{message}</p>
      {onRetry && <Button variant="primary" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  )
}
