import type { Account, IsoDate, SavingsGoal, Transaction } from '../model'
import { isPending } from '../model'
import { monthEnd, monthKey } from '../dates'
import { accountBalance, live } from '../ledger'
import { goalProgress } from './goals'

export interface SavingsBreakdown {
  /** Solde des comptes d'épargne dont le solde est connu. */
  totalSavingsCents: number
  /** Part de l'épargne affectée à des objectifs. */
  allocatedCents: number
  /** Épargne non affectée. */
  unallocatedCents: number
  /** Sorties prévues d'ici la fin du mois sur les comptes courants (factures, prélèvements). */
  billsReserveCents: number
  /** Argent des comptes courants réellement libre après la réserve pour factures. */
  freeCents: number
  /** Certains soldes sont inconnus : les montants ci-dessus sont des minimums. */
  incomplete: boolean
}

function knownBalances(accounts: readonly Account[], transactions: readonly Transaction[], keep: (a: Account) => boolean) {
  let cents = 0
  let incomplete = false
  for (const account of live(accounts).filter((a) => !a.archived && keep(a))) {
    const balance = accountBalance(account, transactions).cents
    if (balance === null) incomplete = true
    else cents += balance
  }
  return { cents, incomplete }
}

export function savingsBreakdown(accounts: readonly Account[], transactions: readonly Transaction[], goals: readonly SavingsGoal[], today: IsoDate): SavingsBreakdown {
  const savings = knownBalances(accounts, transactions, (a) => a.kind === 'savings')
  const current = knownBalances(accounts, transactions, (a) => a.kind === 'checking' || a.kind === 'cash')
  const currentIds = new Set(live(accounts).filter((a) => a.kind === 'checking' || a.kind === 'cash').map((a) => a.id))
  const endOfMonth = monthEnd(monthKey(today))
  const billsReserveCents = live(transactions)
    .filter((t) => isPending(t.status) && t.date <= endOfMonth && t.accountId !== null && currentIds.has(t.accountId))
    .filter((t) => t.type === 'expense' || (t.type === 'transfer' && !currentIds.has(t.toAccountId ?? '')))
    .reduce((sum, t) => sum + t.amountCents, 0)
  const allocatedCents = live(goals).reduce((sum, goal) => sum + goalProgress(goal, transactions, today).currentCents, 0)
  return {
    totalSavingsCents: savings.cents,
    allocatedCents,
    unallocatedCents: savings.cents - allocatedCents,
    billsReserveCents,
    freeCents: current.cents - billsReserveCents,
    incomplete: savings.incomplete || current.incomplete,
  }
}
