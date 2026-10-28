import { AmountInput, Badge, Field, TextInput } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { RecurringInput } from '../state'
import type { StepProps } from './types'

/** Dépenses fixes, crédits et abonnements déclarés : à confirmer, jamais considérés comme payés. */
export function StepRecurring({ state, update }: StepProps) {
  const set = (key: string, patch: Partial<RecurringInput>) => update({ recurring: state.recurring.map((r) => (r.key === key ? { ...r, ...patch } : r)) })
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-ink-3">Valeurs déclarées, modifiables. Laisse le jour vide s’il est inconnu : l’échéance sera placée en fin de mois et marquée « date à préciser ».</p>
      {state.recurring.map((r) => (
        <div key={r.key} className={cn('rounded-lg border bg-surface p-4 transition-opacity', r.include ? 'border-line' : 'border-line opacity-60')}>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" className="h-4 w-4 accent-[var(--positive)]" checked={r.include} onChange={(e) => set(r.key, { include: e.target.checked })} />
            <span className="flex-1 text-[15px] font-semibold text-ink">{r.label}</span>
            <Badge tone="warning">Déclaré</Badge>
          </label>
          {r.note && <p className="ml-6 mt-1 text-[12px] text-ink-3">{r.note}</p>}
          {r.include && (
            <div className="ml-6 mt-3 grid gap-3 min-[600px]:grid-cols-3">
              <Field label={r.amountMin ? 'Montant max' : 'Montant'}>{(p) => <AmountInput {...p} value={r.amount} onChange={(e) => set(r.key, { amount: e.target.value })} />}</Field>
              {r.amountMin !== '' && <Field label="Montant min">{(p) => <AmountInput {...p} value={r.amountMin} onChange={(e) => set(r.key, { amountMin: e.target.value })} />}</Field>}
              {r.needsSchedule
                ? <Field label="1re échéance" optional hint="Vide = calendrier à confirmer, non projeté">{(p) => <TextInput type="date" {...p} value={r.firstDate} onChange={(e) => set(r.key, { firstDate: e.target.value })} />}</Field>
                : <Field label="Jour du mois" optional hint="Vide = inconnu">{(p) => <TextInput inputMode="numeric" placeholder="ex. 5" {...p} value={r.day} onChange={(e) => set(r.key, { day: e.target.value.replace(/\D/g, '').slice(0, 2) })} />}</Field>}
            </div>
          )}
        </div>
      ))}
      <div className={cn('rounded-lg border border-line bg-surface p-4', !state.overdraft.include && 'opacity-60')}>
        <label className="flex items-center gap-2.5">
          <input type="checkbox" className="h-4 w-4 accent-[var(--positive)]" checked={state.overdraft.include} onChange={(e) => update({ overdraft: { ...state.overdraft, include: e.target.checked } })} />
          <span className="flex-1 text-[15px] font-semibold text-ink">Découvert CIC à régulariser</span>
          <Badge tone="warning">À confirmer</Badge>
        </label>
        <p className="ml-6 mt-1 text-[12px] text-ink-3">Relié au compte CIC : si son solde est déjà négatif, le découvert n’est pas compté deux fois.</p>
        {state.overdraft.include && <div className="ml-6 mt-3 max-w-[200px]"><Field label="Montant">{(p) => <AmountInput {...p} value={state.overdraft.amount} onChange={(e) => update({ overdraft: { ...state.overdraft, amount: e.target.value } })} />}</Field></div>}
      </div>
    </div>
  )
}
