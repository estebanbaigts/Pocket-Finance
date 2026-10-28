import type { TransactionStatus, TransactionType } from '@/domain/model'
import type { BadgeTone } from '@/components/ui'

export const TYPE_LABEL: Record<TransactionType, string> = { income: 'Revenu', expense: 'Dépense', transfer: 'Transfert' }

export function statusLabel(type: TransactionType, status: TransactionStatus): string {
  switch (status) {
    case 'planned': return 'Prévu'
    case 'confirmed': return 'Confirmé'
    case 'received': return 'Encaissé'
    case 'paid': return type === 'transfer' ? 'Effectué' : 'Payé'
    case 'cancelled': return 'Annulé'
  }
}

export function statusTone(status: TransactionStatus): BadgeTone {
  if (status === 'received' || status === 'paid') return 'positive'
  if (status === 'confirmed') return 'info'
  if (status === 'cancelled') return 'neutral'
  return 'warning'
}

/** Verbe de l'action rapide qui règle une opération en attente. */
export function settleVerb(type: TransactionType): string {
  return type === 'income' ? 'Marquer encaissé' : type === 'transfer' ? 'Marquer effectué' : 'Marquer payé'
}
