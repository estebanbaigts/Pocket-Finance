import { MoreHorizontal, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { transition } from '@/components/motion'
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
        className={cn('relative flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors', active ? 'text-ink' : 'text-ink-3')}>
        {active && <motion.span layoutId="tab-active" transition={transition.spring} className="absolute top-0.5 h-1 w-6 rounded-full bg-ink" />}
        <motion.span animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }} transition={transition.spring}>
          <route.icon size={21} aria-hidden strokeWidth={active ? 2.2 : 1.8} />
        </motion.span>
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
          <motion.button type="button" onClick={onAdd} aria-label="Ajouter une opération" whileTap={{ scale: 0.88, rotate: 90 }} transition={transition.spring} className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-bg shadow-md">
            <Plus size={24} aria-hidden />
          </motion.button>
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
