import { CreditCard, Plus } from 'lucide-react'
import { useState } from 'react'
import type { Debt } from '@/domain/model'
import { totalOutstandingDebt } from '@/domain/debts'
import { Button, EmptyState, PageHeader, Panel, Sheet, Stat, useToast } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { useToday } from '../data/useToday'
import { DebtCard } from './DebtCard'
import { DebtForm } from './DebtForm'
import { DebtPaymentForm } from './DebtPaymentForm'
import { DebtSimulator } from './DebtSimulator'
import { blankDebt } from './debtSchema'
import { toDebtDraft } from './debtDraft'
import { StrategyPanel } from './StrategyPanel'

type Mode = { kind: 'edit'; debt: Debt | null } | { kind: 'pay'; debt: Debt } | { kind: 'simulate'; debt: Debt } | null

export default function DebtsPage() {
  const today = useToday()
  const toast = useToast()
  const { debts, debtPayments } = useLedger()
  const [mode, setMode] = useState<Mode>(null)
  const total = totalOutstandingDebt(debts, debtPayments)
  const monthly = debts.filter((d) => d.status === 'active').reduce((s, d) => s + d.monthlyPaymentCents, 0)
  const close = () => setMode(null)

  return (
    <>
      <PageHeader title="Dettes" subtitle="Chaque remboursement est une seule sortie d’argent, reliée à la dette : jamais comptée deux fois."
        actions={<Button variant="primary" icon={<Plus size={16} aria-hidden />} onClick={() => setMode({ kind: 'edit', debt: null })}>Ajouter une dette</Button>} />
      <Panel className="mb-4">
        <div className="grid grid-cols-2 gap-5 min-[700px]:grid-cols-3">
          <Stat label="Capital restant connu" cents={total.knownCents} tone="danger" hint={total.unknownCount ? `${total.unknownCount} dette(s) au capital inconnu non incluse(s)` : 'Hors découverts déjà inclus dans les soldes'} />
          <Stat label="Mensualités en cours" cents={monthly} />
          <div><p className="text-[13px] text-ink-2">Dettes actives</p><p className="num text-[22px] font-semibold text-ink">{debts.filter((d) => d.status === 'active').length}</p></div>
        </div>
      </Panel>
      {debts.length === 0 ? (
        <Panel><EmptyState icon={<CreditCard size={20} />} title="Aucune dette suivie">Ajoute tes crédits pour suivre le capital restant et simuler un remboursement plus rapide.</EmptyState></Panel>
      ) : (
        <div className="mb-4 grid gap-4 min-[900px]:grid-cols-2">
          {debts.map((d) => <DebtCard key={d.id} debt={d} onPay={() => setMode({ kind: 'pay', debt: d })} onEdit={() => setMode({ kind: 'edit', debt: d })} onSimulate={() => setMode({ kind: 'simulate', debt: d })} />)}
        </div>
      )}
      <StrategyPanel debts={debts} />
      <Sheet open={mode?.kind === 'edit'} onClose={close} title={mode?.kind === 'edit' && mode.debt ? 'Modifier la dette' : 'Nouvelle dette'} size="lg">
        {mode?.kind === 'edit' && <DebtForm key={mode.debt?.id ?? 'new'} initial={mode.debt ? toDebtDraft(mode.debt) : blankDebt()} id={mode.debt?.id} onDone={() => { toast({ title: 'Dette enregistrée' }); close() }} />}
      </Sheet>
      <Sheet open={mode?.kind === 'pay'} onClose={close} title="Remboursement">
        {mode?.kind === 'pay' && <DebtPaymentForm today={today} defaultDebtId={mode.debt.id} onDone={() => { toast({ title: 'Remboursement enregistré' }); close() }} />}
      </Sheet>
      <Sheet open={mode?.kind === 'simulate'} onClose={close} title={mode?.kind === 'simulate' ? `Simuler · ${mode.debt.creditor}` : ''} size="lg">
        {mode?.kind === 'simulate' && <DebtSimulator debt={mode.debt} />}
      </Sheet>
    </>
  )
}
