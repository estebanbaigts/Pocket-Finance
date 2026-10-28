import { beforeEach, describe, expect, it } from 'vitest'
import {
  createEntity, db, ensureDefaults, ensureOccurrences, exportBackup, parseBackup, pendingChanges,
  resetDatabase, restoreBackup, restoreEntity, softDelete, updateEntity,
} from '@/services/storage'
import { accountBalance } from '@/domain/ledger'
import { makeRule } from '../fixtures-rules'

beforeEach(async () => {
  await resetDatabase()
})

describe('stockage local', () => {
  it('crée, modifie et supprime une opération avec recalcul du solde', async () => {
    const account = await createEntity('accounts', { name: 'CIC', kind: 'checking', currency: 'EUR', openingBalanceCents: 50_000, openingDate: '2026-10-01', includeInTotals: true, archived: false, origin: 'user_entered' })
    const txn = await createEntity('transactions', {
      type: 'expense', amountCents: 1_250, amountMinCents: null, currency: 'EUR', date: '2026-10-10', valueDate: null, dateEstimated: false,
      accountId: account.id, toAccountId: null, categoryId: null, description: 'Courses', status: 'paid', recurringRuleId: null,
      occurrenceKey: null, isBill: false, payee: null, debtId: null, goalId: null, confidence: null, scenario: null, source: null,
      invoiceRef: null, attachmentName: null, note: null, origin: 'user_entered',
    })
    const balance = async () => accountBalance(account, await db.transactions.toArray()).cents
    expect(await balance()).toBe(48_750)
    await updateEntity('transactions', txn.id, { amountCents: 2_000 })
    expect(await balance()).toBe(48_000)
    await softDelete('transactions', txn.id)
    expect(await balance()).toBe(50_000)
    await restoreEntity('transactions', txn.id)
    expect(await balance()).toBe(48_000)
    // Une seule entrée de file par enregistrement, quelle que soit la quantité de modifications.
    expect((await pendingChanges()).filter((c) => c.recordId === txn.id)).toHaveLength(1)
  })

  it('initialise les catégories par défaut une seule fois', async () => {
    await ensureDefaults('Pocket')
    await ensureDefaults('Pocket')
    expect(await db.settings.count()).toBe(1)
    expect(await db.categories.count()).toBe(13)
  })

  it('matérialise les factures récurrentes sans doublon, même appelé plusieurs fois', async () => {
    const { id: _ignored, ...rule } = makeRule({ startDate: '2026-10-05' })
    await createEntity('recurringRules', rule)
    expect(await ensureOccurrences('2026-10-28')).toBe(2)
    expect(await ensureOccurrences('2026-10-28')).toBe(0)
    expect(await ensureOccurrences('2026-11-02')).toBe(1)
    expect(await db.transactions.count()).toBe(3)
  })

  it('sauvegarde puis restaure à l’identique', async () => {
    await ensureDefaults('Pocket')
    await createEntity('accounts', { name: 'Livret', kind: 'savings', currency: 'EUR', openingBalanceCents: 12_345, openingDate: null, includeInTotals: true, archived: false, origin: 'user_entered' })
    const backup = await exportBackup('Pocket')
    const text = JSON.stringify(backup)
    await resetDatabase()
    const check = parseBackup(text)
    expect(check.ok).toBe(true)
    if (!check.ok) return
    expect(check.counts.accounts).toBe(1)
    await restoreBackup(check.backup)
    expect((await db.accounts.toArray())[0]?.openingBalanceCents).toBe(12_345)
    expect(await db.categories.count()).toBe(13)
  })

  it('refuse une sauvegarde invalide sans toucher aux données', async () => {
    await ensureDefaults('Pocket')
    expect(parseBackup('{oops').ok).toBe(false)
    const bad = parseBackup(JSON.stringify({ format: 'pocket-backup', version: 1, exportedAt: '', appName: 'x', data: { transactions: [{ amountCents: 1.5 }] } }))
    expect(bad.ok).toBe(false)
    expect(await db.categories.count()).toBe(13)
  })
})

describe('initialisation concurrente', () => {
  it('deux initialisations simultanées ne créent qu’un seul jeu de paramètres', async () => {
    await resetDatabase()
    await Promise.all([ensureDefaults('Pocket'), ensureDefaults('Pocket')])
    expect(await db.settings.count()).toBe(1)
    expect(await db.categories.count()).toBe(13)
  })
})
