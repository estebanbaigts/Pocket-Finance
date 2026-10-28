import { describe, expect, it } from 'vitest'
import { needsStatusUpdate, nextOccurrence, occurrencesBetween, planOccurrences } from '@/domain/recurrence'
import type { Transaction } from '@/domain/model'
import { makeRule } from '../../fixtures-rules'
import { makeTxn } from '../../fixtures'

function asTxns(drafts: ReturnType<typeof planOccurrences>): Transaction[] {
  return drafts.map((draft, i) => ({ ...draft, id: `t${i}`, createdAt: '', updatedAt: '', deletedAt: null, version: 1 }))
}

describe('moteur de récurrence', () => {
  it('traverse deux mois et garde le jour d’ancrage après février', () => {
    const rule = makeRule({ startDate: '2027-01-31' })
    const dates = occurrencesBetween(rule, '2027-01-01', '2027-04-30').map((o) => o.date)
    expect(dates).toEqual(['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30'])
  })

  it('gère le 29 février d’une année bissextile pour une règle annuelle', () => {
    const rule = makeRule({ frequency: 'yearly', startDate: '2028-02-29' })
    expect(occurrencesBetween(rule, '2028-01-01', '2032-12-31').map((o) => o.date))
      .toEqual(['2028-02-29', '2029-02-28', '2030-02-28', '2031-02-28', '2032-02-29'])
  })

  it('hebdomadaire et intervalle personnalisé', () => {
    expect(occurrencesBetween(makeRule({ frequency: 'weekly', startDate: '2026-10-26' }), '2026-10-01', '2026-11-10').map((o) => o.date))
      .toEqual(['2026-10-26', '2026-11-02', '2026-11-09'])
    expect(nextOccurrence(makeRule({ frequency: 'custom_days', interval: 10, startDate: '2026-10-01' }), '2026-10-12')).toBe('2026-10-21')
  })

  it('respecte un nombre limité d’échéances (4 mensualités)', () => {
    const rule = makeRule({ occurrenceCount: 4, startDate: '2026-11-10' })
    expect(occurrencesBetween(rule, '2026-01-01', '2027-12-31')).toHaveLength(4)
  })

  it('place en fin de mois une échéance dont le jour est inconnu', () => {
    const rule = makeRule({ dayUnknown: true, startDate: '2026-10-01' })
    const [draft] = planOccurrences(rule, [], '2026-10-01', '2026-10-31')
    expect(draft).toMatchObject({ date: '2026-10-31', dateEstimated: true, status: 'planned' })
  })

  it('ne recrée jamais une occurrence déjà traitée (exécutions répétées)', () => {
    const rule = makeRule()
    const first = asTxns(planOccurrences(rule, [], '2026-10-01', '2026-12-31'))
    expect(first).toHaveLength(3)
    expect(planOccurrences(rule, first, '2026-10-01', '2026-12-31')).toHaveLength(0)
    const deleted = first.map((t) => ({ ...t, deletedAt: 'now' }))
    expect(planOccurrences(rule, deleted, '2026-10-01', '2026-12-31')).toHaveLength(0)
  })

  it('ne projette pas une règle sans calendrier connu ou inactive', () => {
    expect(planOccurrences(makeRule({ startDate: null }), [], '2026-01-01', '2027-01-01')).toHaveLength(0)
    expect(planOccurrences(makeRule({ active: false }), [], '2026-01-01', '2027-01-01')).toHaveLength(0)
  })

  it('signale une échéance dépassée sans la considérer impayée', () => {
    const due = makeTxn({ status: 'planned', date: '2026-10-05' })
    expect(needsStatusUpdate(due, '2026-10-28')).toBe(true)
    expect(needsStatusUpdate({ ...due, status: 'paid' }, '2026-10-28')).toBe(false)
    expect(due.status).toBe('planned')
  })
})
