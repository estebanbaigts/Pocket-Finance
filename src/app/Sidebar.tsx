import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { transition } from '@/components/motion'
import { SyncIndicator } from '@/features/sync/SyncIndicator'
import { APP_NAME } from './config'
import { GROUP_LABEL, ROUTES, type RouteId } from './routes'

/** Navigation latérale compacte (Mac) : sections groupées, raccourcis affichés, état de synchronisation. */
export function Sidebar({ current, onNavigate, onAdd }: { current: RouteId; onNavigate: (id: RouteId) => void; onAdd: () => void }) {
  const groups = (['today', 'plan', 'review'] as const).map((group) => ({ group, routes: ROUTES.filter((r) => r.group === group) }))
  return (
    <aside className="fixed inset-y-0 left-0 flex w-[var(--sidebar-width)] flex-col border-r border-line bg-bg px-3 pb-3 pt-5" style={{ zIndex: 'var(--layer-nav)' }}>
      <div className="flex items-center gap-2 px-2 pb-5">
        <img src="/icon.svg" alt="" className="h-7 w-7 rounded-[8px]" />
        <span className="display text-[20px] text-ink">{APP_NAME}</span>
      </div>
      <button type="button" onClick={onAdd} className="mb-5 flex h-9 items-center gap-2 rounded-md bg-ink px-3 text-[13px] font-medium text-bg hover:opacity-90">
        <Plus size={16} aria-hidden /> Ajouter <kbd className="ml-auto rounded-sm bg-white/15 px-1.5 text-[11px] font-normal">N</kbd>
      </button>
      <nav aria-label="Sections" className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {groups.map(({ group, routes }) => (
          <div key={group}>
            <p className="eyebrow px-2 pb-1 !text-[11px]">{GROUP_LABEL[group]}</p>
            <ul className="flex flex-col">
              {routes.map((route) => {
                const active = route.id === current
                const index = ROUTES.indexOf(route)
                return (
                  <li key={route.id}>
                    <button type="button" onClick={() => onNavigate(route.id)} aria-current={active ? 'page' : undefined}
                      className={cn('group relative flex h-8 w-full items-center gap-2.5 rounded-md px-2 text-[13.5px] transition-colors', active ? 'font-medium text-ink' : 'text-ink-2 hover:text-ink')}>
                      {active && <motion.span layoutId="sidebar-active" transition={transition.spring} className="absolute inset-0 rounded-md bg-surface-2" />}
                      <route.icon size={16} aria-hidden className="relative" />
                      <span className="relative">{route.label}</span>
                      <kbd className="relative ml-auto text-[11px] text-ink-3 opacity-0 transition-opacity group-hover:opacity-100">{index === 9 ? 0 : index + 1}</kbd>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line pt-2">
        <SyncIndicator onClick={() => onNavigate('settings')} />
      </div>
    </aside>
  )
}
