import type { IsoDate, SavingsGoal, Transaction } from '../model'
import { isSettled } from '../model'
import { divideCeil } from '../money'
import { parseIsoDate } from '../dates'
import { live } from '../ledger'

/**
 * Contributions = transferts réglés rattachés à l'objectif. Un transfert vers le compte d'épargne
 * de l'objectif augmente l'objectif, un retrait le diminue. L'argent n'est pas compté deux fois :
 * il quitte le compte courant et rejoint l'épargne, le total des comptes est inchangé.
 */
export function goalContributions(goal: SavingsGoal, transactions: readonly Transaction[]): number {
  return live(transactions)
    .filter((txn) => txn.type === 'transfer' && txn.goalId === goal.id && isSettled(txn.status))
    .reduce((sum, txn) => {
      if (goal.accountId !== null && txn.accountId === goal.accountId) return sum - txn.amountCents
      return sum + txn.amountCents
    }, 0)
}

/** Nombre de mensualités restantes jusqu'à l'échéance, mois en cours compris (minimum 1). */
export function monthsUntil(today: IsoDate, deadline: IsoDate): number {
  const a = parseIsoDate(today)
  const b = parseIsoDate(deadline)
  return Math.max(1, (b.year - a.year) * 12 + (b.month - a.month) + 1)
}

export interface GoalProgress {
  currentCents: number
  remainingCents: number
  ratio: number
  monthsLeft: number | null
  /** Contribution mensuelle indicative pour atteindre la cible à temps, arrondie au centime supérieur. */
  monthlyNeededCents: number | null
  /** Vrai si la contribution prévue couvre la contribution nécessaire. */
  onTrack: boolean | null
}

export function goalProgress(goal: SavingsGoal, transactions: readonly Transaction[], today: IsoDate): GoalProgress {
  const currentCents = goal.startingCents + goalContributions(goal, transactions)
  const remainingCents = Math.max(0, goal.targetCents - currentCents)
  const monthsLeft = goal.deadline ? (goal.deadline < today ? 0 : monthsUntil(today, goal.deadline)) : null
  const monthlyNeededCents = monthsLeft === null ? null : monthsLeft === 0 ? remainingCents : divideCeil(remainingCents, monthsLeft)
  const onTrack = monthlyNeededCents === null || goal.plannedMonthlyCents === null ? null : goal.plannedMonthlyCents >= monthlyNeededCents
  return {
    currentCents, remainingCents,
    ratio: goal.targetCents > 0 ? Math.min(1, currentCents / goal.targetCents) : 1,
    monthsLeft, monthlyNeededCents, onTrack,
  }
}
