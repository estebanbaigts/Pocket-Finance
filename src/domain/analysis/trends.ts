import type { Account, Category, MonthKey, Transaction } from '../model'
import { isSettled } from '../model'
import { expensesPaid, incomeReceived, inMonth, live } from '../ledger'

export interface MonthTotals {
  month: MonthKey
  incomeCents: number
  expenseCents: number
  /** Transferts nets vers les comptes d'épargne (ce n'est pas une dépense). */
  savedCents: number
}

export function monthlyTotals(transactions: readonly Transaction[], accounts: readonly Account[], months: readonly MonthKey[]): MonthTotals[] {
  const savingsIds = new Set(live(accounts).filter((a) => a.kind === 'savings').map((a) => a.id))
  return months.map((month) => {
    const transfers = live(transactions).filter((t) => t.type === 'transfer' && isSettled(t.status) && inMonth(t, month))
    const savedCents = transfers.reduce((sum, t) => {
      const into = savingsIds.has(t.toAccountId ?? '') && !savingsIds.has(t.accountId ?? '')
      const out = savingsIds.has(t.accountId ?? '') && !savingsIds.has(t.toAccountId ?? '')
      return sum + (into ? t.amountCents : out ? -t.amountCents : 0)
    }, 0)
    return { month, incomeCents: incomeReceived(transactions, month), expenseCents: expensesPaid(transactions, month), savedCents }
  })
}

export interface CategoryShare {
  category: Category | null
  cents: number
  share: number
}

export function spendingByCategory(transactions: readonly Transaction[], categories: readonly Category[], month: MonthKey): CategoryShare[] {
  const totals = new Map<string | null, number>()
  for (const t of live(transactions)) {
    if (t.type !== 'expense' || !isSettled(t.status) || !inMonth(t, month)) continue
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amountCents)
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0)
  return [...totals.entries()]
    .map(([id, cents]) => ({ category: categories.find((c) => c.id === id) ?? null, cents, share: sum > 0 ? cents / sum : 0 }))
    .sort((a, b) => b.cents - a.cents)
}

/** Fixe = catégorie marquée fixe, facture, échéance récurrente ou remboursement de dette. */
export function fixedVsVariable(transactions: readonly Transaction[], categories: readonly Category[], month: MonthKey): { fixedCents: number; variableCents: number } {
  const fixed = new Set(categories.filter((c) => c.fixed).map((c) => c.id))
  let fixedCents = 0
  let variableCents = 0
  for (const t of live(transactions)) {
    if (t.type !== 'expense' || !isSettled(t.status) || !inMonth(t, month)) continue
    const isFixed = t.isBill || t.recurringRuleId !== null || t.debtId !== null || (t.categoryId !== null && fixed.has(t.categoryId))
    if (isFixed) fixedCents += t.amountCents
    else variableCents += t.amountCents
  }
  return { fixedCents, variableCents }
}

/** Part des remboursements de dettes dans les sorties d'argent du mois. */
export function debtShare(transactions: readonly Transaction[], month: MonthKey): { debtCents: number; share: number } {
  const total = expensesPaid(transactions, month)
  const debtCents = live(transactions)
    .filter((t) => t.type === 'expense' && t.debtId !== null && isSettled(t.status) && inMonth(t, month))
    .reduce((sum, t) => sum + t.amountCents, 0)
  return { debtCents, share: total > 0 ? debtCents / total : 0 }
}
