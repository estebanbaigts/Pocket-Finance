import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AmountInput, Button, Field, Select, TextInput, useToast } from '@/components/ui'
import { todayIso } from '@/domain/dates'
import { createEntity, updateEntity, type Draft } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'
import { debtFormSchema, debtToForm, formToDebt, type DebtFormValues } from './debtSchema'

export function DebtForm({ initial, id, onDone }: { initial: Draft<'debts'>; id?: string; onDone: () => void }) {
  const { accounts } = useLedger()
  const toast = useToast()
  const { register, handleSubmit, watch, formState } = useForm<DebtFormValues>({ resolver: zodResolver(debtFormSchema), defaultValues: debtToForm(initial) })
  const errors = formState.errors

  const submit = handleSubmit(async (values) => {
    try {
      const draft = formToDebt(values, initial, todayIso())
      if (id) await updateEntity('debts', id, draft)
      else await createEntity('debts', draft)
      onDone()
    } catch {
      toast({ title: 'Enregistrement impossible.', tone: 'error' })
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label="Créancier" error={errors.creditor?.message}>{(p) => <TextInput data-autofocus placeholder="Ex. Sofinco" {...p} {...register('creditor')} />}</Field>
        <Field label="Libellé" optional>{(p) => <TextInput placeholder="Ex. Crédit renouvelable" {...p} {...register('label')} />}</Field>
        <Field label="Type">{(p) => <Select {...p} {...register('kind')}><option value="loan">Crédit</option><option value="installment">Paiement en plusieurs fois</option><option value="overdraft">Découvert</option><option value="other">Autre</option></Select>}</Field>
        <Field label="Mensualité" error={errors.monthlyPayment?.message}>{(p) => <AmountInput {...p} {...register('monthlyPayment')} />}</Field>
        <Field label="Capital restant dû" optional hint="Laisse vide s’il n’est pas connu : aucun montant n’est supposé." error={errors.principal?.message}>{(p) => <AmountInput {...p} {...register('principal')} />}</Field>
        <Field label="Connu à la date du" optional>{(p) => <TextInput type="date" {...p} {...register('principalAsOf')} />}</Field>
        <Field label="Montant initial" optional error={errors.initialAmount?.message}>{(p) => <AmountInput {...p} {...register('initialAmount')} />}</Field>
        <Field label="Taux annuel (%)" optional hint="Inconnu = simulations à 0 % avec avertissement." error={errors.rate?.message}>{(p) => <TextInput inputMode="decimal" placeholder="Inconnu" {...p} {...register('rate')} />}</Field>
        <Field label="Prochaine échéance" optional>{(p) => <TextInput type="date" {...p} {...register('nextDueDate')} />}</Field>
        <Field label="Mensualités restantes" optional error={errors.remainingInstallments?.message}>{(p) => <TextInput inputMode="numeric" {...p} {...register('remainingInstallments')} />}</Field>
        <Field label="Frais connus" optional>{(p) => <AmountInput {...p} {...register('fees')} />}</Field>
        <Field label="Statut">{(p) => <Select {...p} {...register('status')}><option value="active">En cours</option><option value="paused">Suspendue</option><option value="paid_off">Remboursée</option></Select>}</Field>
        {watch('kind') === 'overdraft' && (
          <Field label="Compte à découvert" optional hint="Si le solde de ce compte est déjà négatif, le découvert n’est pas compté une seconde fois.">
            {(p) => <Select {...p} {...register('linkedAccountId')}><option value="">Aucun</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}
          </Field>
        )}
        <Field label="Note" optional className="min-[600px]:col-span-2">{(p) => <TextInput {...p} {...register('note')} />}</Field>
      </div>
      <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={formState.isSubmitting}>{id ? 'Enregistrer' : 'Ajouter la dette'}</Button>
    </form>
  )
}
