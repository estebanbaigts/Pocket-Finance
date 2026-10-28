import type { RecurringRule } from '@/domain/model'
import type { Draft } from '@/services/storage'

export function toRuleDraft(rule: RecurringRule): Draft<'recurringRules'> {
  const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, version: _v, ...draft } = rule
  return draft
}
