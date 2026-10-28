import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, type ReactNode } from 'react'
import type { Account, Budget, Category, Debt, DebtPayment, RecurringRule, SavingsGoal, Settings, Transaction } from '@/domain/model'
import { live } from '@/domain/ledger'
import { db } from '@/services/storage'

export interface Ledger {
  settings: Settings | null
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  rules: RecurringRule[]
  budgets: Budget[]
  debts: Debt[]
  debtPayments: DebtPayment[]
  goals: SavingsGoal[]
  /** Toutes les opérations, y compris supprimées : nécessaires au moteur de récurrence et à l'annulation. */
  allTransactions: Transaction[]
}

const LedgerContext = createContext<Ledger | null>(null)

/** Lecture réactive de la base locale : toute écriture (locale ou synchronisée) met l'interface à jour. */
async function loadLedger(): Promise<Ledger> {
  const [settings, accounts, categories, transactions, rules, budgets, debts, debtPayments, goals] = await Promise.all([
    db.settings.toArray(), db.accounts.toArray(), db.categories.toArray(), db.transactions.toArray(), db.recurringRules.toArray(),
    db.budgets.toArray(), db.debts.toArray(), db.debtPayments.toArray(), db.savingsGoals.toArray(),
  ])
  return {
    settings: live(settings)[0] ?? null,
    accounts: live(accounts), categories: live(categories), transactions: live(transactions), rules: live(rules),
    budgets: live(budgets), debts: live(debts), debtPayments: live(debtPayments), goals: live(goals),
    allTransactions: transactions,
  }
}

export function LedgerProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const ledger = useLiveQuery(loadLedger, [])
  if (!ledger) return <>{fallback}</>
  return <LedgerContext.Provider value={ledger}>{children}</LedgerContext.Provider>
}

export function useLedger(): Ledger {
  const ledger = useContext(LedgerContext)
  if (!ledger) throw new Error('useLedger doit être utilisé dans LedgerProvider')
  return ledger
}
