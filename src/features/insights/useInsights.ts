import { useMemo } from 'react'
import { budgetInsights, incompleteDataInsight, subscriptionsInsight, thresholdInsight, type Insight } from '@/domain/insights'
import { useLedger } from '../data/LedgerProvider'
import type { Financials } from '../data/useFinancials'

/** Constats déterministes, du plus urgent au plus informatif ; chacun porte ses justificatifs. */
export function useInsights(f: Financials): Insight[] {
  const { rules } = useLedger()
  return useMemo(() => {
    const list = [
      thresholdInsight(f.forecast, f.thresholdCents),
      incompleteDataInsight(f.forecast),
      ...budgetInsights(f.budget),
      subscriptionsInsight(rules),
    ].filter((i): i is Insight => i !== null)
    const rank = { action: 0, warning: 1, info: 2 }
    return list.sort((a, b) => rank[a.tone] - rank[b.tone])
  }, [f, rules])
}
