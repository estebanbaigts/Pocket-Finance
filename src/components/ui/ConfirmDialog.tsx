import { Sheet } from './Sheet'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

/** Confirmation des actions destructrices. Le bouton par défaut est « Annuler ». */
export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, destructive = true }: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}
      footer={<>
        <Button variant="ghost" onClick={onCancel} data-autofocus>Annuler</Button>
        <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </>}>
      <p className="text-[14px] text-ink-2">{message}</p>
    </Sheet>
  )
}
