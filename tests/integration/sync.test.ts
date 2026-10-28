import { beforeEach, describe, expect, it } from 'vitest'
import { createEntity, db, resetDatabase, softDelete, updateEntity } from '@/services/storage'
import { listConflicts, resolveConflict } from '@/services/sync/conflicts'
import { syncOnce } from '@/services/sync/engine'
import { readSyncStatus } from '@/services/sync/status'
import { MemoryRemote } from '../support/memoryRemote'

const accountDraft = { name: 'CIC', kind: 'checking' as const, currency: 'EUR' as const, openingBalanceCents: 10_000, openingDate: '2026-10-01', includeInTotals: true, archived: false, origin: 'user_entered' as const }

let remote: MemoryRemote

beforeEach(async () => {
  await resetDatabase()
  remote = new MemoryRemote()
})

describe('synchronisation', () => {
  it('envoie les créations et marque l’état « Synchronisé »', async () => {
    const account = await createEntity('accounts', accountDraft)
    expect((await readSyncStatus(true, true)).state).toBe('pending')
    const outcome = await syncOnce(remote)
    expect(outcome).toMatchObject({ ok: true, pushed: 1, conflicts: 0 })
    expect(remote.get('accounts', account.id)?.version).toBe(1)
    expect((await db.accounts.get(account.id))?.version).toBe(1)
    expect((await readSyncStatus(true, true)).state).toBe('synced')
  })

  it('une synchronisation répétée ne duplique rien et n’envoie rien de plus', async () => {
    await createEntity('accounts', accountDraft)
    await syncOnce(remote)
    const pushes = remote.pushes
    await syncOnce(remote)
    await syncOnce(remote)
    expect(remote.pushes).toBe(pushes)
    expect(await db.accounts.count()).toBe(1)
  })

  it('perte de connexion : les modifications restent en file puis partent au retour du réseau', async () => {
    await createEntity('accounts', accountDraft)
    remote.online = false
    const failed = await syncOnce(remote)
    expect(failed.ok).toBe(false)
    expect((await readSyncStatus(true, true)).state).toBe('error')
    expect((await readSyncStatus(true, false)).state).toBe('offline')
    expect(await db.outbox.count()).toBe(1)
    remote.online = true
    expect((await syncOnce(remote)).pushed).toBe(1)
    expect(await db.outbox.count()).toBe(0)
  })

  it('conflit de modifications : rien n’est écrasé silencieusement, résolution explicite', async () => {
    const account = await createEntity('accounts', accountDraft)
    await syncOnce(remote)
    remote.editFromOtherDevice('accounts', account.id, { openingBalanceCents: 99_999 })
    await updateEntity('accounts', account.id, { openingBalanceCents: 12_000 })
    const outcome = await syncOnce(remote)
    expect(outcome.conflicts).toBe(1)
    expect((await readSyncStatus(true, true)).state).toBe('conflict')
    expect((await db.accounts.get(account.id))?.openingBalanceCents).toBe(12_000)
    expect(remote.get('accounts', account.id)).toMatchObject({ openingBalanceCents: 99_999 })

    const [conflict] = await listConflicts()
    await resolveConflict(conflict!, 'mine')
    await syncOnce(remote)
    expect(remote.get('accounts', account.id)).toMatchObject({ openingBalanceCents: 12_000, version: 3 })
    expect(await listConflicts()).toHaveLength(0)
  })

  it('choisir la version du serveur abandonne la modification locale', async () => {
    const account = await createEntity('accounts', accountDraft)
    await syncOnce(remote)
    remote.editFromOtherDevice('accounts', account.id, { name: 'CIC perso' })
    await updateEntity('accounts', account.id, { name: 'CIC joint' })
    await syncOnce(remote)
    const [conflict] = await listConflicts()
    await resolveConflict(conflict!, 'theirs')
    expect((await db.accounts.get(account.id))?.name).toBe('CIC perso')
    expect(await db.outbox.count()).toBe(0)
  })

  it('reçoit les changements d’un autre appareil et propage les suppressions', async () => {
    const account = await createEntity('accounts', accountDraft)
    await syncOnce(remote)
    remote.editFromOtherDevice('accounts', account.id, { name: 'Renommé ailleurs' })
    expect((await syncOnce(remote)).pulled).toBe(1)
    expect((await db.accounts.get(account.id))?.name).toBe('Renommé ailleurs')
    await softDelete('accounts', account.id)
    await syncOnce(remote)
    expect(remote.get('accounts', account.id)?.deletedAt).not.toBeNull()
  })
})
