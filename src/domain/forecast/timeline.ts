import type { IsoDate } from '../model'
import { addDays, diffDays } from '../dates'
import type { ScenarioProjection } from './projection'

export interface TimelinePoint {
  date: IsoDate
  cents: number
}

/**
 * Solde jour par jour jusqu'à la fin du mois. Les opérations en retard sont imputées aujourd'hui ;
 * les dépenses variables sont réparties uniformément sur les jours restants (hypothèse affichée).
 */
export function buildTimeline(projection: ScenarioProjection, today: IsoDate, endDate: IsoDate, includeVariable = true): TimelinePoint[] {
  const days = diffDays(today, endDate) + 1
  const dailyVariable = includeVariable && days > 0 ? projection.variableCents / days : 0
  const points: TimelinePoint[] = []
  let running = projection.startCents
  for (let i = 0; i < days; i += 1) {
    const date = addDays(today, i)
    for (const flow of projection.flows) {
      const effectiveDate = flow.txn.date < today ? today : flow.txn.date
      if (effectiveDate === date) running += flow.effectCents
    }
    running -= dailyVariable
    points.push({ date, cents: Math.round(running) })
  }
  return points
}

export function lowestPoint(points: readonly TimelinePoint[]): TimelinePoint | null {
  return points.reduce<TimelinePoint | null>((low, p) => (low === null || p.cents < low.cents ? p : low), null)
}

export function firstBreach(points: readonly TimelinePoint[], thresholdCents: number): TimelinePoint | null {
  return points.find((p) => p.cents < thresholdCents) ?? null
}
