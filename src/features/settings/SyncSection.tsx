import { useState } from 'react'
import { Button, Field, Panel, TextInput, Toggle, useToast } from '@/components/ui'
import { updateEntity } from '@/services/storage'
import { sendMagicLink, signOut } from '@/services/sync'
import { useLedger } from '../data/LedgerProvider'
import { SyncIndicator } from '../sync/SyncIndicator'
import { useSync } from '../sync/SyncProvider'
import { ConflictsList } from './ConflictsList'

export function SyncSection() {
  const { settings } = useLedger()
  const sync = useSync()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
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
        {settings.syncMode === 'cloud' && !sync.session && (
          sent ? <p className="text-[13px] text-ink-2">Lien envoyé. Ouvre-le sur cet appareil pour te connecter.</p> : (
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Adresse e-mail" className="min-w-[240px] flex-1">{(p) => <TextInput type="email" autoComplete="email" {...p} value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
              <Button variant="primary" disabled={!email.includes('@')} onClick={async () => { const r = await sendMagicLink(email); if (r.ok) setSent(true); else toast({ title: r.error ?? 'Erreur', tone: 'error' }) }}>Recevoir un lien de connexion</Button>
            </div>
          )
        )}
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
