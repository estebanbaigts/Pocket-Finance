import { useRoute } from '@/app/useRoute'
import { useFinancials } from '../data/useFinancials'
import { useInsights } from '../insights/useInsights'
import { AlertsPanel } from './AlertsPanel'
import { BalanceHero } from './BalanceHero'
import { Greeting } from './Greeting'
import { CapacityPanel } from './CapacityPanel'
import { MonthPanel } from './MonthPanel'
import { UpcomingPanel } from './UpcomingPanel'

export default function OverviewPage() {
  const f = useFinancials()
  const insights = useInsights(f)
  const [, navigate] = useRoute()
  return (
    <>
      <Greeting f={f} />
      <div className="grid grid-cols-1 gap-4 min-[1100px]:grid-cols-[1.35fr_1fr]">
        <div className="flex min-w-0 flex-col gap-4">
          <BalanceHero f={f} />
          <CapacityPanel f={f} />
          <MonthPanel f={f} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <AlertsPanel insights={insights} duplicates={f.duplicates} />
          <UpcomingPanel today={f.today} onSeeAll={() => navigate('bills')} />
        </div>
      </div>
    </>
  )
}
