import { Amount, Panel } from '@/components/ui'
import { formatCents } from '@/domain/money'
import { formatDateFr } from '@/domain/dates'
import type { Financials } from '../data/useFinancials'

/** « Combien puis-je dépenser aujourd'hui, cette semaine ? » et « Combien puis-je mettre de côté ? ». */
export function CapacityPanel({ f }: { f: Financials }) {
  const { capacity } = f
  if (f.balance.knownAccounts.length === 0) {
    return (
      <Panel eyebrow="Marge de manœuvre" title="Ce que tu peux dépenser sans risque">
        <p className="text-[13px] text-ink-2">Pour le calculer, il faut au moins un solde de compte connu. Renseigne-le dans « Comptes » : aucun solde n’est supposé.</p>
      </Panel>
    )
  }
  return (
    <Panel eyebrow="Marge de manœuvre" title="Ce que tu peux dépenser sans risque">
      <dl className="grid grid-cols-3 gap-3">
        <div><dt className="text-[12px] text-ink-3">Aujourd’hui</dt><dd><Amount cents={capacity.todayCents} animated tone={capacity.todayCents > 0 ? 'positive' : 'warning'} className="text-[22px] font-semibold" /></dd></div>
        <div><dt className="text-[12px] text-ink-3">Cette semaine</dt><dd><Amount cents={capacity.thisWeekCents} animated className="text-[22px] font-semibold" /></dd></div>
        <div><dt className="text-[12px] text-ink-3">D’ici le {formatDateFr(f.forecast.endDate, 'day')}</dt><dd><Amount cents={capacity.untilMonthEndCents} animated className="text-[22px] font-semibold" /></dd></div>
      </dl>
      <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
        Scénario prudent, après toutes les factures et échéances connues et en gardant ton seuil de sécurité de {formatCents(f.thresholdCents)}
        {capacity.limitedBy === 'lowest_point' ? ', limité par le point le plus bas du mois (une sortie tombe avant une rentrée)' : ''}.
        Épargne possible ce mois en tenant compte des dépenses courantes estimées : <strong className="font-semibold text-ink-2">{formatCents(capacity.canSaveCents)}</strong>.
      </p>
    </Panel>
  )
}
