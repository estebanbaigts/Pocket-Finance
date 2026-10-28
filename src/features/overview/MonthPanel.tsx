import { Badge, Panel, ProgressBar, Stat } from '@/components/ui'
import { formatMonthFr } from '@/domain/dates'
import { formatCents, formatPercent } from '@/domain/money'
import type { Financials } from '../data/useFinancials'

/** Le mois en cours : ce qui est réalisé est séparé de ce qui est attendu. */
export function MonthPanel({ f }: { f: Financials }) {
  const { budget } = f
  const tone = budget.over.length > 0 ? 'danger' : budget.near.length > 0 ? 'warning' : 'positive'
  return (
    <Panel eyebrow={formatMonthFr(f.month)} title="Ce mois-ci">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5 min-[640px]:grid-cols-3">
        <Stat label="Dépenses payées" cents={f.spentCents} />
        <Stat label="Revenus encaissés" cents={f.receivedCents} tone="positive" badge={<Badge tone="positive">Réel</Badge>} />
        <Stat label="Revenus attendus" cents={f.expectedCents} tone="muted" badge={<Badge tone="warning">Estimé</Badge>} hint="Non disponibles tant qu’ils ne sont pas encaissés" />
        <Stat label="Factures à payer" cents={f.dueCents} tone={f.dueCents > 0 ? 'warning' : 'neutral'} />
        <Stat label="Argent libre" cents={f.savings.freeCents} tone="auto" hint="Comptes courants moins factures du mois" />
        <Stat label="Épargne disponible" cents={f.savings.unallocatedCents} hint={`${formatCents(f.savings.allocatedCents)} affectés à des objectifs`} />
      </div>
      {budget.totalCents > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <div className="mb-2 flex items-baseline justify-between text-[13px]">
            <span className="text-ink-2">Budget : {formatCents(budget.spentCents)} sur {formatCents(budget.totalCents)}</span>
            <span className="num text-ink-3">{formatPercent(budget.ratio)} · reste {formatCents(budget.remainingCents)}</span>
          </div>
          <ProgressBar value={budget.ratio} tone={tone} label="Budget du mois consommé" />
          {budget.over.length > 0 && <p className="mt-2 text-[12px] text-danger">Dépassé : {budget.over.map((l) => l.category.name).join(', ')}</p>}
          {budget.over.length === 0 && budget.near.length > 0 && <p className="mt-2 text-[12px] text-warning">Proche de la limite : {budget.near.map((l) => l.category.name).join(', ')}</p>}
        </div>
      )}
    </Panel>
  )
}
