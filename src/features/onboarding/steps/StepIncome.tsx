import { Plus, X } from 'lucide-react'
import { AmountInput, Badge, Button, Field, Select, TextInput, Toggle } from '@/components/ui'
import { newId } from '@/services/storage'
import type { IncomeInput } from '../state'
import type { StepProps } from './types'

export function StepIncome({ state, update }: StepProps) {
  const set = (key: string, patch: Partial<IncomeInput>) => update({ incomes: state.incomes.map((i) => (i.key === key ? { ...i, ...patch } : i)) })
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-line bg-surface p-4">
        <div className="mb-2 flex flex-wrap gap-1.5"><Badge tone="warning">Déclaré, non vérifié</Badge><Badge>Avant prélèvements</Badge></div>
        <Toggle checked={state.declareRevenue} onChange={(v) => update({ declareRevenue: v })} label="Chiffre d’affaires déclaré" description="Enregistré comme chiffre d’affaires, pas comme argent disponible." />
        {state.declareRevenue && (
          <div className="mt-3 grid gap-3 min-[600px]:grid-cols-2">
            <Field label="Montant">{(p) => <AmountInput {...p} value={state.revenueAmount} onChange={(e) => update({ revenueAmount: e.target.value })} />}</Field>
            <Field label="Mois concerné">{(p) => <TextInput type="month" {...p} value={state.revenueMonth} onChange={(e) => update({ revenueMonth: e.target.value })} />}</Field>
          </div>
        )}
      </div>
      <div>
        <p className="mb-1 text-[14px] font-semibold text-ink">Revenus attendus</p>
        <p className="mb-3 text-[13px] text-ink-3">Paiements que tu attends, avec leur date prévue. Ils ne seront comptés qu’une fois encaissés.</p>
        {state.incomes.map((i) => (
          <div key={i.key} className="mb-3 grid gap-3 rounded-lg border border-line bg-surface p-4 min-[600px]:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
            <Field label="Libellé">{(p) => <TextInput {...p} value={i.label} placeholder="Ex. Facture client X" onChange={(e) => set(i.key, { label: e.target.value })} />}</Field>
            <Field label="Montant">{(p) => <AmountInput {...p} value={i.amount} onChange={(e) => set(i.key, { amount: e.target.value })} />}</Field>
            <Field label="Date prévue">{(p) => <TextInput type="date" {...p} value={i.date} onChange={(e) => set(i.key, { date: e.target.value })} />}</Field>
            <Field label="Confiance">{(p) => <Select {...p} value={i.confidence} onChange={(e) => set(i.key, { confidence: e.target.value as IncomeInput['confidence'] })}><option value="high">Élevée</option><option value="medium">Moyenne</option><option value="low">Faible</option></Select>}</Field>
            <button type="button" aria-label="Retirer" onClick={() => update({ incomes: state.incomes.filter((x) => x.key !== i.key) })} className="self-end rounded-md p-2.5 text-ink-3 hover:bg-surface-2"><X size={16} /></button>
          </div>
        ))}
        <Button variant="ghost" icon={<Plus size={16} aria-hidden />} onClick={() => update({ incomes: [...state.incomes, { key: newId(), label: '', amount: '', date: '', confidence: 'medium' }] })}>Ajouter un revenu attendu</Button>
      </div>
    </div>
  )
}
