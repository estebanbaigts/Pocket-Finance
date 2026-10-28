import type { Forecast } from '@/domain/forecast'
import { includedIn, incomeScenario } from '@/domain/forecast'
import { formatDateFr } from '@/domain/dates'
import { Amount, Badge } from '@/components/ui'
import { SCENARIO_LABEL } from './ScenarioCard'

/** Liste des flux pris en compte, avec les scénarios qui les incluent. */
export function FlowsTable({ forecast }: { forecast: Forecast }) {
  const flows = forecast.scenarios.favorable.flows
  if (flows.length === 0) return <p className="text-[13px] text-ink-3">Aucune opération prévue d’ici la fin du mois.</p>
  return (
    <ul className="divide-y divide-[var(--border)]">
      {flows.map(({ txn, effectCents, overdue }) => (
        <li key={txn.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] text-ink">{txn.description || txn.payee || 'Opération prévue'}</p>
            <p className="flex flex-wrap gap-1.5 text-[12px] text-ink-3">
              <span>{txn.dateEstimated ? `avant le ${formatDateFr(txn.date, 'day')}` : formatDateFr(txn.date, 'day')}</span>
              {overdue && <Badge tone="warning">Date passée</Badge>}
              {txn.type === 'income' && <Badge tone="info">Dès le scénario {SCENARIO_LABEL[incomeScenario(txn)].toLowerCase()}</Badge>}
              {txn.type !== 'income' && <Badge>Tous les scénarios</Badge>}
              {(['prudent', 'realistic'] as const).filter((s) => !includedIn(txn, s)).length === 2 && <Badge tone="warning">Non compté en prudent ni réaliste</Badge>}
            </p>
          </div>
          <Amount cents={effectCents} signed tone={effectCents > 0 ? 'positive' : 'neutral'} className="text-[14px]" />
        </li>
      ))}
    </ul>
  )
}
