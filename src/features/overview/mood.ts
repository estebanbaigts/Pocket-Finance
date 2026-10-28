import { formatCents } from '@/domain/money'
import type { Financials } from '../data/useFinancials'

export function greeting(hour: number): string {
  if (hour < 5) return 'Bonne nuit'
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export type Mood = { tone: 'calm' | 'watch' | 'alert' | 'setup'; text: string }

/** Une phrase simple et bienveillante qui résume la situation, à partir des mêmes calculs que le reste. */
export function moodLine(f: Financials): Mood {
  if (f.balance.knownAccounts.length === 0) return { tone: 'setup', text: 'Ajoute le solde de ton compte et je te dirai ce que tu peux dépenser sereinement.' }
  const { capacity } = f
  if (capacity.untilMonthEndCents === 0) return { tone: 'alert', text: 'Mois serré : tes échéances prévues dépassent ta marge. Jette un œil aux prévisions.' }
  if (capacity.limitedBy === 'lowest_point') return { tone: 'watch', text: `Une facture passe avant ta prochaine rentrée. Tu peux dépenser ${formatCents(capacity.todayCents)} aujourd’hui sans risque.` }
  if (f.budget.over.length > 0) return { tone: 'watch', text: `Un budget est dépassé, mais tu peux encore dépenser ${formatCents(capacity.todayCents)} aujourd’hui.` }
  return { tone: 'calm', text: `Tout roule. Tu peux dépenser ${formatCents(capacity.todayCents)} aujourd’hui, et mettre ${formatCents(capacity.canSaveCents)} de côté ce mois-ci.` }
}
