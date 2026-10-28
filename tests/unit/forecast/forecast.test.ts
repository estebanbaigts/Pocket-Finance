import { describe, expect, it } from 'vitest'
import { buildTimeline, firstBreach, projectMonthEnd, spendingCapacity, type ForecastInput } from '@/domain/forecast'
import type { Category } from '@/domain/model'
import { makeAccount, makeTxn } from '../../fixtures'

const food: Category = { id: 'food', createdAt: '', updatedAt: '', deletedAt: null, version: 1, name: 'Alimentation', kind: 'expense', tone: 'green', fixed: false }
const checking = makeAccount({ openingBalanceCents: 100_000, openingDate: '2026-10-01' })
const livret = makeAccount({ kind: 'savings', openingBalanceCents: 0, openingDate: '2026-10-01' })
const settings = { scenarioFactors: { prudent: 1200, realistic: 1000, favorable: 850 }, variableSpendingOverrideCents: 30_000, safetyThresholdCents: 10_000 }

function input(transactions: ForecastInput['transactions']): ForecastInput {
  return { accounts: [checking, livret], transactions, categories: [food], budgets: [], settings, today: '2026-10-20' }
}

describe('prévisions de fin de mois', () => {
  const rent = makeTxn({ amountCents: 90_000, accountId: checking.id, status: 'planned', date: '2026-10-31', isBill: true })
  const confirmed = makeTxn({ type: 'income', amountCents: 50_000, accountId: checking.id, status: 'confirmed', date: '2026-10-25' })
  const uncertain = makeTxn({ type: 'income', amountCents: 200_000, accountId: checking.id, status: 'planned', confidence: 'low', date: '2026-10-29' })
  const groceries = makeTxn({ amountCents: 10_000, accountId: checking.id, categoryId: 'food', date: '2026-10-05' })

  it('distingue trois scénarios déterministes', () => {
    const f = projectMonthEnd(input([rent, confirmed, uncertain, groceries]))
    // Solde 90 000 ; variables restantes = 30 000 − 10 000 déjà dépensés = 20 000.
    expect(f.scenarios.prudent).toMatchObject({ startCents: 90_000, incomeCents: 50_000, expensesCents: 90_000, variableCents: 24_000, endCents: 26_000 })
    expect(f.scenarios.realistic.endCents).toBe(30_000)
    expect(f.scenarios.favorable.endCents).toBe(90_000 + 250_000 - 90_000 - 17_000)
  })

  it('un revenu incertain n’est jamais compté en prudent', () => {
    const f = projectMonthEnd(input([uncertain]))
    expect(f.scenarios.prudent.incomeCents).toBe(0)
    expect(f.scenarios.realistic.incomeCents).toBe(0)
  })

  it('une dépense annulée n’impacte plus la projection', () => {
    const f = projectMonthEnd(input([{ ...rent, status: 'cancelled' }]))
    expect(f.scenarios.prudent.expensesCents).toBe(0)
  })

  it('un transfert vers l’épargne ne réduit pas le patrimoine projeté', () => {
    const saving = makeTxn({ type: 'transfer', amountCents: 20_000, accountId: checking.id, toAccountId: livret.id, status: 'planned', date: '2026-10-28' })
    expect(projectMonthEnd(input([saving])).scenarios.prudent.expensesCents).toBe(0)
  })

  it('montant variable : borne haute en prudent, basse en favorable', () => {
    const qonto = makeTxn({ amountCents: 10_000, amountMinCents: 8_000, accountId: checking.id, status: 'planned', date: '2026-10-30' })
    const f = projectMonthEnd(input([qonto]))
    expect(f.scenarios.prudent.expensesCents).toBe(10_000)
    expect(f.scenarios.realistic.expensesCents).toBe(9_000)
    expect(f.scenarios.favorable.expensesCents).toBe(8_000)
  })

  it('signale le passage sous le seuil et limite le « dépensable » au point le plus bas', () => {
    const early = makeTxn({ amountCents: 95_000, accountId: checking.id, status: 'planned', date: '2026-10-22' })
    const late = makeTxn({ type: 'income', amountCents: 100_000, accountId: checking.id, status: 'confirmed', date: '2026-10-30' })
    const f = projectMonthEnd(input([early, late]))
    const points = buildTimeline(f.scenarios.prudent, f.today, f.endDate)
    expect(firstBreach(points, 10_000)?.date).toBe('2026-10-22')
    const capacity = spendingCapacity(f, 10_000)
    expect(capacity.limitedBy).toBe('lowest_point')
    expect(capacity.untilMonthEndCents).toBe(0)
  })

  it('exclut les comptes au solde inconnu et le signale', () => {
    const unknown = makeAccount({ openingBalanceCents: null })
    const f = projectMonthEnd({ ...input([]), accounts: [checking, unknown] })
    expect(f.unknownAccounts).toHaveLength(1)
    expect(f.scenarios.prudent.startCents).toBe(100_000)
  })
})
