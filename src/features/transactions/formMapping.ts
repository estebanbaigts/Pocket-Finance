import { centsToInput, parseAmountInput } from '@/domain/money'
import { allowedStatuses } from '@/domain/model'
import type { Draft } from '@/services/storage'
import type { TransactionFormValues } from './schema'

const orNull = (value: string) => (value === '' ? null : value)

export function draftToForm(draft: Draft<'transactions'>): TransactionFormValues {
  return {
    type: draft.type, amount: draft.amountCents ? centsToInput(draft.amountCents) : '', description: draft.description,
    categoryId: draft.categoryId ?? '', accountId: draft.accountId ?? '', toAccountId: draft.toAccountId ?? '', date: draft.date,
    status: draft.status, payee: draft.payee ?? '', isBill: draft.isBill, debtId: draft.debtId ?? '', goalId: draft.goalId ?? '',
    confidence: draft.confidence ?? '', scenario: draft.scenario ?? '', invoiceRef: draft.invoiceRef ?? '', note: draft.note ?? '',
  }
}

/** Convertit le formulaire en opération, en ramenant un statut incompatible au statut réglé du type. */
export function formToDraft(values: TransactionFormValues, base: Draft<'transactions'>): Draft<'transactions'> {
  const transfer = values.type === 'transfer'
  const status = allowedStatuses(values.type).includes(values.status) ? values.status : values.type === 'income' ? 'received' : 'paid'
  return {
    ...base,
    type: values.type, amountCents: parseAmountInput(values.amount) ?? 0, description: values.description.trim(),
    categoryId: transfer ? null : orNull(values.categoryId), accountId: orNull(values.accountId),
    toAccountId: transfer ? orNull(values.toAccountId) : null, date: values.date, status,
    payee: orNull(values.payee.trim()), isBill: values.type === 'expense' && values.isBill,
    debtId: values.type === 'expense' ? orNull(values.debtId) : null, goalId: transfer ? orNull(values.goalId) : null,
    confidence: values.type === 'income' ? (values.confidence || null) : null,
    scenario: values.type === 'income' ? (values.scenario || null) : null,
    invoiceRef: values.type === 'income' ? orNull(values.invoiceRef.trim()) : null, note: orNull(values.note.trim()),
    // Une date saisie par l'utilisateur n'est plus une estimation.
    dateEstimated: base.dateEstimated && values.date === base.date,
  }
}
