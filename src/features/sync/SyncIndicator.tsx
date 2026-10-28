import { AlertTriangle, Check, CloudOff, HardDrive, Loader2, RefreshCw, GitMerge } from 'lucide-react'
import type { SyncState } from '@/services/sync'
import { cn } from '@/lib/cn'
import { useSync } from './SyncProvider'

const LABEL: Record<SyncState, string> = {
  local: 'Données locales', synced: 'Synchronisé', pending: 'En attente', error: 'Erreur de synchro', conflict: 'Conflit à résoudre', offline: 'Hors ligne',
}

function formatSince(iso: string | null): string {
  if (!iso) return 'jamais'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(new Date(iso))
}

/** Indicateur d'état : libellé texte + icône (jamais la couleur seule). */
export function SyncIndicator({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) {
  const { status, running } = useSync()
  const state = status?.state ?? 'local'
  const Icon = running ? Loader2 : { local: HardDrive, synced: Check, pending: RefreshCw, error: AlertTriangle, conflict: GitMerge, offline: CloudOff }[state]
  const tone = state === 'error' || state === 'conflict' ? 'text-danger' : state === 'pending' || state === 'offline' ? 'text-warning' : 'text-ink-3'
  const detail = state === 'local' ? 'Stockées sur cet appareil' : `Dernière synchro : ${formatSince(status?.lastSyncAt ?? null)}${status?.pendingCount ? ` · ${status.pendingCount} en attente` : ''}`
  return (
    <button type="button" onClick={onClick} title={detail} className={cn('flex items-center gap-2 rounded-md text-left', compact ? 'p-2' : 'w-full px-2 py-1.5 hover:bg-surface-2')}>
      <Icon size={15} aria-hidden className={cn(tone, running && 'animate-spin')} />
      {compact ? <span className="sr-only">{LABEL[state]}</span> : (
        <span className="min-w-0">
          <span className={cn('block text-[12px] font-medium', tone)}>{running ? 'Synchronisation…' : LABEL[state]}</span>
          <span className="block truncate text-[11px] text-ink-3">{detail}</span>
        </span>
      )}
    </button>
  )
}
