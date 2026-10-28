import type { Debt } from '@/domain/model'
import type { Draft } from '@/services/storage'

export function toDebtDraft(debt: Debt): Draft<'debts'> {
  const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, version: _v, ...draft } = debt
  return draft
}
