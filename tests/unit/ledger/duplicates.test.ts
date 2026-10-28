import { describe, expect, it } from 'vitest'
import { expensesDue, expensesPaid, findDuplicatePairs, reconcile } from '@/domain/ledger'
import { makeTxn } from '../../fixtures'

describe('rapprochement des doublons', () => {
  const bill = makeTxn({ status: 'planned', amountCents: 90_000, accountId: 'a', isBill: true, recurringRuleId: 'rent', occurrenceKey: 'rent:2026-10-05', date: '2026-10-05' })
  const manual = makeTxn({ status: 'paid', amountCents: 90_000, accountId: 'a', date: '2026-10-06', description: 'Loyer' })

  it('détecte une facture prévue et une dépense saisie séparément', () => {
    const pairs = findDuplicatePairs([bill, manual])
    expect(pairs).toHaveLength(1)
    // Sans rapprochement, l'interface signale le risque : prévu + payé = double comptage potentiel.
    expect(expensesPaid([bill, manual], '2026-10') + expensesDue([bill, manual], '2026-10')).toBe(180_000)
  })

  it('après rapprochement, la dépense n’est comptée qu’une fois et garde le lien vers l’échéance', () => {
    const [pair] = findDuplicatePairs([bill, manual])
    const { keep, removeId } = reconcile(pair!)
    const after = [keep]
    expect(removeId).toBe(bill.id)
    expect(keep.occurrenceKey).toBe('rent:2026-10-05')
    expect(expensesPaid(after, '2026-10') + expensesDue(after, '2026-10')).toBe(90_000)
  })

  it('ne rapproche pas des montants ou comptes différents', () => {
    expect(findDuplicatePairs([bill, { ...manual, amountCents: 89_999 }])).toHaveLength(0)
    expect(findDuplicatePairs([bill, { ...manual, accountId: 'b' }])).toHaveLength(0)
  })
})
