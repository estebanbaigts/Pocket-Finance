import type { RecurringRule } from '../model'
import { roundHalfUp } from '../money'

/** Équivalent mensuel d'une règle (52 semaines / 12, 365 jours / 12), arrondi au centime. */
export function monthlyEquivalent(rule: Pick<RecurringRule, 'frequency' | 'interval' | 'amountCents'>): number {
  const n = Math.max(1, rule.interval)
  switch (rule.frequency) {
    case 'monthly': return roundHalfUp(rule.amountCents / n)
    case 'weekly': return roundHalfUp((rule.amountCents * 52) / 12 / n)
    case 'yearly': return roundHalfUp(rule.amountCents / 12 / n)
    case 'custom_days': return roundHalfUp((rule.amountCents * 365) / 12 / n)
  }
}

export function frequencyLabel(rule: Pick<RecurringRule, 'frequency' | 'interval'>): string {
  const n = Math.max(1, rule.interval)
  switch (rule.frequency) {
    case 'monthly': return n === 1 ? 'Mensuel' : `Tous les ${n} mois`
    case 'weekly': return n === 1 ? 'Hebdomadaire' : `Toutes les ${n} semaines`
    case 'yearly': return n === 1 ? 'Annuel' : `Tous les ${n} ans`
    case 'custom_days': return `Tous les ${n} jours`
  }
}
