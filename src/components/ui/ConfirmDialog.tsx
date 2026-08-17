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
      <AlertDialogContent className="bg-surface border-[1.5px] border-slate-300 dark:border-surface-border rounded-[20px] p-6 max-w-md shadow-[0_20px_60px_rgba(15,23,42,0.15)] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        <AlertDialogTitle className="text-base font-extrabold text-bright mb-2 tracking-tight">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="text-sm text-muted mb-5 font-medium">
          {description}
        </AlertDialogDescription>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel className="text-sm font-bold px-4 py-2 rounded-lg border border-surface-border text-muted hover:text-bright bg-surface-2 transition-colors">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`text-sm font-bold px-4 py-2 rounded-lg border transition-all ${
              danger
                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                : 'border-transparent text-white bg-gradient-to-br from-[#3b82f6] to-[#2563EB] shadow-[0_4px_0_rgba(30,58,138,0.28)]'
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
