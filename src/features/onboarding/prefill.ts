import { monthKey } from '@/domain/dates'
import type { OnboardingState, RecurringInput } from './state'

function rule(partial: Partial<RecurringInput> & Pick<RecurringInput, 'key' | 'label' | 'amount' | 'category'>): RecurringInput {
  return { include: true, kind: 'bill', amountMin: '', day: '', firstDate: '', frequency: 'monthly', occurrenceCount: null, needsSchedule: false, debt: null, note: '', ...partial }
}

/**
 * Valeurs déclarées par l'utilisateur, pré-remplies et modifiables. Elles sont marquées comme
 * « déclarées, non vérifiées ». Aucune n'est considérée payée ou encaissée ; aucune date,
 * aucun solde, aucun taux ni capital restant n'est inventé.
 */
export function initialState(today: string): OnboardingState {
  return {
    mode: 'local',
    trackingStart: today,
    accounts: [{ key: 'cic', name: 'CIC — compte courant', kind: 'checking', balance: '', negative: false }],
    declareRevenue: true,
    revenueAmount: '3360',
    revenueMonth: `${today.slice(0, 4)}-10` <= monthKey(today) ? `${today.slice(0, 4)}-10` : monthKey(today),
    incomes: [],
    recurring: [
      rule({ key: 'rent', label: 'Loyer', amount: '900', category: 'Logement' }),
      rule({ key: 'sofinco', label: 'Crédit Sofinco', amount: '53,48', category: 'Crédits', kind: 'debt_installment', debt: { creditor: 'Sofinco', kind: 'loan' } }),
      rule({ key: 'younited', label: 'Crédit Younited', amount: '60', category: 'Crédits', kind: 'debt_installment', debt: { creditor: 'Younited', kind: 'loan' } }),
      rule({ key: 'ps5', label: 'Mensualité PS5', amount: '171,68', category: 'Crédits', kind: 'debt_installment', occurrenceCount: 4, needsSchedule: true, debt: { creditor: 'PS5 (paiement en 4 fois)', kind: 'installment' }, note: '4 mensualités au total, calendrier à confirmer' }),
      rule({ key: 'qonto', label: 'Qonto', amount: '100', amountMin: '80', category: 'Abonnements', kind: 'subscription', note: 'Montant exact à confirmer (80 à 100 €)' }),
    ],
    overdraft: { include: true, amount: '212', accountKey: 'cic' },
    budgets: { Alimentation: '', Transport: '', Loisirs: '', Achats: '' },
    emergencyTarget: '',
  }
}
