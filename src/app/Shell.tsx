import { AnimatePresence, motion } from 'motion/react'
import { Suspense, useCallback, useState } from 'react'
import { PageSkeleton } from '@/components/ui'
import { page } from '@/components/motion'
import { useIsCompact } from '@/lib/useMediaQuery'
import { useReminderSync } from '@/features/native/useReminderSync'
import { QuickAddSheet } from '@/features/quickAdd/QuickAddSheet'
import { MoreSheet } from './MoreSheet'
import { routeById } from './routes'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { useRoute } from './useRoute'
import { useShortcuts } from './useShortcuts'

/** Une seule application : la mise en page s'adapte (barre latérale sur Mac, barre d'onglets sur iPhone). */
export function Shell() {
  const compact = useIsCompact()
  const [route, navigate] = useRoute()
  const [adding, setAdding] = useState(false)
  const [more, setMore] = useState(false)
  const openAdd = useCallback(() => setAdding(true), [])
  useShortcuts(openAdd, navigate)
  useReminderSync()
  const Page = routeById(route).page

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">Aller au contenu</a>
      {!compact && <Sidebar current={route} onNavigate={navigate} onAdd={openAdd} />}
      <main id="main" className={compact ? 'px-4 pb-[calc(var(--tabbar-height)+env(safe-area-inset-bottom)+24px)] pt-[max(env(safe-area-inset-top),16px)]' : 'pl-[var(--sidebar-width)]'}>
        <div className={compact ? '' : 'mx-auto max-w-[1080px] px-10 pb-16 pt-8'}>
          <Suspense fallback={<PageSkeleton />}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={route} variants={page} initial="hidden" animate="visible" exit="exit">
                <Page />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>
      {compact && <TabBar current={route} onNavigate={navigate} onAdd={openAdd} onMore={() => setMore(true)} />}
      {compact && <MoreSheet open={more} onClose={() => setMore(false)} onNavigate={navigate} />}
      <QuickAddSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}
