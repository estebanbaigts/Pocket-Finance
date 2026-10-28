import { useSyncExternalStore } from 'react'
import { readPreference, writePreference } from '@/lib/preferences'

export type NativePref = 'lock' | 'reminders' | 'reminderAmounts'

const listeners = new Set<() => void>()

/** Préférences propres à cet iPhone (verrouillage, rappels) : jamais synchronisées. */
export function setNativePref(key: NativePref, value: boolean): void {
  writePreference(`native:${key}`, value ? 'on' : 'off')
  listeners.forEach((notify) => notify())
}

export function getNativePref(key: NativePref): boolean {
  return readPreference(`native:${key}`) === 'on'
}

export function useNativePref(key: NativePref): boolean {
  return useSyncExternalStore((notify) => {
    listeners.add(notify)
    return () => listeners.delete(notify)
  }, () => getNativePref(key), () => false)
}
