import { Amount, Badge } from '@/components/ui'
import { formatCents } from '@/domain/money'
import { formatDateFr } from '@/domain/dates'
import { useFinancials } from '../../data/useFinancials'

/** Première projection, calculée sur les données que l'utilisateur vient de saisir. */
export function StepProjection() {
  const f = useFinancials()
  const { scenarios } = f.forecast
  const noBase = f.balance.knownAccounts.length === 0
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-surface p-5">
        <p className="eyebrow">{noBase ? 'Variation prévue d’ici le' : 'Fin de mois ·'} {formatDateFr(f.forecast.endDate)}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 min-[560px]:grid-cols-3 min-[560px]:gap-3">
          {(['prudent', 'realistic', 'favorable'] as const).map((s) => (
            <div key={s} className="flex items-baseline justify-between gap-3 min-[560px]:block"><p className="text-[12px] text-ink-3">{{ prudent: 'Prudent', realistic: 'Réaliste', favorable: 'Favorable' }[s]}</p><Amount cents={noBase ? scenarios[s].endCents - scenarios[s].startCents : scenarios[s].endCents} signed={noBase} tone="auto" animated className="text-[22px] font-semibold" /></div>
          ))}
        </div>
      </div>
      {noBase && <p className="rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">Aucun solde connu : seule la variation est affichée. Ajoute un solde pour connaître ton reste en fin de mois.</p>}
      <ul className="flex flex-col gap-2 text-[13px] text-ink-2">
        <li>Solde de départ connu : <strong className="num">{formatCents(f.balance.knownCents)}</strong>{f.balance.unknownAccounts.length > 0 && <Badge tone="warning" className="ml-2">{f.balance.unknownAccounts.length} compte(s) au solde inconnu</Badge>}</li>
        <li>Sorties prévues d’ici la fin du mois : <strong className="num">{formatCents(scenarios.prudent.expensesCents)}</strong></li>
        <li>Revenus pris en compte (prudent) : <strong className="num">{formatCents(scenarios.prudent.incomeCents)}</strong></li>
        <li>Dépenses courantes estimées : {f.forecast.variable.explanation.toLowerCase()}.</li>
        {f.forecast.excludedRuleCount > 0 && <li className="text-warning">{f.forecast.excludedRuleCount} échéance(s) au calendrier à confirmer ne sont pas encore projetées.</li>}
      </ul>
      <p className="text-[12px] text-ink-3">Tout est modifiable ensuite. Les hypothèses sont détaillées dans « Prévisions ».</p>
    </div>
  )
}
