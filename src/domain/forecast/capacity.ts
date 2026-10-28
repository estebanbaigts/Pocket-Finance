import type { Forecast } from './projection'
import { buildTimeline, lowestPoint } from './timeline'

export interface SpendingCapacity {
  /** Montant dépensable d'ici la fin du mois en scénario prudent, au-delà des factures et du seuil. */
  untilMonthEndCents: number
  todayCents: number
  thisWeekCents: number
  /** Ce qui peut être mis de côté ce mois sans passer sous le seuil, dépenses variables estimées comprises. */
  canSaveCents: number
  limitedBy: 'end_of_month' | 'lowest_point'
}

/**
 * « Combien puis-je dépenser ? » : scénario prudent sans les dépenses variables estimées,
 * en retenant le point le plus bas du mois (une facture peut tomber avant un revenu), moins le seuil.
 */
export function spendingCapacity(forecast: Forecast, thresholdCents: number): SpendingCapacity {
  const prudent = forecast.scenarios.prudent
  const withoutVariable = buildTimeline(prudent, forecast.today, forecast.endDate, false)
  const low = lowestPoint(withoutVariable)
  const endWithoutVariable = prudent.endCents + prudent.variableCents
  const lowest = Math.min(endWithoutVariable, low?.cents ?? endWithoutVariable)
  const untilMonthEndCents = Math.max(0, lowest - thresholdCents)
  const days = Math.max(1, forecast.remainingDays)
  const daily = Math.floor(untilMonthEndCents / days)
  return {
    untilMonthEndCents,
    todayCents: daily,
    thisWeekCents: daily * Math.min(7, days),
    canSaveCents: Math.max(0, prudent.endCents - thresholdCents),
    limitedBy: lowest < endWithoutVariable ? 'lowest_point' : 'end_of_month',
  }
}
