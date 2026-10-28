import { z } from 'zod'

export const BACKUP_FORMAT = 'pocket-backup'
export const BACKUP_VERSION = 1

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const cents = z.number().int().nonnegative()
const signedCents = z.number().int()

/** Champs communs ; les autres champs sont conservés tels quels (`passthrough`) puis contrôlés par entité. */
const base = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  version: z.number().int().nonnegative(),
}).passthrough()

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  appName: z.string(),
  data: z.object({
    settings: z.array(base),
    accounts: z.array(base.extend({ name: z.string(), openingBalanceCents: signedCents.nullable() })),
    categories: z.array(base.extend({ name: z.string(), kind: z.enum(['expense', 'income', 'savings']) })),
    transactions: z.array(base.extend({
      type: z.enum(['income', 'expense', 'transfer']),
      amountCents: cents,
      date: isoDate,
      status: z.enum(['planned', 'confirmed', 'received', 'paid', 'cancelled']),
    })),
    recurringRules: z.array(base.extend({ amountCents: cents, startDate: isoDate.nullable() })),
    budgets: z.array(base.extend({ categoryId: z.string(), fromMonth: z.string().regex(/^\d{4}-\d{2}$/), amountCents: cents })),
    debts: z.array(base.extend({ creditor: z.string(), monthlyPaymentCents: cents })),
    debtPayments: z.array(base.extend({ debtId: z.string(), totalCents: cents, date: isoDate })),
    savingsGoals: z.array(base.extend({ name: z.string(), targetCents: cents })),
  }),
})

export type BackupFile = z.infer<typeof backupSchema>
