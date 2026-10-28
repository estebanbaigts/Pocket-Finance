import type { Account } from '@/domain/model'
import type { Draft } from '@/services/storage'

export function toAccountDraft(account: Account): Draft<'accounts'> {
  const { id: _id, createdAt: _c, updatedAt: _u, deletedAt: _d, version: _v, ...draft } = account
  return draft
}
