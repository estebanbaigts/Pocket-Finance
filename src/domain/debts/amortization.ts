import { roundHalfUp } from '../money'

export interface DebtSimulationInput {
  principalCents: number
  /** Taux annuel en points de base ; `null` = inconnu, simulé à 0 % avec avertissement. */
  annualRateBps: number | null
  paymentCents: number
  extraMonthlyCents?: number
  lumpSumCents?: number
}

export interface DebtSimulation {
  months: number
  totalInterestCents: number
  totalPaidCents: number
  rateKnown: boolean
  /** La mensualité ne couvre pas les intérêts : la dette ne se rembourse jamais. */
  neverEnds: boolean
}

const MAX_MONTHS = 600

/** Intérêts d'un mois, arrondis au centime (taux annuel / 12, convention des prêts amortissables). */
export function monthlyInterest(balanceCents: number, annualRateBps: number | null): number {
  if (!annualRateBps) return 0
  return roundHalfUp((balanceCents * annualRateBps) / 10_000 / 12)
}

export function simulateDebt(input: DebtSimulationInput): DebtSimulation {
  const payment = input.paymentCents + (input.extraMonthlyCents ?? 0)
  let balance = Math.max(0, input.principalCents - (input.lumpSumCents ?? 0))
  let months = 0
  let totalInterestCents = 0
  let totalPaidCents = input.lumpSumCents ?? 0
  while (balance > 0 && months < MAX_MONTHS) {
    const interest = monthlyInterest(balance, input.annualRateBps)
    if (payment <= interest) return { months, totalInterestCents, totalPaidCents, rateKnown: input.annualRateBps !== null, neverEnds: true }
    const due = Math.min(payment, balance + interest)
    balance = balance + interest - due
    totalInterestCents += interest
    totalPaidCents += due
    months += 1
  }
  return { months, totalInterestCents, totalPaidCents, rateKnown: input.annualRateBps !== null, neverEnds: balance > 0 }
}

export interface ExtraPaymentComparison {
  base: DebtSimulation
  accelerated: DebtSimulation
  interestSavedCents: number
  monthsSaved: number
}

/** Compare remboursement normal et remboursement accéléré (versement mensuel ou anticipé). */
export function compareExtraPayment(input: DebtSimulationInput): ExtraPaymentComparison {
  const base = simulateDebt({ ...input, extraMonthlyCents: 0, lumpSumCents: 0 })
  const accelerated = simulateDebt(input)
  return {
    base, accelerated,
    interestSavedCents: base.totalInterestCents - accelerated.totalInterestCents,
    monthsSaved: base.months - accelerated.months,
  }
}
