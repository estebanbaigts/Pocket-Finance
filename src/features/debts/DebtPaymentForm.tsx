import { useState } from 'react'
import { AmountInput, Button, Field, Select, TextInput, useToast } from '@/components/ui'
import { centsToInput, parseAmountInput } from '@/domain/money'
import { createEntity, categoryIdByName } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'
import { activeAccounts } from '../data/lookups'
import { blankTransaction } from '../transactions/draft'

/**
 * Remboursement : crée UNE sortie d'argent (catégorie Crédits) et le remboursement lié dans le suivi
 * de la dette. Le flux de trésorerie n'est donc compté qu'une fois.
 */
export function DebtPaymentForm({ today, defaultDebtId, onDone }: { today: string; defaultDebtId?: string; onDone: () => void }) {
  const { debts, accounts } = useLedger()
  const toast = useToast()
  const active = debts.filter((d) => d.status === 'active')
  const [debtId, setDebtId] = useState(defaultDebtId ?? active[0]?.id ?? '')
  const debt = debts.find((d) => d.id === debtId)
  const [amount, setAmount] = useState(debt ? centsToInput(debt.monthlyPaymentCents) : '')
  const [principal, setPrincipal] = useState('')
  const [interest, setInterest] = useState('')
  const [date, setDate] = useState(today)
  const [accountId, setAccountId] = useState(activeAccounts(accounts)[0]?.id ?? '')
  const total = parseAmountInput(amount)

  const submit = async () => {
    if (!debt || total === null) return
    try {
      const txn = await createEntity('transactions', {
        ...blankTransaction('expense', date), amountCents: total, accountId: accountId || null, debtId: debt.id,
        categoryId: await categoryIdByName('Crédits'), description: `Remboursement ${debt.creditor}`, payee: debt.creditor,
      })
      await createEntity('debtPayments', {
        debtId: debt.id, date, totalCents: total, principalCents: principal ? parseAmountInput(principal) : null,
        interestCents: interest ? parseAmountInput(interest) : null, feesCents: null, transactionId: txn.id,
      })
      onDone()
    } catch {
      toast({ title: 'Enregistrement impossible.', tone: 'error' })
    }
  }

  if (active.length === 0) return <p className="text-[14px] text-ink-2">Ajoute d’abord une dette pour enregistrer un remboursement.</p>
  return (
    <div className="flex flex-col gap-4">
      <Field label="Dette">{(p) => <Select {...p} value={debtId} onChange={(e) => { setDebtId(e.target.value); const d = debts.find((x) => x.id === e.target.value); if (d) setAmount(centsToInput(d.monthlyPaymentCents)) }}>{active.map((d) => <option key={d.id} value={d.id}>{d.creditor} {d.label && `— ${d.label}`}</option>)}</Select>}</Field>
      <Field label="Montant payé" error={amount && total === null ? 'Montant invalide' : undefined}>{(p) => <AmountInput large data-autofocus {...p} value={amount} onChange={(e) => setAmount(e.target.value)} />}</Field>
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label="Date">{(p) => <TextInput type="date" {...p} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <Field label="Compte débité">{(p) => <Select {...p} value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">Sans compte</option>{activeAccounts(accounts).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}</Field>
        <Field label="Dont capital" optional hint="Si ton échéancier le précise.">{(p) => <AmountInput {...p} value={principal} onChange={(e) => setPrincipal(e.target.value)} />}</Field>
        <Field label="Dont intérêts" optional>{(p) => <AmountInput {...p} value={interest} onChange={(e) => setInterest(e.target.value)} />}</Field>
      </div>
      <Button variant="primary" size="lg" className="w-full justify-center" disabled={!debt || total === null} onClick={submit}>Enregistrer le remboursement</Button>
    </div>
  )
}
