import { useState } from 'react'
import { Button, ConfirmDialog, Panel, useToast } from '@/components/ui'
import { resetDatabase } from '@/services/storage'
import { getSupabase } from '@/services/sync'
import { useSync } from '../sync/SyncProvider'

/** Suppression explicite des données, locales et (si connecté) distantes. Irréversible, donc confirmée. */
export function DangerSection() {
  const toast = useToast()
  const sync = useSync()
  const [confirm, setConfirm] = useState<'local' | 'cloud' | null>(null)

  const eraseLocal = async () => {
    await resetDatabase()
    window.location.reload()
  }
  const eraseCloud = async () => {
    const client = await getSupabase()
    const { error } = client ? await client.rpc('delete_my_data') : { error: new Error('non configuré') }
    if (error) toast({ title: 'Suppression distante impossible. Réessaie plus tard.', tone: 'error' })
    else toast({ title: 'Données distantes supprimées' })
    setConfirm(null)
  }

  return (
    <Panel title="Confidentialité et suppression">
      <ul className="mb-4 list-disc space-y-1 pl-5 text-[13px] text-ink-2">
        <li>Aucune mesure d’audience, aucun traceur publicitaire, aucun service d’IA.</li>
        <li>Les données locales sont stockées en clair dans ce navigateur : sur un appareil partagé, utilise un profil personnel.</li>
        <li>Avec la synchronisation, les données sont chiffrées en transit (HTTPS) et au repos chez l’hébergeur, mais pas de bout en bout.</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="danger" onClick={() => setConfirm('local')}>Effacer les données de cet appareil</Button>
        {sync.session && <Button variant="danger" onClick={() => setConfirm('cloud')}>Effacer mes données synchronisées</Button>}
      </div>
      <ConfirmDialog open={confirm === 'local'} title="Effacer toutes les données de cet appareil ?" message="Comptes, opérations, budgets, dettes et objectifs seront supprimés de ce navigateur. Exporte une sauvegarde avant si tu veux les conserver. Les données synchronisées ne sont pas touchées." confirmLabel="Tout effacer" onCancel={() => setConfirm(null)} onConfirm={eraseLocal} />
      <ConfirmDialog open={confirm === 'cloud'} title="Effacer tes données synchronisées ?" message="Toutes tes données seront supprimées du serveur. Cette action est définitive. Les données de cet appareil restent jusqu’à ce que tu les effaces aussi." confirmLabel="Effacer sur le serveur" onCancel={() => setConfirm(null)} onConfirm={eraseCloud} />
    </Panel>
  )
}
