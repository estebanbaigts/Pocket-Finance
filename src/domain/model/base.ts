/** Identifiant stable (UUID v4), généré côté client pour éviter les doublons lors de la synchronisation. */
export type Id = string

/** Date calendaire locale au format AAAA-MM-JJ. Jamais d'heure : évite les décalages de fuseau horaire. */
export type IsoDate = string

/** Mois au format AAAA-MM. */
export type MonthKey = string

/** Montant en centimes, entier positif ou nul. Le sens (entrée/sortie) vient du type d'opération. */
export type Cents = number

/** Champs communs à toute entité synchronisée. */
export interface SyncedEntity {
  id: Id
  createdAt: string
  updatedAt: string
  /** Suppression logique : nécessaire pour propager une suppression entre appareils. */
  deletedAt: string | null
  /** Incrémentée à chaque modification locale ; sert à détecter les conflits (verrou optimiste). */
  version: number
}

/** Origine d'une donnée : saisie/déclarée par l'utilisateur, jamais vérifiée auprès d'une banque. */
export type DataOrigin = 'user_declared' | 'user_entered'
