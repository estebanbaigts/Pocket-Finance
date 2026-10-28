import type { IsoDate, MonthKey, RevenueDeclaration, Transaction } from '../model'
import { isPending, isSettled } from '../model'
import { inMonth, live } from '../ledger'

export interface RevenueVsCash {
  /** Chiffre d'affaires déclaré par l'utilisateur (avant prélèvements). */
  declaredCents: number
  /** Revenus facturés (référence de facture), quel que soit leur statut sauf annulé. */
  invoicedCents: number
  /** Argent effectivement reçu. */
  receivedCents: number
}

/** Sépare le chiffre d'affaires (déclaré ou facturé) de la trésorerie effectivement encaissée. */
export function revenueVsCash(transactions: readonly Transaction[], declarations: readonly RevenueDeclaration[], month: MonthKey): RevenueVsCash {
  const incomes = live(transactions).filter((t) => t.type === 'income' && inMonth(t, month) && t.status !== 'cancelled')
  return {
    declaredCents: declarations.filter((d) => d.month === month).reduce((s, d) => s + d.amountCents, 0),
    invoicedCents: incomes.filter((t) => t.invoiceRef !== null).reduce((s, t) => s + t.amountCents, 0),
    receivedCents: incomes.filter((t) => isSettled(t.status)).reduce((s, t) => s + t.amountCents, 0),
  }
}

/** Revenus attendus dont la date est dépassée : retard de paiement possible, à relancer ou actualiser. */
export function lateIncomes(transactions: readonly Transaction[], today: IsoDate): Transaction[] {
  return live(transactions).filter((t) => t.type === 'income' && isPending(t.status) && t.date < today)
}

export function upcomingIncomes(transactions: readonly Transaction[], today: IsoDate): Transaction[] {
  return live(transactions)
    .filter((t) => t.type === 'income' && isPending(t.status) && t.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
}
