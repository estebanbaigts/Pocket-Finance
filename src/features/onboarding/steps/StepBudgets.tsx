import { AmountInput, Field } from '@/components/ui'
import type { StepProps } from './types'

export function StepBudgets({ state, update }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-[14px] font-semibold text-ink">Budgets mensuels</p>
        <p className="mb-3 text-[13px] text-ink-3">Facultatif. Ils servent aussi à estimer tes dépenses courantes tant qu’il n’y a pas d’historique.</p>
        <div className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-4">
          {Object.entries(state.budgets).map(([name, value]) => (
            <Field key={name} label={name} optional>{(p) => <AmountInput {...p} value={value} onChange={(e) => update({ budgets: { ...state.budgets, [name]: e.target.value } })} />}</Field>
          ))}
        </div>
      </div>
      <div className="max-w-[260px]">
        <Field label="Objectif de fonds d’urgence" optional hint="Souvent 1 à 3 mois de dépenses fixes.">
          {(p) => <AmountInput {...p} value={state.emergencyTarget} onChange={(e) => update({ emergencyTarget: e.target.value })} />}
        </Field>
      </div>
    </div>
  )
}
