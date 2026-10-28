import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { routeById, type RouteId } from './routes'

const TABS: RouteId[] = ['overview', 'transactions', 'forecast']

/** Navigation inférieure (iPhone) : zones tactiles de 44 pt minimum, bouton d'ajout central, zone de sécurité. */
export function TabBar({ current, onNavigate, onAdd, onMore }: { current: RouteId; onNavigate: (id: RouteId) => void; onAdd: () => void; onMore: () => void }) {
  const inTabs = TABS.includes(current)
  const item = (id: RouteId) => {
    const route = routeById(id)
    const active = id === current
    return (
      <button key={id} type="button" onClick={() => onNavigate(id)} aria-current={active ? 'page' : undefined}
        className={cn('flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px]', active ? 'text-ink' : 'text-ink-3')}>
        <route.icon size={21} aria-hidden strokeWidth={active ? 2.2 : 1.8} />
        {route.short}
      </button>
    )
  }
  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 border-t border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl safe-bottom" style={{ zIndex: 'var(--layer-nav)' }}>
      <div className="mx-auto flex h-[var(--tabbar-height)] max-w-[560px] items-center px-2">
        {item('overview')}
        {item('transactions')}
        <div className="flex flex-1 justify-center">
          <button type="button" onClick={onAdd} aria-label="Ajouter une opération" className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-bg shadow-md active:scale-95 transition-transform">
            <Plus size={24} aria-hidden />
          </button>
        </div>
        {item('forecast')}
        <button type="button" onClick={onMore} aria-current={!inTabs ? 'page' : undefined} className={cn('flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px]', !inTabs ? 'text-ink' : 'text-ink-3')}>
          <MoreHorizontal size={21} aria-hidden />
          {inTabs ? 'Plus' : routeById(current).short}
        </button>
      </div>
    </nav>
  )
}
