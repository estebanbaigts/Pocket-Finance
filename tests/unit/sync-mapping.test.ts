import { describe, expect, it } from 'vitest'
import { fromRow, toRow } from '@/services/sync/mapping'
import { retryDelayMs } from '@/services/sync/engine'
import { deterministicId } from '@/services/storage/ids'
import { makeTxn } from './../fixtures'

describe('correspondance locale ↔ PostgreSQL', () => {
  it('fait l’aller-retour sans perte et retire les colonnes serveur', () => {
    const txn = makeTxn({ createdAt: '2026-10-01T10:00:00.000Z', deletedAt: null })
    const row = { ...toRow(txn), owner_id: 'u', server_updated_at: 'x', created_at: '2026-10-01T10:00:00+00:00' }
    expect(row).toHaveProperty('amount_cents', txn.amountCents)
    expect(fromRow(row)).toEqual(txn)
  })

  it('identifiants déterministes au format UUID', () => {
    const id = deterministicId('rule:2026-10-05')
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(deterministicId('rule:2026-10-05')).toBe(id)
    expect(deterministicId('rule:2026-11-05')).not.toBe(id)
  })

  it('espace les nouvelles tentatives', () => {
    expect(retryDelayMs(0)).toBe(5_000)
    expect(retryDelayMs(2)).toBe(20_000)
    expect(retryDelayMs(20)).toBe(300_000)
  })
})
