import { z } from 'zod'
import { centsToInput, parseAmountInput } from '@/domain/money'
import type { Draft } from '@/services/storage'

const optionalAmount = z.string().refine((v) => v === '' || parseAmountInput(v) !== null, 'Montant invalide')
const optionalRate = z.string().refine((v) => v === '' || /^\d{1,3}([.,]\d{1,3})?$/.test(v), 'Taux invalide (ex. 5,9)')

export const debtFormSchema = z.object({
  creditor: z.string().trim().min(1, 'Indique le créancier').max(120),
  label: z.string().max(120),
  kind: z.enum(['loan', 'installment', 'overdraft', 'other']),
  initialAmount: optionalAmount,
  principal: optionalAmount,
  principalAsOf: z.string(),
  monthlyPayment: z.string().refine((v) => parseAmountInput(v) !== null, 'Montant invalide'),
  rate: optionalRate,
  nextDueDate: z.string(),
  remainingInstallments: z.string().regex(/^\d*$/, 'Nombre entier'),
  fees: optionalAmount,
  status: z.enum(['active', 'paid_off', 'paused']),
  linkedAccountId: z.string(),
  note: z.string().max(1000),
})

export type DebtFormValues = z.infer<typeof debtFormSchema>

const orNull = (s: string) => (s.trim() === '' ? null : s.trim())
const centsOrNull = (s: string) => (s === '' ? null : parseAmountInput(s))

/** Taux saisi en % (« 5,9 ») → points de base (590). Champ vide = taux inconnu, jamais remplacé par une valeur par défaut. */
export function rateToBps(value: string): number | null {
  if (value === '') return null
  return Math.round(Number(value.replace(',', '.')) * 100)
}

export function debtToForm(d: Draft<'debts'>): DebtFormValues {
  return {
    creditor: d.creditor, label: d.label, kind: d.kind, initialAmount: centsToInput(d.initialAmountCents), principal: centsToInput(d.principalCents),
    principalAsOf: d.principalAsOf ?? '', monthlyPayment: centsToInput(d.monthlyPaymentCents), rate: d.annualRateBps === null ? '' : String(d.annualRateBps / 100).replace('.', ','),
    nextDueDate: d.nextDueDate ?? '', remainingInstallments: d.remainingInstallments?.toString() ?? '', fees: centsToInput(d.feesCents),
    status: d.status, linkedAccountId: d.linkedAccountId ?? '', note: d.note ?? '',
  }
}

export function formToDebt(v: DebtFormValues, base: Draft<'debts'>, today: string): Draft<'debts'> {
  const principalCents = centsOrNull(v.principal)
  return {
    ...base, creditor: v.creditor.trim(), label: v.label.trim(), kind: v.kind, initialAmountCents: centsOrNull(v.initialAmount), principalCents,
    principalAsOf: principalCents === null ? null : (orNull(v.principalAsOf) ?? today), monthlyPaymentCents: parseAmountInput(v.monthlyPayment) ?? 0,
    annualRateBps: rateToBps(v.rate), nextDueDate: orNull(v.nextDueDate), remainingInstallments: v.remainingInstallments === '' ? null : Number(v.remainingInstallments),
    feesCents: centsOrNull(v.fees), status: v.status, linkedAccountId: v.kind === 'overdraft' ? orNull(v.linkedAccountId) : null, note: orNull(v.note),
  }
}

export function blankDebt(): Draft<'debts'> {
  return {
    creditor: '', label: '', kind: 'loan', initialAmountCents: null, principalCents: null, principalAsOf: null, monthlyPaymentCents: 0,
    annualRateBps: null, nextDueDate: null, remainingInstallments: null, feesCents: null, status: 'active', linkedAccountId: null, note: null, origin: 'user_entered',
  }
}
