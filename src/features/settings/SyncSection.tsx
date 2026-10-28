import { Button, Panel, Toggle } from '@/components/ui'
import { updateEntity } from '@/services/storage'
import { signOut } from '@/services/sync'
import { useLedger } from '../data/LedgerProvider'
import { SyncIndicator } from '../sync/SyncIndicator'
import { useSync } from '../sync/SyncProvider'
import { ConflictsList } from './ConflictsList'
import { LoginForm } from './LoginForm'

export function SyncSection() {
  const { settings } = useLedger()
  const sync = useSync()
  if (!settings) return null

  if (!sync.configured) {
    return (
      <Panel title="Synchronisation" eyebrow="Non configurée">
        <p className="text-[13px] text-ink-2">L’application fonctionne entièrement sur cet appareil. Pour synchroniser Mac et iPhone, crée un projet Supabase gratuit, applique les migrations du dossier <code>db/migrations</code>, puis renseigne <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> (voir <code>docs/synchronisation.md</code>).</p>
      </Panel>
    )
  }
  return (
    <Panel title="Synchronisation">
      <div className="flex flex-col gap-4">
        <Toggle checked={settings.syncMode === 'cloud'} onChange={(v) => void updateEntity('settings', settings.id, { syncMode: v ? 'cloud' : 'local' })} label="Synchroniser cet appareil" description="Les données restent aussi disponibles hors ligne ; les modifications partent dès que le réseau revient." />
        {settings.syncMode === 'cloud' && !sync.session && <LoginForm />}
        {sync.session && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-[13px] text-ink-2">Connecté : {sync.session.user.email}</p>
            <Button size="sm" onClick={() => void sync.syncNow()} disabled={sync.running}>Synchroniser maintenant</Button>
            <Button size="sm" variant="ghost" onClick={() => void signOut()}>Se déconnecter</Button>
          </div>
        )}
        <div className="rounded-md border border-line"><SyncIndicator /></div>
        {sync.status?.lastError && <p role="alert" className="text-[12px] text-danger">Dernière erreur : {sync.status.lastError}. Les modifications restent en attente et seront renvoyées.</p>}
        <ConflictsList />
      </div>
    </Panel>
  )
}
