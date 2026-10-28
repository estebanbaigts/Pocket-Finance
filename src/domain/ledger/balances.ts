import type { Account, Transaction } from '../model'
import { isSettled } from '../model'
import { live } from './filters'

/**
 * Effet signé d'une transaction sur un compte. Un transfert retire du compte source et ajoute
 * au compte destination : sur l'ensemble des comptes suivis, son effet global est nul.
 */
export function balanceEffect(txn: Transaction, accountId: string): number {
  let effect = 0
  if (txn.type === 'income' && txn.accountId === accountId) effect += txn.amountCents
  if (txn.type === 'expense' && txn.accountId === accountId) effect -= txn.amountCents
  if (txn.type === 'transfer') {
    if (txn.accountId === accountId) effect -= txn.amountCents
    if (txn.toAccountId === accountId) effect += txn.amountCents
  }
  return effect
}

export interface AccountBalance {
  accountId: string
  /** `null` si le solde initial est inconnu : on n'invente jamais de solde. */
  cents: number | null
  /** Variation due aux opérations réglées depuis l'ouverture du suivi (toujours calculable). */
  movementCents: number
}

/** Solde calculé = solde initial déclaré + opérations réglées à partir de la date d'ouverture. */
export function accountBalance(account: Account, transactions: readonly Transaction[], asOf?: string): AccountBalance {
  const movementCents = live(transactions)
    .filter((txn) => isSettled(txn.status))
    .filter((txn) => account.openingDate === null || txn.date >= account.openingDate)
    .filter((txn) => asOf === undefined || txn.date <= asOf)
    .reduce((sum, txn) => sum + balanceEffect(txn, account.id), 0)
  const cents = account.openingBalanceCents === null ? null : account.openingBalanceCents + movementCents
  return { accountId: account.id, cents, movementCents }
}

export interface TotalBalance {
  knownCents: number
  knownAccounts: Account[]
  unknownAccounts: Account[]
}

/** Total des comptes suivis dont le solde est connu ; les autres sont listés à part. */
export function totalBalance(accounts: readonly Account[], transactions: readonly Transaction[], asOf?: string): TotalBalance {
  const tracked = live(accounts).filter((account) => account.includeInTotals && !account.archived)
  const result: TotalBalance = { knownCents: 0, knownAccounts: [], unknownAccounts: [] }
  for (const account of tracked) {
    const { cents } = accountBalance(account, transactions, asOf)
    if (cents === null) result.unknownAccounts.push(account)
    else {
      result.knownCents += cents
      result.knownAccounts.push(account)
    }
  }
  return result
}
