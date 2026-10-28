import { useEffect } from 'react'
import { planReminders } from '@/domain/reminders'
import { isNativeApp } from '@/lib/native/platform'
import { replaceReminders } from '@/lib/native/notifications'
import { useLedger } from '../data/LedgerProvider'
import { useToday } from '../data/useToday'
import { useNativePref } from './nativePrefs'

/** Reprogramme les rappels à chaque changement des échéances (léger délai pour regrouper les écritures). */
export function useReminderSync(): void {
  const { transactions } = useLedger()
  const today = useToday()
  const enabled = useNativePref('reminders')
  const showAmounts = useNativePref('reminderAmounts')

  useEffect(() => {
    if (!isNativeApp() || !enabled) return
    const timer = window.setTimeout(() => {
      void replaceReminders(planReminders(transactions, today, 30, showAmounts)).catch(() => undefined)
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [transactions, today, enabled, showAmounts])
}
