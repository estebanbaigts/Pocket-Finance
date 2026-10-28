import { monthlyInterest } from './amortization'

export type PayoffStrategy = 'avalanche' | 'snowball'

export interface PortfolioDebt {
  id: string
  label: string
  principalCents: number
  annualRateBps: number | null
  paymentCents: number
}

/**
 * Avalanche : taux le plus élevé d'abord (taux inconnus en dernier, signalés).
 * Boule de neige : plus petit capital d'abord.
 */
export function orderDebts(debts: readonly PortfolioDebt[], strategy: PayoffStrategy): PortfolioDebt[] {
  return [...debts].sort((a, b) =>
    strategy === 'snowball'
      ? a.principalCents - b.principalCents
      : (b.annualRateBps ?? -1) - (a.annualRateBps ?? -1) || a.principalCents - b.principalCents,
  )
}

export interface PortfolioResult {
  strategy: PayoffStrategy
  months: number
  totalInterestCents: number
  payoffOrder: { id: string; label: string; month: number }[]
  complete: boolean
}

/** Chaque mois : mensualités normales, puis l'excédent (et les mensualités libérées) va à la dette prioritaire. */
export function simulatePortfolio(debts: readonly PortfolioDebt[], strategy: PayoffStrategy, extraMonthlyCents: number): PortfolioResult {
  const ordered = orderDebts(debts, strategy)
  const balances = new Map(ordered.map((debt) => [debt.id, debt.principalCents]))
  const budget = ordered.reduce((sum, debt) => sum + debt.paymentCents, 0) + extraMonthlyCents
  const payoffOrder: PortfolioResult['payoffOrder'] = []
  let totalInterestCents = 0
  let month = 0
  while ([...balances.values()].some((b) => b > 0) && month < 600) {
    month += 1
    let available = budget
    for (const debt of ordered) {
      const balance = balances.get(debt.id) ?? 0
      if (balance <= 0) continue
      const interest = monthlyInterest(balance, debt.annualRateBps)
      totalInterestCents += interest
      const pay = Math.min(debt.paymentCents, balance + interest, available)
      balances.set(debt.id, balance + interest - pay)
      available -= pay
    }
    for (const debt of ordered) {
      const balance = balances.get(debt.id) ?? 0
      if (balance <= 0 || available <= 0) continue
      const pay = Math.min(balance, available)
      balances.set(debt.id, balance - pay)
      available -= pay
    }
    for (const debt of ordered) {
      if ((balances.get(debt.id) ?? 0) <= 0 && !payoffOrder.some((p) => p.id === debt.id)) payoffOrder.push({ id: debt.id, label: debt.label, month })
    }
  }
  return { strategy, months: month, totalInterestCents, payoffOrder, complete: payoffOrder.length === ordered.length }
}

export function compareStrategies(debts: readonly PortfolioDebt[], extraMonthlyCents: number): Record<PayoffStrategy, PortfolioResult> {
  return {
    avalanche: simulatePortfolio(debts, 'avalanche', extraMonthlyCents),
    snowball: simulatePortfolio(debts, 'snowball', extraMonthlyCents),
  }
}
