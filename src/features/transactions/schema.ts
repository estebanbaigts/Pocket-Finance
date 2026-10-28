import { z } from 'zod'
import { parseAmountInput } from '@/domain/money'

/** Validation du formulaire d'opération. Les champs facultatifs ne bloquent jamais l'enregistrement. */
export const transactionFormSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.string().refine((v) => parseAmountInput(v) !== null, 'Montant invalide (ex. 12,50)'),
    description: z.string().max(500, '500 caractères maximum'),
    categoryId: z.string(),
    accountId: z.string(),
    toAccountId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
    status: z.enum(['planned', 'confirmed', 'received', 'paid', 'cancelled']),
    payee: z.string().max(120),
    isBill: z.boolean(),
    debtId: z.string(),
    goalId: z.string(),
    confidence: z.enum(['', 'high', 'medium', 'low']),
    scenario: z.enum(['', 'prudent', 'realistic', 'favorable']),
    invoiceRef: z.string().max(60),
    note: z.string().max(1000),
  })
  .superRefine((value, ctx) => {
    if (value.type !== 'transfer') return
    if (!value.accountId) ctx.addIssue({ code: 'custom', path: ['accountId'], message: 'Choisis le compte de départ' })
    if (!value.toAccountId) ctx.addIssue({ code: 'custom', path: ['toAccountId'], message: 'Choisis le compte d’arrivée' })
    if (value.accountId && value.accountId === value.toAccountId) ctx.addIssue({ code: 'custom', path: ['toAccountId'], message: 'Les deux comptes doivent être différents' })
  })

export type TransactionFormValues = z.infer<typeof transactionFormSchema>
