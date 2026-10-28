import { describe, expect, it } from 'vitest'
import { addDays, addMonthKey, addMonths, daysInMonth, diffDays, isLeapYear, monthEnd, todayIso } from '@/domain/dates'

describe('calendrier', () => {
  it('gère février et les années bissextiles', () => {
    expect(isLeapYear(2028)).toBe(true)
    expect(isLeapYear(2100)).toBe(false)
    expect(isLeapYear(2000)).toBe(true)
    expect(daysInMonth(2027, 2)).toBe(28)
    expect(daysInMonth(2028, 2)).toBe(29)
    expect(monthEnd('2028-02')).toBe('2028-02-29')
  })

  it('ajoute des mois sans dériver au-delà de la fin du mois', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2027-02-28', 1, 31)).toBe('2027-03-31')
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-15')
  })

  it('franchit les changements d’heure sans perdre de jour', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('calcule les mois adjacents', () => {
    expect(addMonthKey('2026-12', 1)).toBe('2027-01')
    expect(addMonthKey('2026-01', -1)).toBe('2025-12')
  })

  it('utilise le fuseau de l’utilisateur pour la date du jour', () => {
    const instant = new Date('2026-10-27T23:30:00Z')
    expect(todayIso(instant, 'Europe/Paris')).toBe('2026-10-28')
    expect(todayIso(instant, 'America/New_York')).toBe('2026-10-27')
  })
})
