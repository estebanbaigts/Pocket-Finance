import type { Budget, Id, MonthKey } from '../model'
import { live } from '../ledger'

/** Historique des budgets d'une catégorie, du plus ancien au plus récent. */
export function budgetHistory(budgets: readonly Budget[], categoryId: Id): Budget[] {
  return live(budgets)
    .filter((budget) => budget.categoryId === categoryId)
    .sort((a, b) => a.fromMonth.localeCompare(b.fromMonth))
}

/**
 * Budget applicable un mois donné : le plus récent dont `fromMonth` est antérieur ou égal.
 * Modifier un budget « à partir de » un mois futur ne réécrit donc jamais les mois passés.
 */
export function effectiveBudget(budgets: readonly Budget[], categoryId: Id, month: MonthKey): Budget | null {
  const history = budgetHistory(budgets, categoryId).filter((budget) => budget.fromMonth <= month)
  return history.at(-1) ?? null
}

/** Ligne de budget existante pour exactement ce mois (à modifier plutôt que d'en créer une nouvelle). */
export function budgetStartingAt(budgets: readonly Budget[], categoryId: Id, month: MonthKey): Budget | null {
  return budgetHistory(budgets, categoryId).find((budget) => budget.fromMonth === month) ?? null
}
