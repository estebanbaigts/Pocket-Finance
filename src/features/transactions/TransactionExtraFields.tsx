import type { UseFormReturn } from 'react-hook-form'
import { allowedStatuses } from '@/domain/model'
import { Field, Select, TextInput } from '@/components/ui'
import { useLedger } from '../data/LedgerProvider'
import { statusLabel } from './labels'
import type { TransactionFormValues } from './schema'

/** Champs facultatifs, repliés par défaut pour que l'ajout rapide reste en cinq gestes. */
export function TransactionExtraFields({ form }: { form: UseFormReturn<TransactionFormValues> }) {
  const { debts, goals } = useLedger()
  const { register, watch } = form
  const type = watch('type')
  return (
    <div className="grid gap-4 min-[600px]:grid-cols-2">
      <Field label="Statut" hint={type === 'income' ? 'Prévu ou confirmé : non compté dans le solde tant qu’il n’est pas encaissé.' : 'Prévu ou confirmé : compté seulement dans les prévisions.'}>
        {(p) => <Select {...p} {...register('status')}>{allowedStatuses(type).map((s) => <option key={s} value={s}>{statusLabel(type, s)}</option>)}</Select>}
      </Field>
      {type === 'expense' && (
        <>
          <Field label="Bénéficiaire" optional>{(p) => <TextInput {...p} {...register('payee')} />}</Field>
          <Field label="Remboursement de dette" optional hint="Relie ce paiement à une dette sans le compter deux fois.">
            {(p) => <Select {...p} {...register('debtId')}><option value="">Aucune</option>{debts.map((d) => <option key={d.id} value={d.id}>{d.creditor} — {d.label}</option>)}</Select>}
          </Field>
          <label className="flex items-center gap-2 self-end pb-3 text-[14px] text-ink-2"><input type="checkbox" className="h-4 w-4 accent-[var(--positive)]" {...register('isBill')} />Facture / échéance</label>
        </>
      )}
      {type === 'income' && (
        <>
          <Field label="Confiance" optional hint="Sert à choisir le scénario par défaut, sans probabilité.">
            {(p) => <Select {...p} {...register('confidence')}><option value="">Non précisée</option><option value="high">Élevée</option><option value="medium">Moyenne</option><option value="low">Faible</option></Select>}
          </Field>
          <Field label="Inclure à partir du scénario" optional>
            {(p) => <Select {...p} {...register('scenario')}><option value="">Automatique</option><option value="prudent">Prudent</option><option value="realistic">Réaliste</option><option value="favorable">Favorable seulement</option></Select>}
          </Field>
          <Field label="Référence de facture" optional>{(p) => <TextInput {...p} {...register('invoiceRef')} />}</Field>
        </>
      )}
      {type === 'transfer' && goals.length > 0 && (
        <Field label="Objectif d’épargne" optional>
          {(p) => <Select {...p} {...register('goalId')}><option value="">Aucun</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</Select>}
        </Field>
      )}
      <Field label="Note" optional className="min-[600px]:col-span-2">{(p) => <TextInput {...p} {...register('note')} />}</Field>
    </div>
  )
}
