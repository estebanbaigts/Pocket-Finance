import type { SavingsGoal } from '@/domain/model'
import type { Draft } from '@/services/storage'

export function toGoalDraft(goal: SavingsGoal): Draft<'savingsGoals'> {
  const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, version: _v, ...draft } = goal
  return draft
}
