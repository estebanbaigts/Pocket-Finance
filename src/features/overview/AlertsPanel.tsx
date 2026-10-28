import { Panel, Button, useToast } from '@/components/ui'
import { formatCents } from '@/domain/money'
import type { DuplicatePair } from '@/domain/ledger'
import type { Insight } from '@/domain/insights'
import { InsightCard } from '../insights/InsightCard'
import { reconcilePair } from '../transactions/actions'

/** Alertes et constats ; les doublons probables proposent un rapprochement explicite. */
export function AlertsPanel({ insights, duplicates }: { insights: Insight[]; duplicates: DuplicatePair[] }) {
  const toast = useToast()
  if (insights.length === 0 && duplicates.length === 0) return null
  return (
    <Panel eyebrow="À surveiller" title="Constats">
      {duplicates.map((pair) => (
        <div key={pair.pending.id} className="mb-3 flex flex-wrap items-center gap-3 rounded-md bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
          <span className="flex-1">Doublon possible : « {pair.pending.description || 'échéance prévue'} » et « {pair.settled.description || 'opération payée'} » ({formatCents(pair.settled.amountCents)}).</span>
          <Button size="sm" onClick={async () => { await reconcilePair(pair); toast({ title: 'Opérations rapprochées : comptées une seule fois' }) }}>Rapprocher</Button>
        </div>
      ))}
      <ul>{insights.map((i) => <InsightCard key={i.id} insight={i} />)}</ul>
    </Panel>
  )
}
