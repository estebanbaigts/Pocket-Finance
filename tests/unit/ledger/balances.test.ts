import { describe, expect, it } from 'vitest'
import { accountBalance, totalBalance, expensesPaid, incomeExpected, incomeReceived } from '@/domain/ledger'
import { makeAccount, makeTxn } from '../../fixtures'

describe('soldes', () => {
  const checking = makeAccount({ openingBalanceCents: 100_000 })
  const savings = makeAccount({ kind: 'savings', openingBalanceCents: 50_000 })

  it('un transfert interne ne crée ni revenu ni dépense et ne change pas le total', () => {
    const transfer = makeTxn({ type: 'transfer', amountCents: 20_000, accountId: checking.id, toAccountId: savings.id })
    const total = totalBalance([checking, savings], [transfer])
    expect(total.knownCents).toBe(150_000)
    expect(accountBalance(checking, [transfer]).cents).toBe(80_000)
    expect(accountBalance(savings, [transfer]).cents).toBe(70_000)
    expect(incomeReceived([transfer], '2026-10')).toBe(0)
    expect(expensesPaid([transfer], '2026-10')).toBe(0)
  })

  it('un revenu attendu non encaissé ne modifie pas le solde', () => {
    const expected = makeTxn({ type: 'income', amountCents: 336_000, accountId: checking.id, status: 'planned' })
    expect(accountBalance(checking, [expected]).cents).toBe(100_000)
    expect(incomeExpected([expected], '2026-10')).toBe(336_000)
    expect(incomeReceived([expected], '2026-10')).toBe(0)
  })

  it('une opération annulée ou supprimée n’a plus d’effet', () => {
    const cancelled = makeTxn({ amountCents: 5_000, accountId: checking.id, status: 'cancelled' })
    const deleted = makeTxn({ amountCents: 5_000, accountId: checking.id, deletedAt: '2026-10-11T00:00:00Z' })
    expect(accountBalance(checking, [cancelled, deleted]).cents).toBe(100_000)
    expect(expensesPaid([cancelled, deleted], '2026-10')).toBe(0)
  })

  it('n’invente pas de solde quand le solde initial est inconnu', () => {
    const unknown = makeAccount({ openingBalanceCents: null })
    const spend = makeTxn({ amountCents: 2_000, accountId: unknown.id })
    expect(accountBalance(unknown, [spend])).toMatchObject({ cents: null, movementCents: -2_000 })
    const total = totalBalance([checking, unknown], [spend])
    expect(total.knownCents).toBe(100_000)
    expect(total.unknownAccounts).toHaveLength(1)
  })

  it('ignore les opérations antérieures à la date du solde initial', () => {
    const before = makeTxn({ amountCents: 9_999, accountId: checking.id, date: '2026-09-30' })
    expect(accountBalance(checking, [before]).cents).toBe(100_000)
  })

  it('recalcule l’historique après modification d’une opération (calcul pur, sans cumul stocké)', () => {
    const original = makeTxn({ amountCents: 3_000, accountId: checking.id })
    const edited = { ...original, amountCents: 4_500, version: 2 }
    expect(accountBalance(checking, [original]).cents).toBe(97_000)
    expect(accountBalance(checking, [edited]).cents).toBe(95_500)
  })

  it('un montant nul est accepté sans effet', () => {
    const zero = makeTxn({ amountCents: 0, accountId: checking.id })
    expect(accountBalance(checking, [zero]).cents).toBe(100_000)
  })
})
