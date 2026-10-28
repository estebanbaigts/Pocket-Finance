import type { Transaction, TransactionStatus } from '@/domain/model'
import { canTransition, isSettled } from '@/domain/model'
import { reconcile, type DuplicatePair } from '@/domain/ledger'
import { createEntity, db, restoreEntity, softDelete, updateEntity, type Draft, type Patch } from '@/services/storage'

/**
 * Enregistre une opération (création ou modification). La modification remplace l'opération :
 * les soldes étant recalculés à partir des opérations, aucun double comptage n'est possible.
 */
export async function saveTransaction(draft: Draft<'transactions'>, id?: string): Promise<Transaction> {
  if (id) return updateEntity('transactions', id, draft as Patch<'transactions'>)
  const created = await createEntity('transactions', draft)
  if (created.debtId && isSettled(created.status)) await recordDebtPayment(created)
  return created
}

/** Enregistre le remboursement correspondant dans le suivi de la dette (le flux reste compté une seule fois). */
async function recordDebtPayment(txn: Transaction): Promise<void> {
  const existing = await db.debtPayments.where('transactionId').equals(txn.id).filter((p) => p.deletedAt === null).first()
  if (existing || !txn.debtId) return
  await createEntity('debtPayments', { debtId: txn.debtId, date: txn.date, totalCents: txn.amountCents, principalCents: null, interestCents: null, feesCents: null, transactionId: txn.id })
}

/** Change le statut selon les transitions autorisées, et tient le suivi de dette cohérent. */
export async function changeStatus(txn: Transaction, status: TransactionStatus): Promise<Transaction> {
  if (!canTransition(txn.type, txn.status, status)) throw new Error('Transition de statut non autorisée')
  const updated = await updateEntity('transactions', txn.id, { status })
  if (updated.debtId && isSettled(status)) await recordDebtPayment(updated)
  if (!isSettled(status)) {
    const linked = await db.debtPayments.where('transactionId').equals(txn.id).toArray()
    for (const payment of linked) await softDelete('debtPayments', payment.id)
  }
  return updated
}

/** Suppression logique (opération et remboursement lié) ; renvoie la fonction d'annulation. */
export async function deleteTransaction(id: string): Promise<() => Promise<void>> {
  const linked = (await db.debtPayments.where('transactionId').equals(id).toArray()).filter((p) => p.deletedAt === null)
  await softDelete('transactions', id)
  for (const payment of linked) await softDelete('debtPayments', payment.id)
  return async () => {
    await restoreEntity('transactions', id)
    for (const payment of linked) await restoreEntity('debtPayments', payment.id)
  }
}

/** Rapproche une échéance prévue et l'opération réglée correspondante (suppression de l'échéance d'abord). */
export async function reconcilePair(pair: DuplicatePair): Promise<void> {
  const { keep, removeId } = reconcile(pair)
  await softDelete('transactions', removeId)
  await updateEntity('transactions', keep.id, keep)
}
