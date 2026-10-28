import { describe, expect, it } from 'vitest'
import { compareExtraPayment, compareStrategies, debtProgress, debtWarnings, simulateDebt, totalOutstandingDebt } from '@/domain/debts'
import type { Debt, DebtPayment } from '@/domain/model'

function debt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: 'd1', createdAt: '', updatedAt: '', deletedAt: null, version: 1, creditor: 'Sofinco', label: 'Crédit', kind: 'loan',
    initialAmountCents: 200_000, principalCents: 100_000, principalAsOf: '2026-10-01', monthlyPaymentCents: 5_348,
    annualRateBps: null, nextDueDate: null, remainingInstallments: null, feesCents: null, status: 'active',
    linkedAccountId: null, note: null, origin: 'user_declared', ...overrides,
  }
}
function payment(overrides: Partial<DebtPayment> = {}): DebtPayment {
  return { id: 'p', createdAt: '', updatedAt: '', deletedAt: null, version: 1, debtId: 'd1', date: '2026-10-15', totalCents: 5_348, principalCents: null, interestCents: null, feesCents: null, transactionId: 't', ...overrides }
}

describe('dettes', () => {
  it('sans taux connu, simule à 0 % et le signale', () => {
    const sim = simulateDebt({ principalCents: 100_000, annualRateBps: null, paymentCents: 10_000 })
    expect(sim).toMatchObject({ months: 10, totalInterestCents: 0, rateKnown: false })
    expect(debtWarnings(debt())).toContain('Taux d’intérêt inconnu : simulations à 0 %, économies non chiffrables')
  })

  it('calcule les intérêts et l’économie d’un versement supplémentaire', () => {
    const cmp = compareExtraPayment({ principalCents: 500_000, annualRateBps: 600, paymentCents: 20_000, extraMonthlyCents: 10_000 })
    expect(cmp.base.months).toBe(27)
    expect(cmp.accelerated.months).toBeLessThan(cmp.base.months)
    expect(cmp.interestSavedCents).toBeGreaterThan(0)
  })

  it('détecte une mensualité qui ne couvre pas les intérêts', () => {
    expect(simulateDebt({ principalCents: 1_000_000, annualRateBps: 2_400, paymentCents: 10_000 }).neverEnds).toBe(true)
  })

  it('remboursement partiel puis dette remboursée', () => {
    expect(debtProgress(debt(), [payment({ principalCents: 4_000, totalCents: 5_348 })]).remainingCents).toBe(96_000)
    const approx = debtProgress(debt(), [payment()])
    expect(approx).toMatchObject({ remainingCents: 94_652, approximate: true })
    expect(debtProgress(debt({ principalCents: 5_000 }), [payment()]).remainingCents).toBe(0)
  })

  it('ne compte pas deux fois un découvert déjà inclus dans le solde du compte', () => {
    const overdraft = debt({ id: 'd2', kind: 'overdraft', principalCents: 21_200, linkedAccountId: 'cic' })
    expect(totalOutstandingDebt([debt(), overdraft], [])).toEqual({ knownCents: 100_000, unknownCount: 0 })
  })

  it('compare avalanche et boule de neige', () => {
    const result = compareStrategies([
      { id: 'a', label: 'A', principalCents: 300_000, annualRateBps: 1_500, paymentCents: 10_000 },
      { id: 'b', label: 'B', principalCents: 50_000, annualRateBps: 300, paymentCents: 5_000 },
    ], 5_000)
    expect(result.avalanche.payoffOrder[0]?.id).toBe('b')
    expect(result.snowball.payoffOrder[0]?.id).toBe('b')
    expect(result.avalanche.totalInterestCents).toBeLessThanOrEqual(result.snowball.totalInterestCents)
    expect(result.avalanche.complete).toBe(true)
  })
})
