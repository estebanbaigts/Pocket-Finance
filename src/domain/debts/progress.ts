import type { Debt, DebtPayment } from '../model'
import { live } from '../ledger'

export interface DebtProgress {
  /** `null` si le capital restant dû n'a jamais été déclaré. */
  remainingCents: number | null
  paidCents: number
  ratio: number | null
  /** Vrai si certains remboursements ne distinguent pas capital et intérêts. */
  approximate: boolean
}

function paymentsAfter(debt: Debt, payments: readonly DebtPayment[]): DebtPayment[] {
  return live(payments).filter((p) => p.debtId === debt.id && (debt.principalAsOf === null || p.date >= debt.principalAsOf))
}

/** Capital restant = capital déclaré − part capital des remboursements postérieurs à la déclaration. */
export function debtProgress(debt: Debt, payments: readonly DebtPayment[]): DebtProgress {
  const relevant = paymentsAfter(debt, payments)
  const approximate = relevant.some((p) => p.principalCents === null)
  const principalPaid = relevant.reduce((sum, p) => sum + (p.principalCents ?? p.totalCents), 0)
  const paidCents = live(payments).filter((p) => p.debtId === debt.id).reduce((sum, p) => sum + p.totalCents, 0)
  const remainingCents = debt.principalCents === null ? null : Math.max(0, debt.principalCents - principalPaid)
  const base = debt.initialAmountCents ?? debt.principalCents
  const ratio = base && remainingCents !== null ? 1 - remainingCents / base : null
  return { remainingCents, paidCents, ratio, approximate }
}

/** Informations manquantes qui limitent la fiabilité des simulations. Rien n'est inventé. */
export function debtWarnings(debt: Debt): string[] {
  const warnings: string[] = []
  if (debt.principalCents === null) warnings.push('Capital restant dû inconnu')
  if (debt.annualRateBps === null) warnings.push('Taux d’intérêt inconnu : simulations à 0 %, économies non chiffrables')
  if (debt.feesCents === null && debt.kind === 'loan') warnings.push('Frais et pénalités de remboursement anticipé inconnus')
  if (debt.nextDueDate === null) warnings.push('Prochaine échéance à préciser')
  if (debt.origin === 'user_declared') warnings.push('Montants déclarés, non vérifiés auprès du créancier')
  return warnings
}

/**
 * Total des dettes hors comptes : un découvert lié à un compte est déjà inclus
 * dans le solde négatif de ce compte et n'est donc pas ajouté une seconde fois.
 */
export function totalOutstandingDebt(debts: readonly Debt[], payments: readonly DebtPayment[]): { knownCents: number; unknownCount: number } {
  let knownCents = 0
  let unknownCount = 0
  for (const debt of live(debts).filter((d) => d.status === 'active' && d.linkedAccountId === null)) {
    const { remainingCents } = debtProgress(debt, payments)
    if (remainingCents === null) unknownCount += 1
    else knownCents += remainingCents
  }
  return { knownCents, unknownCount }
}
