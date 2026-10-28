import type { IsoDate } from '../model'
import { daysInMonth, parseIsoDate, toIsoDate } from './calendar'

/** Calcul en UTC pur : une date calendaire n'a pas de fuseau, ce qui neutralise les changements d'heure. */
function toUtcDays(date: IsoDate): number {
  const { year, month, day } = parseIsoDate(date)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const shifted = new Date((toUtcDays(date) + days) * 86_400_000)
  return toIsoDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate())
}

/**
 * Ajoute des mois en ramenant au dernier jour si nécessaire (31 janvier + 1 mois = 28/29 février).
 * `anchorDay` conserve le jour d'origine pour éviter la dérive (31 → 28 → 28 → …).
 */
export function addMonths(date: IsoDate, months: number, anchorDay?: number): IsoDate {
  const { year, month, day } = parseIsoDate(date)
  const index = year * 12 + (month - 1) + months
  const nextYear = Math.floor(index / 12)
  const nextMonth = (index % 12) + 1
  const wanted = anchorDay ?? day
  return toIsoDate(nextYear, nextMonth, Math.min(wanted, daysInMonth(nextYear, nextMonth)))
}

export function diffDays(from: IsoDate, to: IsoDate): number {
  return Math.round(toUtcDays(to) - toUtcDays(from))
}
