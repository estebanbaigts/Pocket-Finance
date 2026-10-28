import type { IsoDate, RecurringRule } from '../model'
import { addDays, addMonths, monthEnd, monthKey, parseIsoDate } from '../dates'

type Schedule = Pick<RecurringRule, 'frequency' | 'interval' | 'startDate' | 'endDate' | 'occurrenceCount' | 'dayUnknown'>

/** N-ième date d'une règle (0 = première), ancrée sur la date de départ pour éviter toute dérive. */
export function nthOccurrence(rule: Schedule, index: number): IsoDate | null {
  if (rule.startDate === null) return null
  const step = Math.max(1, rule.interval)
  const anchorDay = parseIsoDate(rule.startDate).day
  switch (rule.frequency) {
    case 'weekly':
      return addDays(rule.startDate, index * 7 * step)
    case 'custom_days':
      return addDays(rule.startDate, index * step)
    case 'monthly': {
      const date = addMonths(rule.startDate, index * step, anchorDay)
      return rule.dayUnknown ? monthEnd(monthKey(date)) : date
    }
    case 'yearly':
      return addMonths(rule.startDate, index * 12 * step, anchorDay)
  }
}

/** Dates des occurrences comprises dans [from, to], en respectant la fin et le nombre maximum. */
export function occurrencesBetween(rule: Schedule, from: IsoDate, to: IsoDate): { index: number; date: IsoDate }[] {
  const result: { index: number; date: IsoDate }[] = []
  const limit = rule.occurrenceCount ?? Number.POSITIVE_INFINITY
  for (let index = 0; index < limit && index < 5000; index += 1) {
    const date = nthOccurrence(rule, index)
    if (date === null || date > to || (rule.endDate !== null && date > rule.endDate)) break
    if (date >= from) result.push({ index, date })
  }
  return result
}

/** Clé déterministe d'une occurrence : identique sur tous les appareils, elle empêche les doublons. */
export function occurrenceKey(ruleId: string, date: IsoDate): string {
  return `${ruleId}:${date}`
}

export function nextOccurrence(rule: Schedule, after: IsoDate): IsoDate | null {
  const horizon = addDays(after, 400 * Math.max(1, rule.interval))
  return occurrencesBetween(rule, after, horizon)[0]?.date ?? null
}
