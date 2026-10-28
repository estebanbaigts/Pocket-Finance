import type { Frequency, RuleKind } from '@/domain/model'

export interface AccountInput {
  key: string
  name: string
  kind: 'checking' | 'savings' | 'cash'
  balance: string
  negative: boolean
}

export interface RecurringInput {
  key: string
  include: boolean
  label: string
  kind: RuleKind
  category: string
  amount: string
  amountMin: string
  /** Jour du mois (« 5 ») ; vide = inconnu. */
  day: string
  /** Première échéance exacte, pour les échéanciers dont le calendrier doit être confirmé. */
  firstDate: string
  frequency: Frequency
  occurrenceCount: number | null
  /** Le calendrier doit être confirmé avant d'être projeté (ex. PS5). */
  needsSchedule: boolean
  debt: { creditor: string; kind: 'loan' | 'installment' } | null
  note: string
}

export interface IncomeInput {
  key: string
  label: string
  amount: string
  date: string
  confidence: 'high' | 'medium' | 'low'
}

export interface OnboardingState {
  mode: 'local' | 'cloud'
  trackingStart: string
  accounts: AccountInput[]
  declareRevenue: boolean
  revenueAmount: string
  revenueMonth: string
  incomes: IncomeInput[]
  recurring: RecurringInput[]
  overdraft: { include: boolean; amount: string; accountKey: string }
  budgets: Record<string, string>
  emergencyTarget: string
}
