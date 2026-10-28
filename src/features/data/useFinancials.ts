import { useMemo } from 'react'
import { monthKey } from '@/domain/dates'
import { monthBudgetSummary } from '@/domain/budgets'
import { projectMonthEnd, spendingCapacity, type Forecast, type SpendingCapacity } from '@/domain/forecast'
import { expensesDue, expensesPaid, findDuplicatePairs, incomeExpected, incomeReceived, totalBalance, type DuplicatePair, type TotalBalance } from '@/domain/ledger'
import { savingsBreakdown, type SavingsBreakdown } from '@/domain/savings'
import { unscheduledRules } from '@/services/storage/recurring'
import type { MonthBudgetSummary } from '@/domain/budgets'
import { useLedger } from './LedgerProvider'
import { useToday } from './useToday'

export interface Financials {
  today: string
  month: string
  balance: TotalBalance
  spentCents: number
  receivedCents: number
  expectedCents: number
  dueCents: number
  budget: MonthBudgetSummary
  forecast: Forecast
  capacity: SpendingCapacity
  savings: SavingsBreakdown
  duplicates: DuplicatePair[]
  thresholdCents: number
}

const DEFAULT_FACTORS = { prudent: 1150, realistic: 1000, favorable: 900 }

/** Tous les indicateurs dérivés, calculés par le domaine (aucun calcul financier dans les composants). */
export function useFinancials(): Financials {
  const ledger = useLedger()
  const today = useToday()
  return useMemo(() => {
    const month = monthKey(today)
    const settings = {
      scenarioFactors: ledger.settings?.scenarioFactors ?? DEFAULT_FACTORS,
      variableSpendingOverrideCents: ledger.settings?.variableSpendingOverrideCents ?? null,
      safetyThresholdCents: ledger.settings?.safetyThresholdCents ?? 0,
    }
    const forecast = projectMonthEnd(
      { accounts: ledger.accounts, transactions: ledger.transactions, categories: ledger.categories, budgets: ledger.budgets, settings, today },
      unscheduledRules(ledger.rules).length,
    )
    return {
      today, month,
      balance: totalBalance(ledger.accounts, ledger.transactions, today),
      spentCents: expensesPaid(ledger.transactions, month),
      receivedCents: incomeReceived(ledger.transactions, month),
      expectedCents: incomeExpected(ledger.transactions, month),
      dueCents: expensesDue(ledger.transactions, month),
      budget: monthBudgetSummary(ledger.categories, ledger.budgets, ledger.transactions, month),
      forecast,
      capacity: spendingCapacity(forecast, settings.safetyThresholdCents),
      savings: savingsBreakdown(ledger.accounts, ledger.transactions, ledger.goals, today),
      duplicates: findDuplicatePairs(ledger.transactions),
      thresholdCents: settings.safetyThresholdCents,
    }
  }, [ledger, today])
}
