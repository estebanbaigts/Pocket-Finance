import { describe, expect, it } from 'vitest'
import { debtShare, fixedVsVariable, monthlyEquivalent, revenueVsCash, subscriptionsInsight } from '@/domain'
import { makeRule } from '../../fixtures-rules'
import { makeTxn } from '../../fixtures'

describe('analyses et constats', () => {
  it('chiffre les abonnements avec leurs justificatifs', () => {
    const qonto = makeRule({ kind: 'subscription', label: 'Qonto', amountCents: 10_000, amountMinCents: 8_000 })
    const insight = subscriptionsInsight([qonto, makeRule({ id: 'r2', kind: 'subscription', label: 'Annuel', frequency: 'yearly', amountCents: 12_000 })])
    expect(insight?.title.replace(/\s/g, ' ')).toContain('110,00 €')
    expect(insight?.evidence).toHaveLength(2)
    expect(monthlyEquivalent({ frequency: 'weekly', interval: 1, amountCents: 1_200 })).toBe(5_200)
  })

  it('sépare chiffre d’affaires déclaré et argent reçu', () => {
    const declared = [{ id: 'd', month: '2026-10', amountCents: 336_000, gross: true, note: '' }]
    const invoice = makeTxn({ type: 'income', amountCents: 120_000, invoiceRef: 'F-12', status: 'confirmed' })
    expect(revenueVsCash([invoice], declared, '2026-10')).toEqual({ declaredCents: 336_000, invoicedCents: 120_000, receivedCents: 0 })
  })

  it('répartit fixe / variable et mesure le poids des dettes', () => {
    const txns = [makeTxn({ amountCents: 5_348, debtId: 'd' }), makeTxn({ amountCents: 4_652 })]
    expect(fixedVsVariable(txns, [], '2026-10')).toEqual({ fixedCents: 5_348, variableCents: 4_652 })
    expect(debtShare(txns, '2026-10').share).toBeCloseTo(0.5348)
  })
})
