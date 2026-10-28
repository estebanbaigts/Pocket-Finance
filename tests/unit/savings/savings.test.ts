import { describe, expect, it } from 'vitest'
import { goalProgress, monthsUntil, savingsBreakdown } from '@/domain/savings'
import { totalBalance } from '@/domain/ledger'
import type { SavingsGoal } from '@/domain/model'
import { makeAccount, makeTxn } from '../../fixtures'

const checking = makeAccount({ openingBalanceCents: 200_000 })
const livret = makeAccount({ kind: 'savings', openingBalanceCents: 0 })
const goal: SavingsGoal = {
  id: 'g1', createdAt: '', updatedAt: '', deletedAt: null, version: 1, name: 'Fonds d’urgence', kind: 'emergency',
  targetCents: 300_000, startingCents: 0, deadline: '2027-03-31', priority: 1, accountId: livret.id, plannedMonthlyCents: 50_000,
}

describe('épargne', () => {
  const contribution = makeTxn({ type: 'transfer', amountCents: 60_000, accountId: checking.id, toAccountId: livret.id, goalId: 'g1' })

  it('un transfert vers l’épargne n’est compté qu’une fois', () => {
    expect(totalBalance([checking, livret], [contribution]).knownCents).toBe(200_000)
    const b = savingsBreakdown([checking, livret], [contribution], [goal], '2026-10-28')
    expect(b).toMatchObject({ totalSavingsCents: 60_000, allocatedCents: 60_000, unallocatedCents: 0, freeCents: 140_000 })
  })

  it('calcule une contribution mensuelle indicative', () => {
    expect(monthsUntil('2026-10-28', '2027-03-31')).toBe(6)
    const p = goalProgress(goal, [contribution], '2026-10-28')
    expect(p).toMatchObject({ currentCents: 60_000, remainingCents: 240_000, monthlyNeededCents: 40_000, onTrack: true })
  })

  it('un retrait du compte d’épargne diminue l’objectif', () => {
    const withdrawal = makeTxn({ type: 'transfer', amountCents: 10_000, accountId: livret.id, toAccountId: checking.id, goalId: 'g1' })
    expect(goalProgress(goal, [contribution, withdrawal], '2026-10-28').currentCents).toBe(50_000)
  })

  it('réserve les factures à venir avant de calculer l’argent libre', () => {
    const rent = makeTxn({ amountCents: 90_000, accountId: checking.id, status: 'planned', date: '2026-10-31' })
    expect(savingsBreakdown([checking, livret], [rent], [], '2026-10-28')).toMatchObject({ billsReserveCents: 90_000, freeCents: 110_000 })
  })
})
