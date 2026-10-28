import type { Budget, Category, MonthKey, Transaction } from '../model'
import { live } from '../ledger'
import { effectiveBudget } from './effective'
import { categoryCommitted, categorySpent, rolloverInto } from './usage'

export type BudgetState = 'ok' | 'near' | 'over' | 'none'

export interface BudgetLine {
  category: Category
  budget: Budget | null
  availableCents: number
  rolloverCents: number
  spentCents: number
  committedCents: number
  remainingCents: number
  ratio: number
  state: BudgetState
}

export function budgetLine(category: Category, budgets: readonly Budget[], transactions: readonly Transaction[], month: MonthKey): BudgetLine {
  const budget = effectiveBudget(budgets, category.id, month)
  const rolloverCents = rolloverInto(budgets, transactions, category.id, month)
  const availableCents = (budget?.amountCents ?? 0) + rolloverCents
  const spentCents = categorySpent(transactions, category.id, month)
  const ratio = availableCents > 0 ? spentCents / availableCents : spentCents > 0 ? Infinity : 0
  const alert = (budget?.alertPercent ?? 80) / 100
  const state: BudgetState = !budget ? 'none' : spentCents > availableCents ? 'over' : ratio >= alert ? 'near' : 'ok'
  return {
    category, budget, availableCents, rolloverCents, spentCents,
    committedCents: categoryCommitted(transactions, category.id, month),
    remainingCents: availableCents - spentCents, ratio, state,
  }
}

export interface MonthBudgetSummary {
  lines: BudgetLine[]
  totalCents: number
  spentCents: number
  remainingCents: number
  ratio: number
  over: BudgetLine[]
  near: BudgetLine[]
}

/** Synthèse mensuelle. Seules les catégories de dépense sont budgétées ; l'épargne est un transfert. */
export function monthBudgetSummary(categories: readonly Category[], budgets: readonly Budget[], transactions: readonly Transaction[], month: MonthKey): MonthBudgetSummary {
  const lines = live(categories)
    .filter((category) => category.kind === 'expense')
    .map((category) => budgetLine(category, budgets, transactions, month))
  const budgeted = lines.filter((line) => line.budget !== null)
  const totalCents = budgeted.reduce((sum, line) => sum + line.availableCents, 0)
  const spentCents = budgeted.reduce((sum, line) => sum + line.spentCents, 0)
  return {
    lines, totalCents, spentCents, remainingCents: totalCents - spentCents,
    ratio: totalCents > 0 ? spentCents / totalCents : 0,
    over: lines.filter((line) => line.state === 'over'),
    near: lines.filter((line) => line.state === 'near'),
  }
}
