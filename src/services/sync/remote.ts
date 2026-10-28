import type { AnyEntity, EntityName } from '../storage/schema'

/**
 * Résultat d'un envoi :
 * - applied  : le serveur a accepté ; `version` est la nouvelle version serveur ;
 * - conflict : la version serveur n'est plus celle sur laquelle reposait la modification locale.
 */
export type PushResult = { status: 'applied'; version: number } | { status: 'conflict'; remote: AnyEntity }

export interface PullPage {
  records: AnyEntity[]
  /** Curseur serveur à mémoriser pour la prochaine récupération incrémentale. */
  cursor: string | null
}

/**
 * Contrat d'un serveur de synchronisation. Le moteur ne dépend que de cette interface :
 * Supabase en est une implémentation, un serveur en mémoire en est une autre (tests).
 */
export interface RemoteAdapter {
  /** Envoie un enregistrement. `record.version` est la version serveur sur laquelle il repose (0 = nouveau). */
  push(entity: EntityName, record: AnyEntity): Promise<PushResult>
  pull(entity: EntityName, since: string | null): Promise<PullPage>
}

/** Erreur réseau ou serveur : l'opération reste en file et sera retentée. */
export class RemoteUnavailableError extends Error {
  constructor(message = 'Serveur injoignable') {
    super(message)
    this.name = 'RemoteUnavailableError'
  }
}
