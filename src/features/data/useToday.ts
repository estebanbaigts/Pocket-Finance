import { useEffect, useState } from 'react'
import { todayIso } from '@/domain/dates'

/** Date du jour dans le fuseau de l'appareil, actualisée si l'application reste ouverte après minuit. */
export function useToday(): string {
  const [today, setToday] = useState(() => todayIso())
  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayIso()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return today
}
