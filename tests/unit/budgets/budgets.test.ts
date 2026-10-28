import { describe, expect, it } from 'vitest'
import { effectiveBudget, monthBudgetSummary, rolloverInto } from '@/domain/budgets'
import type { Budget, Category } from '@/domain/model'
import { makeTxn } from '../../fixtures'

const food: Category = { id: 'food', createdAt: '', updatedAt: '', deletedAt: null, version: 1, name: 'Alimentation', kind: 'expense', tone: 'green', fixed: false }
const savings: Category = { ...food, id: 'sav', name: 'Épargne', kind: 'savings' }

function budget(fromMonth: string, amountCents: number, rollover = false): Budget {
  return { id: `b-${fromMonth}`, createdAt: '', updatedAt: '', deletedAt: null, version: 1, categoryId: 'food', fromMonth, amountCents, rollover, alertPercent: 80 }
}

describe('budgets', () => {
  it('modifier un budget futur ne change pas les mois passés', () => {
    const budgets = [budget('2026-09', 40_000), budget('2026-12', 30_000)]
    expect(effectiveBudget(budgets, 'food', '2026-08')).toBeNull()
    expect(effectiveBudget(budgets, 'food', '2026-10')?.amountCents).toBe(40_000)
    expect(effectiveBudget(budgets, 'food', '2027-01')?.amountCents).toBe(30_000)
  })

  it('calcule consommé, restant, dépassements et ignore annulées et prévues', () => {
    const txns = [
      makeTxn({ categoryId: 'food', amountCents: 35_000, date: '2026-10-03' }),
      makeTxn({ categoryId: 'food', amountCents: 10_000, date: '2026-10-04', status: 'cancelled' }),
      makeTxn({ categoryId: 'food', amountCents: 8_000, date: '2026-10-20', status: 'planned' }),
    ]
    const summary = monthBudgetSummary([food, savings], [budget('2026-10', 40_000)], txns, '2026-10')
    expect(summary).toMatchObject({ totalCents: 40_000, spentCents: 35_000, remainingCents: 5_000 })
    expect(summary.near.map((l) => l.category.id)).toEqual(['food'])
    expect(summary.lines).toHaveLength(1)
    expect(summary.lines[0]?.committedCents).toBe(8_000)
  })

  it('signale un dépassement', () => {
    const txns = [makeTxn({ categoryId: 'food', amountCents: 45_000, date: '2026-10-03' })]
    expect(monthBudgetSummary([food], [budget('2026-10', 40_000)], txns, '2026-10').over).toHaveLength(1)
  })

  it('reporte le reliquat positif seulement', () => {
    const budgets = [budget('2026-09', 40_000, true)]
    const under = [makeTxn({ categoryId: 'food', amountCents: 30_000, date: '2026-09-10' })]
    const over = [makeTxn({ categoryId: 'food', amountCents: 50_000, date: '2026-09-10' })]
    expect(rolloverInto(budgets, under, 'food', '2026-10')).toBe(10_000)
    expect(rolloverInto(budgets, over, 'food', '2026-10')).toBe(0)
  })
})
