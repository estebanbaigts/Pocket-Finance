import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Transaction } from '@/domain/model'
import { Button, ConfirmDialog, Sheet, useToast } from '@/components/ui'
import { deleteTransaction } from './actions'
import { toDraft } from './draft'
import { TransactionForm } from './TransactionForm'

/** Modification et suppression (confirmée, annulable) d'une opération. */
export function EditTransactionSheet({ txn, onClose }: { txn: Transaction | null; onClose: () => void }) {
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)

  const remove = async () => {
    if (!txn) return
    setConfirming(false)
    onClose()
    try {
      const undo = await deleteTransaction(txn.id)
      toast({ title: 'Opération supprimée', action: { label: 'Annuler', onClick: () => void undo() } })
    } catch {
      toast({ title: 'Suppression impossible.', tone: 'error' })
    }
  }

  return (
    <>
      <Sheet open={txn !== null && !confirming} onClose={onClose} title="Modifier l’opération" size="lg">
        {txn && (
          <>
            {txn.recurringRuleId && <p className="mb-4 rounded-md bg-surface-2 px-3 py-2 text-[12px] text-ink-2">Échéance générée par une règle récurrente : la modifier ici ne change que cette occurrence.</p>}
            <TransactionForm key={txn.id} initial={toDraft(txn)} id={txn.id} onDone={() => { toast({ title: 'Modifications enregistrées' }); onClose() }} />
            <Button variant="ghost" className="mt-3 w-full justify-center text-danger hover:text-danger" icon={<Trash2 size={16} aria-hidden />} onClick={() => setConfirming(true)}>Supprimer</Button>
          </>
        )}
      </Sheet>
      <ConfirmDialog open={confirming} title="Supprimer cette opération ?" message="Les soldes, budgets et prévisions seront recalculés. Tu pourras annuler juste après." confirmLabel="Supprimer" onConfirm={remove} onCancel={() => setConfirming(false)} />
    </>
  )
}
