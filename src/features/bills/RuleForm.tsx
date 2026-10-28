import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AmountInput, Button, Field, Select, TextInput, Toggle, useToast } from '@/components/ui'
import { createEntity, ensureOccurrences, updateEntity, type Draft } from '@/services/storage'
import { todayIso } from '@/domain/dates'
import { useLedger } from '../data/LedgerProvider'
import { activeAccounts } from '../data/lookups'
import { RULE_KIND_LABEL, formToRule, ruleFormSchema, ruleToForm, typeForKind, type RuleFormValues } from './ruleSchema'
import { RuleScheduleFields } from './RuleScheduleFields'

export function RuleForm({ initial, id, onDone }: { initial: Draft<'recurringRules'>; id?: string; onDone: () => void }) {
  const { accounts, categories, debts } = useLedger()
  const toast = useToast()
  const form = useForm<RuleFormValues>({ resolver: zodResolver(ruleFormSchema), defaultValues: ruleToForm(initial) })
  const { register, handleSubmit, watch, formState, setValue } = form
  const kind = watch('kind')
  const type = typeForKind(kind)
  const usable = activeAccounts(accounts)

  const submit = handleSubmit(async (values) => {
    try {
      const draft = formToRule(values, initial)
      if (id) await updateEntity('recurringRules', id, draft)
      else await createEntity('recurringRules', draft)
      // Les échéances futures sont générées immédiatement ; les existantes ne sont jamais dupliquées.
      await ensureOccurrences(todayIso())
      onDone()
    } catch {
      toast({ title: 'Enregistrement impossible. Rien n’a été modifié.', tone: 'error' })
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 min-[600px]:grid-cols-2">
        <Field label="Type">{(p) => <Select {...p} {...register('kind')}>{Object.entries(RULE_KIND_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}</Select>}</Field>
        <Field label="Nom" error={formState.errors.label?.message}>{(p) => <TextInput data-autofocus placeholder="Ex. Loyer" {...p} {...register('label')} />}</Field>
        <Field label={watch('amountMin') ? 'Montant maximum' : 'Montant'} error={formState.errors.amount?.message}>{(p) => <AmountInput {...p} {...register('amount')} />}</Field>
        <Field label="Montant minimum" optional hint="Pour un montant variable (ex. 80 à 100 €)." error={formState.errors.amountMin?.message}>{(p) => <AmountInput {...p} {...register('amountMin')} />}</Field>
        <Field label={type === 'transfer' ? 'Depuis le compte' : 'Compte'} optional={type !== 'transfer'}>
          {(p) => <Select {...p} {...register('accountId')}><option value="">À préciser</option>{usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}
        </Field>
        {type === 'transfer' ? (
          <Field label="Vers le compte" error={formState.errors.toAccountId?.message}>
            {(p) => <Select {...p} {...register('toAccountId')}><option value="">Choisir…</option>{usable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}
          </Field>
        ) : (
          <Field label="Catégorie" optional>
            {(p) => <Select {...p} {...register('categoryId')}><option value="">Aucune</option>{categories.filter((c) => c.kind === (type === 'income' ? 'income' : 'expense')).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}
          </Field>
        )}
        <Field label={type === 'income' ? 'Source' : 'Bénéficiaire'} optional>{(p) => <TextInput {...p} {...register('payee')} />}</Field>
        {kind === 'debt_installment' && (
          <Field label="Dette concernée" optional>{(p) => <Select {...p} {...register('debtId')}><option value="">Aucune</option>{debts.map((d) => <option key={d.id} value={d.id}>{d.creditor}</option>)}</Select>}</Field>
        )}
      </div>
      <RuleScheduleFields form={form} />
      <Toggle checked={watch('active')} onChange={(v) => setValue('active', v)} label="Active" description="Une règle inactive n’est plus projetée ; ses échéances passées restent." />
      <Button type="submit" variant="primary" size="lg" className="w-full justify-center" disabled={formState.isSubmitting}>{id ? 'Enregistrer' : 'Créer l’échéance récurrente'}</Button>
    </form>
  )
}
