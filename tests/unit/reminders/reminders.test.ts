import { describe, expect, it } from 'vitest'
import { planReminders, reminderId } from '@/domain/reminders'
import { makeTxn } from '../../fixtures'

describe('rappels d’échéances', () => {
  const rent = makeTxn({ id: 'rent-nov', description: 'Loyer', amountCents: 90_000, status: 'planned', isBill: true, date: '2026-11-05' })

  it('rappelle la veille, sans montant par défaut', () => {
    const [r] = planReminders([rent], '2026-10-28')
    expect(r).toMatchObject({ notifyOn: '2026-11-04', title: 'Échéance demain', body: 'Loyer' })
    expect(planReminders([rent], '2026-10-28', 30, true)[0]?.body.replace(/\s/g, ' ')).toBe('Loyer · 900,00 €')
  })

  it('ignore réglé, annulé, revenu, date estimée, hors horizon et dépense libre', () => {
    const cases = [
      { ...rent, id: 'a', status: 'paid' as const }, { ...rent, id: 'b', status: 'cancelled' as const },
      { ...rent, id: 'c', type: 'income' as const }, { ...rent, id: 'd', dateEstimated: true },
      { ...rent, id: 'e', date: '2027-01-20' }, { ...rent, id: 'f', isBill: false },
      { ...rent, id: 'g', date: '2026-10-28' },
    ]
    expect(planReminders(cases, '2026-10-28')).toHaveLength(0)
  })

  it('identifiant stable et positif', () => {
    expect(reminderId('rent-nov')).toBe(reminderId('rent-nov'))
    expect(reminderId('rent-nov')).toBeGreaterThan(0)
    expect(reminderId('rent-nov')).not.toBe(reminderId('rent-dec'))
  })
})
