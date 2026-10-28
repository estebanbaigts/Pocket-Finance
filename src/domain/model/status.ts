export type TransactionType = 'income' | 'expense' | 'transfer'

/**
 * planned   : prévu, n'affecte que les projections
 * confirmed : engagement confirmé (facture émise, prélèvement annoncé) mais pas encore réglé
 * received  : revenu encaissé — affecte le solde constaté
 * paid      : dépense payée ou transfert effectué — affecte le solde constaté
 * cancelled : annulé, n'affecte plus rien
 */
export type TransactionStatus = 'planned' | 'confirmed' | 'received' | 'paid' | 'cancelled'

const ALLOWED: Record<TransactionType, TransactionStatus[]> = {
  income: ['planned', 'confirmed', 'received', 'cancelled'],
  expense: ['planned', 'confirmed', 'paid', 'cancelled'],
  transfer: ['planned', 'paid', 'cancelled'],
}

const TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  planned: ['confirmed', 'received', 'paid', 'cancelled'],
  confirmed: ['planned', 'received', 'paid', 'cancelled'],
  // Correction d'une erreur de saisie : un règlement peut redevenir attendu.
  received: ['confirmed', 'planned', 'cancelled'],
  paid: ['confirmed', 'planned', 'cancelled'],
  cancelled: ['planned'],
}

export function allowedStatuses(type: TransactionType): TransactionStatus[] {
  return ALLOWED[type]
}

export function canTransition(type: TransactionType, from: TransactionStatus, to: TransactionStatus): boolean {
  if (from === to) return true
  return ALLOWED[type].includes(to) && TRANSITIONS[from].includes(to)
}

/** Réglé = argent réellement entré ou sorti. Seul ce statut modifie le solde constaté. */
export function isSettled(status: TransactionStatus): boolean {
  return status === 'received' || status === 'paid'
}

/** En attente = encore susceptible de se produire ; utilisé par les projections. */
export function isPending(status: TransactionStatus): boolean {
  return status === 'planned' || status === 'confirmed'
}

export function settledStatusFor(type: TransactionType): TransactionStatus {
  return type === 'income' ? 'received' : 'paid'
}
