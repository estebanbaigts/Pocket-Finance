import { CalendarCheck } from 'lucide-react'
import { useMemo } from 'react'
import { isPending } from '@/domain/model'
import { addDays } from '@/domain/dates'
import { EmptyState, Panel } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { EditTransactionSheet } from '../transactions/EditTransactionSheet'
import { TransactionRow } from '../transactions/TransactionRow'
import { useTransactionActions } from '../transactions/useTransactionActions'

/** « Quand vais-je recevoir ? Quelles factures dois-je payer ? » : les 14 prochains jours et les retards. */
export function UpcomingPanel({ today, onSeeAll }: { today: string; onSeeAll: () => void }) {
  const { transactions } = useLedger()
  const actions = useTransactionActions()
  const upcoming = useMemo(() => transactions
    .filter((t) => isPending(t.status) && t.date <= addDays(today, 14))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8), [transactions, today])

  return (
    <Panel eyebrow="14 prochains jours" title="À venir" action={<button type="button" onClick={onSeeAll} className="text-[13px] font-medium text-ink-2 hover:text-ink">Tout voir</button>}>
      {upcoming.length === 0 ? (
        <EmptyState icon={<CalendarCheck size={20} />} title="Rien de prévu">Ajoute tes factures et revenus attendus pour voir ce qui arrive.</EmptyState>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {upcoming.map((t) => <TransactionRow key={t.id} txn={t} today={today} onOpen={actions.open} onSettle={actions.settle} />)}
        </div>
      )}
      <EditTransactionSheet txn={actions.editing} onClose={actions.close} />
    </Panel>
  )
}
