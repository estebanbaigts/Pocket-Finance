import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui'
import { db } from '@/services/storage'
import { changedFields, resolveConflict } from '@/services/sync'

const ENTITY_LABEL: Record<string, string> = {
  accounts: 'Compte', categories: 'Catégorie', transactions: 'Opération', recurringRules: 'Échéance récurrente', budgets: 'Budget',
  debts: 'Dette', debtPayments: 'Remboursement', savingsGoals: 'Objectif', settings: 'Paramètres',
}

/** Conflits : les deux versions sont présentées ; rien n'est écrasé sans choix explicite. */
export function ConflictsList() {
  const conflicts = useLiveQuery(() => db.conflicts.toArray(), [], [])
  if (conflicts.length === 0) return null
  return (
    <div className="mt-4 rounded-md border border-danger/30 bg-danger-soft p-4">
      <p className="text-[14px] font-semibold text-danger">{conflicts.length} conflit(s) à résoudre</p>
      <p className="mb-3 text-[12px] text-danger">Ces éléments ont été modifiés sur cet appareil et sur un autre. Choisis la version à garder.</p>
      <ul className="flex flex-col gap-3">
        {conflicts.map((c) => {
          const fields = changedFields(c.local, c.remote)
          return (
            <li key={c.key} className="rounded-md bg-surface p-3 text-[13px]">
              <p className="font-medium text-ink">{ENTITY_LABEL[c.entity] ?? c.entity}</p>
              <p className="text-ink-3">Champs différents : {fields.join(', ') || 'aucun'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="primary" onClick={() => void resolveConflict(c, 'mine')}>Garder ma version</Button>
                <Button size="sm" onClick={() => void resolveConflict(c, 'theirs')}>Garder celle de l’autre appareil</Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
