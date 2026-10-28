import type { Category, RecurringRule } from '../model'
import { formatCents, formatPercent } from '../money'
import { monthlyEquivalent } from '../recurrence'
import type { MonthBudgetSummary } from '../budgets'
import type { Insight } from './types'

export function subscriptionsInsight(rules: readonly RecurringRule[]): Insight | null {
  const subs = rules.filter((r) => r.deletedAt === null && r.active && r.kind === 'subscription')
  if (subs.length === 0) return null
  const total = subs.reduce((sum, r) => sum + monthlyEquivalent(r), 0)
  return {
    id: 'subscriptions', tone: 'info',
    title: `Les abonnements représentent ${formatCents(total)} par mois.`,
    evidence: subs.map((r) => `${r.label} : ${formatCents(monthlyEquivalent(r))}/mois${r.amountMinCents !== null ? ` (fourchette ${formatCents(r.amountMinCents)}–${formatCents(r.amountCents)}, borne haute retenue)` : ''}`),
  }
}

export function budgetInsights(summary: MonthBudgetSummary): Insight[] {
  return summary.over.map((line) => ({
    id: `over-${line.category.id}`, tone: 'warning' as const,
    title: `${line.category.name} dépasse son budget de ${formatCents(-line.remainingCents)}.`,
    evidence: [`Budget disponible ${formatCents(line.availableCents)}, dépensé ${formatCents(line.spentCents)} (${formatPercent(line.ratio)}).`],
  }))
}

/** « Si tu réduis cette catégorie de X €, ton objectif devient atteignable » : calcul simple et vérifiable. */
export function reductionInsight(gapCents: number, goalName: string, candidates: readonly { category: Category; cents: number }[]): Insight | null {
  if (gapCents <= 0) return null
  const target = candidates.find((c) => !c.category.fixed && c.cents >= gapCents)
  if (!target) return null
  return {
    id: `reduce-${target.category.id}`, tone: 'info',
    title: `Si tu réduis « ${target.category.name} » de ${formatCents(gapCents)} par mois, l’objectif « ${goalName} » devient atteignable à temps.`,
    evidence: [`Dépensé ce mois dans « ${target.category.name} » : ${formatCents(target.cents)}.`, `Écart mensuel entre contribution nécessaire et capacité d’épargne prudente : ${formatCents(gapCents)}.`],
  }
}
