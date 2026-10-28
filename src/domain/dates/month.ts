import type { IsoDate, MonthKey } from '../model'
import { daysInMonth, parseIsoDate, toIsoDate } from './calendar'

export function monthKey(date: IsoDate): MonthKey {
  return date.slice(0, 7)
}

export function monthStart(month: MonthKey): IsoDate {
  return `${month}-01`
}

export function monthEnd(month: MonthKey): IsoDate {
  const { year, month: m } = parseIsoDate(`${month}-01`)
  return toIsoDate(year, m, daysInMonth(year, m))
}

export function addMonthKey(month: MonthKey, delta: number): MonthKey {
  const { year, month: m } = parseIsoDate(`${month}-01`)
  const index = year * 12 + (m - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}
