import { formatCents } from '../money'
import { formatDateFr } from '../dates'
import type { Forecast } from '../forecast'
import { buildTimeline, firstBreach } from '../forecast'
import type { Insight } from './types'

export function thresholdInsight(forecast: Forecast, thresholdCents: number): Insight | null {
  const prudent = forecast.scenarios.prudent
  const breach = firstBreach(buildTimeline(prudent, forecast.today, forecast.endDate), thresholdCents)
  if (!breach) return null
  return {
    id: 'threshold', tone: 'action',
    title: `Avec les échéances connues, ton solde projeté passe sous ton seuil de ${formatCents(thresholdCents)} vers le ${formatDateFr(breach.date, 'day').replace(/\.$/, '')}.`,
    evidence: [
      `Scénario prudent : solde de départ ${formatCents(prudent.startCents)}, sorties prévues ${formatCents(prudent.expensesCents)}, revenus inclus ${formatCents(prudent.incomeCents)}.`,
      `Dépenses variables restantes estimées : ${formatCents(prudent.variableCents)} (${forecast.variable.explanation.toLowerCase()}).`,
    ],
  }
}

export function incompleteDataInsight(forecast: Forecast): Insight | null {
  const evidence: string[] = []
  if (forecast.unknownAccounts.length > 0) evidence.push(`Solde inconnu : ${forecast.unknownAccounts.map((a) => a.name).join(', ')}. Ces comptes sont exclus du solde de départ.`)
  if (forecast.excludedRuleCount > 0) evidence.push(`${forecast.excludedRuleCount} échéance(s) récurrente(s) sans calendrier confirmé ne sont pas projetées.`)
  if (forecast.variable.basis === 'none') evidence.push('Aucune estimation des dépenses variables : définis-la dans les hypothèses ou ajoute des budgets.')
  if (evidence.length === 0) return null
  return { id: 'incomplete', tone: 'warning', title: 'Certaines données manquent : la projection est partielle.', evidence }
}
