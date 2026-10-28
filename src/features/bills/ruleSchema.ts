import { z } from 'zod'
import { centsToInput, parseAmountInput } from '@/domain/money'
import type { RuleKind, TransactionType } from '@/domain/model'
import type { Draft } from '@/services/storage'

const amount = z.string().refine((v) => parseAmountInput(v) !== null, 'Montant invalide')
const optionalAmount = z.string().refine((v) => v === '' || parseAmountInput(v) !== null, 'Montant invalide')

export const ruleFormSchema = z.object({
  kind: z.enum(['bill', 'subscription', 'income', 'debt_installment', 'savings', 'other']),
  label: z.string().trim().min(1, 'Donne un nom').max(120),
  payee: z.string().max(120),
  amount,
  amountMin: optionalAmount,
  accountId: z.string(),
  toAccountId: z.string(),
  categoryId: z.string(),
  frequency: z.enum(['monthly', 'weekly', 'yearly', 'custom_days']),
  interval: z.coerce.number().int().min(1, '1 minimum').max(366),
  scheduleKnown: z.boolean(),
  startDate: z.string(),
  dayUnknown: z.boolean(),
  endDate: z.string(),
  occurrenceCount: z.string().regex(/^\d*$/, 'Nombre entier'),
  debtId: z.string(),
  active: z.boolean(),
  note: z.string().max(1000),
}).superRefine((v, ctx) => {
  if (v.scheduleKnown && !/^\d{4}-\d{2}-\d{2}$/.test(v.startDate)) ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Indique la première échéance (ou coche « calendrier inconnu »)' })
  const min = parseAmountInput(v.amountMin)
  const max = parseAmountInput(v.amount)
  if (v.amountMin !== '' && min !== null && max !== null && min > max) ctx.addIssue({ code: 'custom', path: ['amountMin'], message: 'Doit être inférieur au montant maximum' })
  if (v.kind === 'savings' && (!v.accountId || !v.toAccountId)) ctx.addIssue({ code: 'custom', path: ['toAccountId'], message: 'Choisis les deux comptes du virement' })
})

export type RuleFormValues = z.infer<typeof ruleFormSchema>

export function typeForKind(kind: RuleKind): TransactionType {
  return kind === 'income' ? 'income' : kind === 'savings' ? 'transfer' : 'expense'
}

export function ruleToForm(rule: Draft<'recurringRules'>): RuleFormValues {
  return {
    kind: rule.kind, label: rule.label, payee: rule.payee ?? '', amount: centsToInput(rule.amountCents), amountMin: centsToInput(rule.amountMinCents),
    accountId: rule.accountId ?? '', toAccountId: rule.toAccountId ?? '', categoryId: rule.categoryId ?? '', frequency: rule.frequency,
    interval: rule.interval, scheduleKnown: rule.startDate !== null, startDate: rule.startDate ?? '', dayUnknown: rule.dayUnknown,
    endDate: rule.endDate ?? '', occurrenceCount: rule.occurrenceCount?.toString() ?? '', debtId: rule.debtId ?? '', active: rule.active, note: rule.note ?? '',
  }
}

export function formToRule(v: RuleFormValues, base: Draft<'recurringRules'>): Draft<'recurringRules'> {
  const type = typeForKind(v.kind)
  const orNull = (s: string) => (s.trim() === '' ? null : s.trim())
  return {
    ...base, kind: v.kind, type, label: v.label.trim(), payee: orNull(v.payee), amountCents: parseAmountInput(v.amount) ?? 0,
    amountMinCents: v.amountMin === '' ? null : parseAmountInput(v.amountMin), accountId: orNull(v.accountId),
    toAccountId: type === 'transfer' ? orNull(v.toAccountId) : null, categoryId: type === 'transfer' ? null : orNull(v.categoryId),
    frequency: v.frequency, interval: v.interval, startDate: v.scheduleKnown ? v.startDate : null, dayUnknown: v.frequency === 'monthly' && v.dayUnknown,
    endDate: orNull(v.endDate), occurrenceCount: v.occurrenceCount === '' ? null : Number(v.occurrenceCount),
    fixed: v.kind !== 'other', debtId: v.kind === 'debt_installment' ? orNull(v.debtId) : null, active: v.active, note: orNull(v.note),
  }
}

export function blankRule(kind: RuleKind = 'bill'): Draft<'recurringRules'> {
  return {
    kind, type: typeForKind(kind), label: '', payee: null, amountCents: 0, amountMinCents: null, accountId: null, toAccountId: null,
    categoryId: null, frequency: 'monthly', interval: 1, startDate: null, dayUnknown: false, endDate: null, occurrenceCount: null,
    fixed: true, debtId: null, goalId: null, confidence: null, scenario: null, active: true, note: null, origin: 'user_entered',
  }
}

export const RULE_KIND_LABEL: Record<RuleKind, string> = {
  bill: 'Facture', subscription: 'Abonnement', income: 'Revenu régulier', debt_installment: 'Mensualité de crédit', savings: 'Virement d’épargne', other: 'Autre',
}

