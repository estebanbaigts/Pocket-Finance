import { formatDateFr } from '@/domain/dates'
import { PageHeader } from '@/components/ui'
import { useRoute } from '@/app/useRoute'
import { useFinancials } from '../data/useFinancials'
import { useInsights } from '../insights/useInsights'
import { AlertsPanel } from './AlertsPanel'
import { BalanceHero } from './BalanceHero'
import { CapacityPanel } from './CapacityPanel'
import { MonthPanel } from './MonthPanel'
import { UpcomingPanel } from './UpcomingPanel'

export default function OverviewPage() {
  const f = useFinancials()
  const insights = useInsights(f)
  const [, navigate] = useRoute()
  const date = formatDateFr(f.today, 'long')
  return (
    <>
      <PageHeader eyebrow={date.charAt(0).toUpperCase() + date.slice(1)} title="Vue d’ensemble" />
      <div className="grid gap-4 min-[1100px]:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <BalanceHero f={f} />
          <CapacityPanel f={f} />
          <MonthPanel f={f} />
        </div>
        <div className="flex flex-col gap-4">
          <AlertsPanel insights={insights} duplicates={f.duplicates} />
          <UpcomingPanel today={f.today} onSeeAll={() => navigate('bills')} />
        </div>
      </div>
    </>
  )
}
