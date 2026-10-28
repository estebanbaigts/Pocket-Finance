import { db, entityTables, tableFor } from './db'
import { nowIso } from './ids'
import { queueChange } from './outbox'
import { BACKUP_FORMAT, BACKUP_VERSION, backupSchema, type BackupFile } from './backupSchema'
import { ENTITY_NAMES, type AnyEntity, type EntityName } from './schema'

/** Export complet et indépendant de tout fournisseur : un simple fichier JSON lisible. */
export async function exportBackup(appName: string): Promise<BackupFile> {
  const entries = await Promise.all(ENTITY_NAMES.map(async (name) => [name, await tableFor(name).toArray()] as const))
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: nowIso(), appName, data: Object.fromEntries(entries) as unknown as BackupFile['data'] }
}

export type BackupCheck = { ok: true; backup: BackupFile; counts: Record<EntityName, number> } | { ok: false; error: string }

/** Valide un fichier avant toute écriture : un fichier invalide ne touche jamais aux données existantes. */
export function parseBackup(text: string): BackupCheck {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'Le fichier n’est pas un JSON valide.' }
  }
  const result = backupSchema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    return { ok: false, error: `Sauvegarde invalide (${issue?.path.join('.') ?? 'format'} : ${issue?.message ?? 'inconnu'}).` }
  }
  const counts = Object.fromEntries(ENTITY_NAMES.map((name) => [name, result.data.data[name].length])) as Record<EntityName, number>
  return { ok: true, backup: result.data, counts }
}

/**
 * Restauration : remplace intégralement les données locales, dans une seule transaction
 * (tout ou rien). Chaque enregistrement est remis en file pour être renvoyé au serveur si la
 * synchronisation est active ; les conflits éventuels seront alors présentés explicitement.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  await db.transaction('rw', [...entityTables(), db.outbox, db.conflicts], async () => {
    await Promise.all([...entityTables(), db.outbox, db.conflicts].map((table) => table.clear()))
    const at = nowIso()
    for (const name of ENTITY_NAMES) {
      const records = backup.data[name] as unknown as AnyEntity[]
      await tableFor(name).bulkPut(records as never[])
      for (const record of records) await queueChange(name, record.id, at)
    }
  })
}
