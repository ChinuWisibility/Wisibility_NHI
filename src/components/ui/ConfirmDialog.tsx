import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@radix-ui/react-alert-dialog'

interface ConfirmDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  title:        string
  description:  string
  confirmLabel?: string
  onConfirm:    () => void
  danger?:      boolean
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirm', onConfirm, danger,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-surface border border-surface-border rounded-lg p-6 max-w-md shadow-2xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <AlertDialogTitle className="font-display text-sm font-semibold text-bright mb-2">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-xs text-muted mb-5">
          {description}
        </AlertDialogDescription>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel className="font-mono text-[10px] px-4 py-2 rounded border border-surface-border text-muted hover:text-bright bg-surface-2 transition-colors">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`font-mono text-[10px] px-4 py-2 rounded border transition-colors ${
              danger
                ? 'border-cyber-red/40 bg-cyber-red/10 text-cyber-red hover:bg-cyber-red/20'
                : 'border-cyber-cyan/40 bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20'
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
