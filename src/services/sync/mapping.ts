import type { AnyEntity } from '../storage/schema'

/** Colonnes gérées exclusivement par le serveur : jamais envoyées, jamais stockées localement. */
const SERVER_ONLY = new Set(['owner_id', 'server_updated_at'])

export function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

/** Enregistrement local → ligne PostgreSQL (clés de premier niveau seulement ; le JSON imbriqué est conservé). */
export function toRow(record: AnyEntity): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [camelToSnake(key), value]))
}

/** Horodatages client normalisés au format ISO « Z » pour une comparaison exacte avec la copie locale. */
const TIMESTAMPS = new Set(['createdAt', 'updatedAt', 'deletedAt'])

/** Ligne PostgreSQL → enregistrement local. */
export function fromRow(row: Record<string, unknown>): AnyEntity {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => !SERVER_ONLY.has(key))
      .map(([key, value]) => {
        const name = snakeToCamel(key)
        return [name, TIMESTAMPS.has(name) && typeof value === 'string' ? new Date(value).toISOString() : value]
      }),
  ) as unknown as AnyEntity
}
