import { LocalNotifications } from '@capacitor/local-notifications'
import type { Reminder } from '@/domain/reminders'
import { parseIsoDate } from '@/domain/dates'
import { isNativeApp } from './platform'

const HOUR = 9

/** Demande l'autorisation d'afficher des notifications (iOS l'affiche une seule fois). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false
  const status = await LocalNotifications.requestPermissions()
  return status.display === 'granted'
}

/** Remplace tous les rappels programmés par ceux fournis, à 9 h la veille ; ignore ceux déjà passés. */
export async function replaceReminders(reminders: readonly Reminder[]): Promise<number> {
  if (!isNativeApp()) return 0
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  const now = Date.now()
  const notifications = reminders
    .map((r) => {
      const { year, month, day } = parseIsoDate(r.notifyOn)
      return { id: r.id, title: r.title, body: r.body, schedule: { at: new Date(year, month - 1, day, HOUR, 0, 0), allowWhileIdle: true } }
    })
    .filter((n) => n.schedule.at.getTime() > now)
    .slice(0, 60) // iOS limite à 64 notifications programmées par application.
  if (notifications.length > 0) await LocalNotifications.schedule({ notifications })
  return notifications.length
}

/** Supprime tous les rappels programmés (désactivation). */
export async function clearReminders(): Promise<void> {
  if (!isNativeApp()) return
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
}
