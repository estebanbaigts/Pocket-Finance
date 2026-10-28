import { useState } from 'react'
import { Sheet, useToast } from '@/components/ui'
import { cn } from '@/lib/cn'
import { readPreference } from '@/lib/preferences'
import { softDelete } from '@/services/storage'
import { formatCents } from '@/domain/money'
import { blankRule } from '../bills/ruleSchema'
import { RuleForm } from '../bills/RuleForm'
import { useToday } from '../data/useToday'
import { blankDebt } from '../debts/debtSchema'
import { DebtForm } from '../debts/DebtForm'
import { DebtPaymentForm } from '../debts/DebtPaymentForm'
import { blankTransaction } from '../transactions/draft'
import { TransactionForm } from '../transactions/TransactionForm'

export type QuickAddKind = 'operation' | 'bill' | 'payment' | 'recurring' | 'debt'

const KINDS: { value: QuickAddKind; label: string }[] = [
  { value: 'operation', label: 'Opération' },
  { value: 'bill', label: 'Facture' },
  { value: 'payment', label: 'Remboursement' },
  { value: 'recurring', label: 'Récurrent' },
  { value: 'debt', label: 'Dette' },
]

/** Ajout global : dépense, revenu, transfert, facture, remboursement, échéance récurrente ou dette. */
export function QuickAddSheet({ open, onClose, initialKind = 'operation' }: { open: boolean; onClose: () => void; initialKind?: QuickAddKind }) {
  const today = useToday()
  const toast = useToast()
  const [kind, setKind] = useState<QuickAddKind>(initialKind)
  const done = (title: string) => { toast({ title }); onClose() }
  const expense = { ...blankTransaction('expense', today), accountId: readPreference('account:expense') }
  const bill = { ...blankTransaction('expense', today), status: 'planned' as const, isBill: true }

  return (
    <Sheet open={open} onClose={onClose} title="Ajouter" size="lg">
      <div role="tablist" aria-label="Que veux-tu ajouter ?" className="-mx-1 mb-5 flex gap-1 overflow-x-auto px-1">
        {KINDS.map((k) => (
          <button key={k.value} role="tab" type="button" aria-selected={kind === k.value} onClick={() => setKind(k.value)}
            className={cn('h-8 shrink-0 rounded-md px-3 text-[13px] font-medium transition-colors', kind === k.value ? 'bg-ink text-bg' : 'bg-surface-2 text-ink-2 hover:text-ink')}>
            {k.label}
          </button>
        ))}
      </div>
      {kind === 'operation' && (
        <TransactionForm initial={expense} onDone={(t) => {
          toast({
            title: `${t.type === 'income' ? 'Revenu' : t.type === 'transfer' ? 'Transfert' : 'Dépense'} de ${formatCents(t.amountCents)} enregistré`,
            action: { label: 'Annuler', onClick: () => void softDelete('transactions', t.id) },
          })
          onClose()
        }} />
      )}
      {kind === 'bill' && <TransactionForm initial={bill} lockType onDone={() => done('Facture ajoutée aux échéances')} />}
      {kind === 'payment' && <DebtPaymentForm today={today} onDone={() => done('Remboursement enregistré')} />}
      {kind === 'recurring' && <RuleForm initial={blankRule('bill')} onDone={() => done('Échéance récurrente créée')} />}
      {kind === 'debt' && <DebtForm initial={blankDebt()} onDone={() => done('Dette ajoutée')} />}
    </Sheet>
  )
}
