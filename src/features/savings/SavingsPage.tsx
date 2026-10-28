import { PiggyBank, Plus } from 'lucide-react'
import { useState } from 'react'
import type { SavingsGoal } from '@/domain/model'
import { Button, EmptyState, PageHeader, Panel, Sheet, Stat, useToast } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { useFinancials } from '../data/useFinancials'
import { blankTransaction } from '../transactions/draft'
import { TransactionForm } from '../transactions/TransactionForm'
import { GoalCard } from './GoalCard'
import { GoalForm, blankGoal } from './GoalForm'
import { toGoalDraft } from './goalDraft'

export default function SavingsPage() {
  const f = useFinancials()
  const toast = useToast()
  const { goals, accounts } = useLedger()
  const [editing, setEditing] = useState<SavingsGoal | 'new' | null>(null)
  const [contributing, setContributing] = useState<SavingsGoal | null>(null)
  const sorted = [...goals].sort((a, b) => a.priority - b.priority)
  const checking = accounts.find((a) => a.kind === 'checking')

  return (
    <>
      <PageHeader title="Épargne" subtitle="Mettre de côté est un transfert entre tes comptes : ce n’est ni une dépense, ni compté deux fois."
        actions={<Button variant="primary" icon={<Plus size={16} aria-hidden />} onClick={() => setEditing('new')}>Nouvel objectif</Button>} />
      <Panel className="mb-4">
        <div className="grid grid-cols-2 gap-5 min-[700px]:grid-cols-4">
          <Stat label="Épargne totale" cents={f.savings.totalSavingsCents} tone="positive" hint="Comptes d’épargne au solde connu" />
          <Stat label="Affectée aux objectifs" cents={f.savings.allocatedCents} />
          <Stat label="Réserve factures du mois" cents={f.savings.billsReserveCents} tone="warning" hint="Sorties prévues sur les comptes courants" />
          <Stat label="Réellement libre" cents={f.savings.freeCents} tone="auto" hint={f.savings.incomplete ? 'Minimum : un solde est inconnu' : 'Comptes courants − réserve'} />
        </div>
        <p className="mt-4 text-[12px] text-ink-3">Capacité d’épargne prudente ce mois : seuil de sécurité et dépenses courantes estimées déduits.</p>
      </Panel>
      {sorted.length === 0 ? (
        <Panel><EmptyState icon={<PiggyBank size={20} />} title="Aucun objectif" action={<Button variant="primary" onClick={() => setEditing('new')}>Créer un objectif</Button>}>Un fonds d’urgence, un voyage, une réserve fiscale… La contribution mensuelle nécessaire est calculée pour toi.</EmptyState></Panel>
      ) : (
        <div className="grid gap-4 min-[800px]:grid-cols-2">
          {sorted.map((g) => <GoalCard key={g.id} goal={g} today={f.today} onEdit={() => setEditing(g)} onContribute={() => setContributing(g)} />)}
        </div>
      )}
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvel objectif' : 'Modifier l’objectif'} size="lg">
        {editing && <GoalForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? blankGoal() : toGoalDraft(editing)} id={editing === 'new' ? undefined : editing.id} onDone={() => { toast({ title: 'Objectif enregistré' }); setEditing(null) }} />}
      </Sheet>
      <Sheet open={contributing !== null} onClose={() => setContributing(null)} title={`Mettre de côté · ${contributing?.name ?? ''}`} description="Transfert vers ton compte d’épargne, rattaché à l’objectif." size="lg">
        {contributing && <TransactionForm lockType initial={{ ...blankTransaction('transfer', f.today), goalId: contributing.id, toAccountId: contributing.accountId, accountId: checking?.id ?? null, description: `Épargne · ${contributing.name}` }}
          onDone={() => { toast({ title: 'Montant mis de côté' }); setContributing(null) }} />}
      </Sheet>
    </>
  )
}
