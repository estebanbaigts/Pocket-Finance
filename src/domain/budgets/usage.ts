import type { Budget, Id, MonthKey, Transaction } from '../model'
import { isPending, isSettled } from '../model'
import { addMonthKey } from '../dates'
import { inMonth, live } from '../ledger'
import { effectiveBudget } from './effective'

function categoryTotal(transactions: readonly Transaction[], categoryId: Id, month: MonthKey, keep: (t: Transaction) => boolean): number {
  return live(transactions)
    .filter((txn) => txn.type === 'expense' && txn.categoryId === categoryId && inMonth(txn, month) && keep(txn))
    .reduce((sum, txn) => sum + txn.amountCents, 0)
}

/** Dépenses payées d'une catégorie. Les annulées et les prévues n'entament pas le budget consommé. */
export function categorySpent(transactions: readonly Transaction[], categoryId: Id, month: MonthKey): number {
  return categoryTotal(transactions, categoryId, month, (txn) => isSettled(txn.status))
}

/** Dépenses encore prévues dans la catégorie (factures à venir) : affichées comme engagées. */
export function categoryCommitted(transactions: readonly Transaction[], categoryId: Id, month: MonthKey): number {
  return categoryTotal(transactions, categoryId, month, (txn) => isPending(txn.status))
}

/**
 * Report : seul le reliquat positif du mois précédent est reporté, si le budget l'autorise.
 * Un dépassement n'est pas reporté (choix documenté : le mois suivant repart du budget défini).
 * La chaîne est limitée à 12 mois pour rester lisible et performante.
 */
export function rolloverInto(budgets: readonly Budget[], transactions: readonly Transaction[], categoryId: Id, month: MonthKey, depth = 12): number {
  if (depth <= 0) return 0
  const current = effectiveBudget(budgets, categoryId, month)
  if (!current?.rollover) return 0
  const previousMonth = addMonthKey(month, -1)
  const previous = effectiveBudget(budgets, categoryId, previousMonth)
  if (!previous) return 0
  const available = previous.amountCents + rolloverInto(budgets, transactions, categoryId, previousMonth, depth - 1)
  return Math.max(0, available - categorySpent(transactions, categoryId, previousMonth))
}
