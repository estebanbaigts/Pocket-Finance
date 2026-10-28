import type { Budget, Category, MonthKey, Transaction } from '../model'
import { isSettled } from '../model'
import { addMonthKey } from '../dates'
import { effectiveBudget } from '../budgets'
import { inMonth, live } from '../ledger'

/** Dépense variable = dépense non récurrente, hors facture, dans une catégorie non fixe (ou sans catégorie). */
export function isVariableExpense(txn: Transaction, fixedCategoryIds: ReadonlySet<string>): boolean {
  return txn.type === 'expense' && !txn.isBill && txn.recurringRuleId === null && txn.debtId === null
    && (txn.categoryId === null || !fixedCategoryIds.has(txn.categoryId))
}

export function variableSpentIn(transactions: readonly Transaction[], categories: readonly Category[], month: MonthKey): number {
  const fixed = new Set(categories.filter((c) => c.fixed).map((c) => c.id))
  return live(transactions)
    .filter((txn) => inMonth(txn, month) && isSettled(txn.status) && isVariableExpense(txn, fixed))
    .reduce((sum, txn) => sum + txn.amountCents, 0)
}

export interface VariableEstimate {
  monthlyCents: number
  basis: 'override' | 'history' | 'budgets' | 'none'
  explanation: string
}

/**
 * Estimation déterministe des dépenses variables mensuelles, par ordre de priorité :
 * valeur saisie par l'utilisateur → moyenne des 3 derniers mois disposant de données →
 * somme des budgets des catégories variables → aucune (signalée comme donnée manquante).
 */
export function estimateVariableSpending(
  transactions: readonly Transaction[], categories: readonly Category[], budgets: readonly Budget[],
  month: MonthKey, overrideCents: number | null,
): VariableEstimate {
  if (overrideCents !== null) return { monthlyCents: overrideCents, basis: 'override', explanation: 'Montant défini dans les hypothèses' }
  const history = [1, 2, 3].map((i) => variableSpentIn(transactions, categories, addMonthKey(month, -i))).filter((v) => v > 0)
  if (history.length > 0) {
    const average = Math.round(history.reduce((a, b) => a + b, 0) / history.length)
    return { monthlyCents: average, basis: 'history', explanation: `Moyenne des ${history.length} dernier(s) mois avec dépenses variables` }
  }
  const budgeted = live(categories)
    .filter((c) => c.kind === 'expense' && !c.fixed)
    .reduce((sum, c) => sum + (effectiveBudget(budgets, c.id, month)?.amountCents ?? 0), 0)
  if (budgeted > 0) return { monthlyCents: budgeted, basis: 'budgets', explanation: 'Somme des budgets des catégories variables' }
  return { monthlyCents: 0, basis: 'none', explanation: 'Aucun historique ni budget : dépenses variables non estimées' }
}
