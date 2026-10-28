import type { Session } from '@supabase/supabase-js'
import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useOnline } from '@/lib/useOnline'
import { db } from '@/services/storage'
import { SupabaseRemote, currentSession, getSupabase, isCloudConfigured, onSessionChange, readSyncStatus, retryDelayMs, syncOnce, type SyncStatus } from '@/services/sync'
import { useLedger } from '../data/LedgerProvider'

interface SyncContextValue {
  configured: boolean
  enabled: boolean
  session: Session | null
  status: SyncStatus | null
  running: boolean
  syncNow: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

/**
 * Lance la synchronisation uniquement si elle est configurée, activée par l'utilisateur et
 * qu'une session existe. Déclencheurs : ouverture, retour du réseau, modification locale, minuterie.
 */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { settings } = useLedger()
  const online = useOnline()
  const configured = isCloudConfigured()
  const [session, setSession] = useState<Session | null>(null)
  const [running, setRunning] = useState(false)
  const failures = useRef(0)
  const enabled = configured && settings?.syncMode === 'cloud' && session !== null
  const pending = useLiveQuery(() => db.outbox.count(), [], 0)
  const status = useLiveQuery(() => readSyncStatus(enabled, online), [enabled, online, pending, running], null)

  useEffect(() => {
    if (!configured) return
    void currentSession().then(setSession)
    return onSessionChange(setSession)
  }, [configured])

  const syncNow = useCallback(async () => {
    const client = getSupabase()
    if (!enabled || !client || !online || running) return
    setRunning(true)
    const outcome = await syncOnce(new SupabaseRemote(client))
    failures.current = outcome.ok ? 0 : failures.current + 1
    setRunning(false)
  }, [enabled, online, running])

  useEffect(() => {
    if (!enabled || !online) return
    const timer = window.setTimeout(() => void syncNow(), pending > 0 ? 1500 : 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, online, pending])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => void syncNow(), Math.max(60_000, retryDelayMs(failures.current)))
    return () => window.clearInterval(timer)
  }, [enabled, syncNow])

  return <SyncContext.Provider value={{ configured, enabled, session, status, running, syncNow }}>{children}</SyncContext.Provider>
}

export function useSync(): SyncContextValue {
  const value = useContext(SyncContext)
  if (!value) throw new Error('useSync doit être utilisé dans SyncProvider')
  return value
}
