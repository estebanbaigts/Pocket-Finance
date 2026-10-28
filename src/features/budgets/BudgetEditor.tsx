import { useState } from 'react'
import { AmountInput, Button, Field, Select, Toggle, useToast } from '@/components/ui'
import { budgetStartingAt, effectiveBudget, type BudgetLine } from '@/domain/budgets'
import { formatMonthFr } from '@/domain/dates'
import { centsToInput, parseAmountInput } from '@/domain/money'
import { createEntity, softDelete, updateEntity } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'

/** Modifier un budget crée une version « à partir de ce mois » : l'historique reste intact. */
export function BudgetEditor({ line, month, onDone }: { line: BudgetLine; month: string; onDone: () => void }) {
  const { budgets } = useLedger()
  const toast = useToast()
  const current = effectiveBudget(budgets, line.category.id, month)
  const [amount, setAmount] = useState(centsToInput(current?.amountCents ?? null))
  const [rollover, setRollover] = useState(current?.rollover ?? false)
  const [alert, setAlert] = useState(String(current?.alertPercent ?? 80))
  const cents = parseAmountInput(amount)

  const save = async () => {
    if (cents === null) return
    const existing = budgetStartingAt(budgets, line.category.id, month)
    const data = { amountCents: cents, rollover, alertPercent: Number(alert) }
    if (existing) await updateEntity('budgets', existing.id, data)
    else await createEntity('budgets', { categoryId: line.category.id, fromMonth: month, ...data })
    toast({ title: `Budget ${line.category.name} mis à jour à partir de ${formatMonthFr(month)}` })
    onDone()
  }

  const remove = async () => {
    const existing = budgetStartingAt(budgets, line.category.id, month)
    if (existing) await softDelete('budgets', existing.id)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Budget mensuel" hint={`S’applique à partir de ${formatMonthFr(month)}. Les mois précédents ne changent pas.`} error={amount && cents === null ? 'Montant invalide' : undefined}>
        {(p) => <AmountInput large data-autofocus {...p} value={amount} onChange={(e) => setAmount(e.target.value)} />}
      </Field>
      <Field label="Alerte à partir de">{(p) => <Select {...p} value={alert} onChange={(e) => setAlert(e.target.value)}>{[50, 70, 80, 90, 100].map((v) => <option key={v} value={v}>{v} % consommés</option>)}</Select>}</Field>
      <Toggle checked={rollover} onChange={setRollover} label="Reporter le reliquat" description="Ce qui n’est pas dépensé s’ajoute au mois suivant. Un dépassement n’est pas reporté." />
      <Button variant="primary" size="lg" className="w-full justify-center" disabled={cents === null} onClick={save}>Enregistrer</Button>
      {budgetStartingAt(budgets, line.category.id, month) && <Button variant="ghost" className="w-full justify-center text-danger" onClick={remove}>Retirer la modification de ce mois</Button>}
    </div>
  )
}
