import type { IsoDate, MonthKey } from '../model'
import { parseIsoDate } from './calendar'

/**
 * Date du jour dans le fuseau de l'utilisateur. On ne déduit jamais la date depuis
 * `toISOString()` (UTC) : à 0h30 à Paris, ce serait encore la veille.
 */
export function todayIso(now: Date = new Date(), timeZone?: string): IsoDate {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  return parts
}

function asUtcDate(date: IsoDate): Date {
  const { year, month, day } = parseIsoDate(date)
  return new Date(Date.UTC(year, month - 1, day))
}

/** « 28 oct. 2026 » ou « mardi 28 octobre » selon le style. */
export function formatDateFr(date: IsoDate, style: 'short' | 'long' | 'day' = 'short'): string {
  const options: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }
      : style === 'day'
        ? { day: 'numeric', month: 'short', timeZone: 'UTC' }
        : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
  return new Intl.DateTimeFormat('fr-FR', options).format(asUtcDate(date))
}

export function formatMonthFr(month: MonthKey, withYear = true): string {
  const options: Intl.DateTimeFormatOptions = withYear
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { month: 'short', timeZone: 'UTC' }
  return new Intl.DateTimeFormat('fr-FR', options).format(asUtcDate(`${month}-01`))
}
