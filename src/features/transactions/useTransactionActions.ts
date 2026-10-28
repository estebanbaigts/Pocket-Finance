import { useCallback, useState } from 'react'
import type { Transaction } from '@/domain/model'
import { settledStatusFor } from '@/domain/model'
import { formatCents } from '@/domain/money'
import { useToast } from '@/components/ui'
import { changeStatus } from './actions'

/** Ouverture de la fiche d'édition et règlement rapide (avec annulation), partagés entre les écrans. */
export function useTransactionActions() {
  const toast = useToast()
  const [editing, setEditing] = useState<Transaction | null>(null)

  const settle = useCallback(async (txn: Transaction) => {
    try {
      const previous = txn.status
      const updated = await changeStatus(txn, settledStatusFor(txn.type))
      toast({
        title: `${txn.description || 'Opération'} : ${formatCents(txn.amountCents)} ${txn.type === 'income' ? 'encaissé' : 'payé'}`,
        action: { label: 'Annuler', onClick: () => void changeStatus(updated, previous) },
      })
    } catch {
      toast({ title: 'Le statut n’a pas pu être modifié.', tone: 'error' })
    }
  }, [toast])

  return { editing, open: setEditing, close: () => setEditing(null), settle }
}
