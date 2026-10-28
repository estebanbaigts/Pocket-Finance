import { Sheet } from '@/components/ui'
import { SyncIndicator } from '@/features/sync/SyncIndicator'
import { ROUTES, type RouteId } from './routes'

const PRIMARY: RouteId[] = ['overview', 'transactions', 'forecast']

/** Sections secondaires sur iPhone, en grille de grandes cibles tactiles. */
export function MoreSheet({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (id: RouteId) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Sections">
      <ul className="grid grid-cols-3 gap-2">
        {ROUTES.filter((r) => !PRIMARY.includes(r.id)).map((route) => (
          <li key={route.id}>
            <button type="button" onClick={() => { onNavigate(route.id); onClose() }} className="flex h-20 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-surface text-[12px] text-ink-2 active:bg-surface-2">
              <route.icon size={22} aria-hidden className="text-ink" />
              {route.short}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-lg border border-line"><SyncIndicator onClick={() => { onNavigate('settings'); onClose() }} /></div>
    </Sheet>
  )
}
