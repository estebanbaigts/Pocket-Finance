import type { ScenarioProjection } from '@/domain/forecast'
import { Amount } from '@/components/ui'
import { cn } from '@/lib/cn'

export const SCENARIO_LABEL = { prudent: 'Prudent', realistic: 'Réaliste', favorable: 'Favorable' } as const
const DESCRIPTION = {
  prudent: 'Revenus confirmés seulement, montants variables au maximum, dépenses courantes majorées.',
  realistic: 'Revenus confirmés et attendus avec une confiance élevée, montants au milieu de leur fourchette.',
  favorable: 'Tous les revenus attendus, montants variables au minimum, dépenses courantes réduites.',
}

/** Décomposition lisible d'un scénario : départ + entrées − sorties − dépenses courantes = fin de mois. */
export function ScenarioCard({ p, highlighted }: { p: ScenarioProjection; highlighted?: boolean }) {
  const rows = [
    { label: 'Solde de départ connu', cents: p.startCents, sign: '' },
    { label: 'Revenus inclus', cents: p.incomeCents, sign: '+' },
    { label: 'Factures et échéances', cents: p.expensesCents, sign: '−' },
    { label: 'Dépenses courantes estimées', cents: p.variableCents, sign: '−' },
  ]
  return (
    <section aria-label={`Scénario ${SCENARIO_LABEL[p.scenario]}`} className={cn('rounded-lg border bg-surface p-5', highlighted ? 'border-ink-3' : 'border-line')}>
      <p className="eyebrow">{SCENARIO_LABEL[p.scenario]}</p>
      <Amount cents={p.endCents} tone="auto" animated className="mt-1 block text-[28px] font-semibold" />
      <p className="mb-4 mt-1 text-[12px] text-ink-3">{DESCRIPTION[p.scenario]}</p>
      <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-[13px]">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-3">
            <dt className="text-ink-2">{r.label}</dt>
            <dd className="num text-ink">{r.sign}<Amount cents={r.cents} className="text-[13px]" /></dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
