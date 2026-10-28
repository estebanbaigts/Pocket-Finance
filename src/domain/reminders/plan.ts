import type { IsoDate, Transaction } from '../model'
import { isPending } from '../model'
import { addDays } from '../dates'
import { formatCents } from '../money'
import { live } from '../ledger'

export interface Reminder {
  id: number
  /** Jour de la notification (la veille de l'échéance). */
  notifyOn: IsoDate
  title: string
  body: string
}

/** Identifiant numérique stable (31 bits) dérivé de l'opération : replanifier ne crée pas de doublon. */
export function reminderId(txnId: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < txnId.length; i += 1) {
    hash ^= txnId.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash & 0x7fffffff
}

/** Échéance à rappeler : sortie prévue (facture, récurrence ou dette) dont la date exacte est connue. */
export function isRemindable(txn: Transaction): boolean {
  return txn.type !== 'income' && isPending(txn.status) && !txn.dateEstimated && (txn.isBill || txn.recurringRuleId !== null || txn.debtId !== null)
}

/**
 * Rappels la veille des échéances des `horizonDays` prochains jours. Par défaut, le montant n'apparaît
 * pas (les notifications sont visibles sur l'écran verrouillé).
 */
export function planReminders(transactions: readonly Transaction[], today: IsoDate, horizonDays = 30, showAmounts = false): Reminder[] {
  const last = addDays(today, horizonDays)
  return live(transactions)
    .filter((t) => isRemindable(t) && t.date > today && t.date <= last)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => ({
      id: reminderId(t.id),
      notifyOn: addDays(t.date, -1),
      title: 'Échéance demain',
      body: showAmounts ? `${t.description || t.payee || 'Échéance'} · ${formatCents(t.amountCents)}` : t.description || t.payee || 'Une échéance est prévue demain',
    }))
}
