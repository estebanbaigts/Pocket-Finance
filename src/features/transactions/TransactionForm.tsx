import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Transaction } from '@/domain/model'
import { AmountInput, Button, Field, Segmented, Select, TextInput, useToast } from '@/components/ui'
import { writePreference } from '@/lib/preferences'
import type { Draft } from '@/services/storage'
import { useLedger } from '../data/LedgerProvider'
import { activeAccounts } from '../data/lookups'
import { saveTransaction } from './actions'
import { CategoryPicker } from './CategoryPicker'
import { draftToForm, formToDraft } from './formMapping'
import { transactionFormSchema, type TransactionFormValues } from './schema'
import { TransactionExtraFields } from './TransactionExtraFields'

interface TransactionFormProps {
  initial: Draft<'transactions'>
  id?: string
  onDone: (saved: Transaction) => void
  lockType?: boolean
}

export function TransactionForm({ initial, id, onDone, lockType = false }: TransactionFormProps) {
  const { accounts, categories } = useLedger()
  const toast = useToast()
  const [more, setMore] = useState(Boolean(id))
  const form = useForm<TransactionFormValues>({ resolver: zodResolver(transactionFormSchema), defaultValues: draftToForm(initial) })
  const { register, handleSubmit, watch, control, setValue, formState } = form
  const type = watch('type')
  const usable = activeAccounts(accounts)

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await saveTransaction(formToDraft(values, initial), id)
      if (saved.accountId) writePreference(`account:${saved.type}`, saved.accountId)
      onDone(saved)
    } catch {
      toast({ title: 'Enregistrement impossible. Rien n’a été modifié.', tone: 'error' })
    }
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {!lockType && (
        <Controller control={control} name="type" render={({ field }) => (
          <Segmented label="Type d’opération" value={field.value} onChange={(v) => { field.onChange(v); setValue('status', v === 'income' ? 'received' : 'paid'); setValue('categoryId', '') }}
            options={[{ value: 'expense', label: 'Dépense' }, { value: 'income', label: 'Revenu' }, { value: 'transfer', label: 'Transfert' }]} className="w-full" />
        )} />
      )}
      <Field label="Montant" error={formState.errors.amount?.message}>
        {(p) => <AmountInput large data-autofocus {...p} {...register('amount')} />}
      </Field>
      {type !== 'transfer' && (
        <Controller control={control} name="categoryId" render={({ field }) => (
          <CategoryPicker categories={categories} kind={type === 'income' ? 'income' : 'expense'} value={field.value} onChange={field.onChange} />
        )} />
      )}
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label={type === 'transfer' ? 'Depuis le compte' : 'Compte'} error={formState.errors.accountId?.message}>
          {(p) => <Select {...p} {...register('accountId')}>{type !== 'transfer' && <option value="">Sans compte</option>}{type === 'transfer' && <option value="">Choisir…</option>}{usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}
        </Field>
        {type === 'transfer' && (
          <Field label="Vers le compte" error={formState.errors.toAccountId?.message}>
            {(p) => <Select {...p} {...register('toAccountId')}><option value="">Choisir…</option>{usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}
          </Field>
        )}
        <Field label="Date" error={formState.errors.date?.message}>{(p) => <TextInput type="date" {...p} {...register('date')} />}</Field>
        <Field label="Description" optional>{(p) => <TextInput {...p} placeholder={type === 'income' ? 'Ex. Facture client' : 'Ex. Courses'} {...register('description')} />}</Field>
      </div>
      <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="flex items-center gap-1 self-start text-[13px] font-medium text-ink-2 hover:text-ink">
        <ChevronDown size={16} className={more ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden /> Plus d’options
      </button>
      {more && <TransactionExtraFields form={form} />}
      <Button type="submit" variant="primary" size="lg" disabled={formState.isSubmitting} className="w-full justify-center">
        {id ? 'Enregistrer les modifications' : 'Ajouter'}
      </Button>
    </form>
  )
}
