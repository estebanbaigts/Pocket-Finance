import { Landmark, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import type { Account } from '@/domain/model'
import { accountBalance } from '@/domain/ledger'
import { formatDateFr } from '@/domain/dates'
import { formatSignedCents } from '@/domain/money'
import { Amount, Badge, Button, EmptyState, PageHeader, Panel, Sheet, useToast } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { useFinancials } from '../data/useFinancials'
import { ACCOUNT_KIND_LABEL, AccountForm, blankAccount } from './AccountForm'
import { toAccountDraft } from './accountDraft'

export default function AccountsPage() {
  const { accounts, transactions } = useLedger()
  const f = useFinancials()
  const toast = useToast()
  const [editing, setEditing] = useState<Account | 'new' | null>(null)

  return (
    <>
      <PageHeader title="Comptes" subtitle="Aucun compte bancaire n’est connecté : soldes et opérations sont saisis par toi. Un solde inconnu n’est jamais deviné."
        actions={<Button variant="primary" icon={<Plus size={16} aria-hidden />} onClick={() => setEditing('new')}>Ajouter un compte</Button>} />
      <Panel className="mb-4">
        <p className="text-[13px] text-ink-2">Total des comptes suivis au solde connu</p>
        <Amount cents={f.balance.knownCents} tone="auto" animated className="text-[32px] font-semibold" />
        {f.balance.unknownAccounts.length > 0 && <p className="mt-1 text-[12px] text-warning">Hors {f.balance.unknownAccounts.length} compte(s) au solde inconnu.</p>}
      </Panel>
      <Panel padded={false}>
        {accounts.length === 0 ? (
          <EmptyState icon={<Landmark size={20} />} title="Aucun compte" action={<Button variant="primary" onClick={() => setEditing('new')}>Ajouter un compte</Button>}>Commence par ton compte courant et son solde actuel.</EmptyState>
        ) : (
          <ul className="divide-y divide-[var(--border)] px-5">
            {accounts.map((account) => {
              const b = accountBalance(account, transactions, f.today)
              return (
                <li key={account.id} className="flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-ink">{account.name}</p>
                    <p className="flex flex-wrap gap-1.5 text-[12px] text-ink-3">
                      <span>{ACCOUNT_KIND_LABEL[account.kind]}</span>
                      {account.openingDate && <span>· solde déclaré au {formatDateFr(account.openingDate)}</span>}
                      {!account.includeInTotals && <Badge>Hors total</Badge>}
                      {account.origin === 'user_declared' && <Badge>Déclaré, non vérifié</Badge>}
                    </p>
                  </div>
                  <div className="text-right">
                    <Amount cents={b.cents} tone="auto" unknownLabel="Solde inconnu" className="block text-[17px] font-semibold" />
                    <span className="text-[11px] text-ink-3">{b.cents === null ? `Mouvements : ${formatSignedCents(b.movementCents)}` : 'Solde calculé'}</span>
                  </div>
                  <button type="button" aria-label={`Modifier ${account.name}`} onClick={() => setEditing(account)} className="rounded-md p-2 text-ink-3 hover:bg-surface-2"><Pencil size={15} /></button>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouveau compte' : 'Modifier le compte'}>
        {editing && <AccountForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? blankAccount(f.today) : toAccountDraft(editing)} id={editing === 'new' ? undefined : editing.id} onDone={() => { toast({ title: 'Compte enregistré' }); setEditing(null) }} />}
      </Sheet>
    </>
  )
}
