import { useCallback, useState } from 'react'
import type { Transaction } from '@/domain/model'
import { settledStatusFor } from '@/domain/model'
import { formatCents } from '@/domain/money'
import { useToast } from '@/components/ui'
import { updateEntity } from '@/services/storage'
import { useToday } from '../data/useToday'
import { changeStatus } from './actions'
import { SettleChoiceSheet } from './SettleChoiceSheet'

/** Fiche d'édition et règlement rapide (avec annulation), partagés entre les écrans. */
export function useTransactionActions() {
  const toast = useToast()
  const today = useToday()
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [choosing, setChoosing] = useState<Transaction | null>(null)

  const settleOn = useCallback(async (txn: Transaction, date: string) => {
    setChoosing(null)
    try {
      const previous = { status: txn.status, date: txn.date, dateEstimated: txn.dateEstimated }
      if (date !== txn.date) await updateEntity('transactions', txn.id, { date, dateEstimated: false })
      const updated = await changeStatus({ ...txn, date }, settledStatusFor(txn.type))
      toast({
        title: `${txn.description || 'Opération'} : ${formatCents(txn.amountCents)} ${txn.type === 'income' ? 'encaissé' : 'réglé'}`,
        action: { label: 'Annuler', onClick: () => void changeStatus(updated, previous.status).then(() => updateEntity('transactions', txn.id, { date: previous.date, dateEstimated: previous.dateEstimated })) },
      })
    } catch {
      toast({ title: 'Le statut n’a pas pu être modifié.', tone: 'error' })
    }
  }, [toast])

  // Échéance passée : on demande la date réelle de règlement ; sinon, réglée à sa date.
  const settle = useCallback((txn: Transaction) => {
    if (txn.date < today) setChoosing(txn)
    else void settleOn(txn, txn.date)
  }, [today, settleOn])

  const settleDialog = <SettleChoiceSheet txn={choosing} today={today} onClose={() => setChoosing(null)} onChoose={(date) => choosing && void settleOn(choosing, date)} />

  return { editing, open: setEditing, close: () => setEditing(null), settle, settleDialog }
}
