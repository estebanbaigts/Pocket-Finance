import { App } from '@capacitor/app'
import { Lock } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui'
import { verifyOwner } from '@/lib/native/biometric'
import { isNativeApp } from '@/lib/native/platform'
import { useNativePref } from './nativePrefs'

const RELOCK_AFTER_MS = 30_000

/** Verrou Face ID : à l'ouverture et au retour après 30 s en arrière-plan, si activé sur cet iPhone. */
export function AppLock({ children }: { children: ReactNode }) {
  const enabled = useNativePref('lock') && isNativeApp()
  const [locked, setLocked] = useState(enabled)
  const hiddenAt = useRef<number | null>(null)

  const unlock = useCallback(async () => {
    if (await verifyOwner()) setLocked(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const handle = App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) hiddenAt.current = Date.now()
      else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOCK_AFTER_MS) setLocked(true)
    })
    return () => void handle.then((h) => h.remove())
  }, [enabled])

  useEffect(() => {
    if (enabled && locked) void unlock()
  }, [enabled, locked, unlock])

  if (!enabled || !locked) return <>{children}</>
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-ink"><Lock size={24} aria-hidden /></span>
      <h1 className="display text-[26px] text-ink">Pocket est verrouillé</h1>
      <p className="text-[14px] text-ink-2">Tes données financières sont protégées par Face ID.</p>
      <Button variant="primary" size="lg" onClick={() => void unlock()}>Déverrouiller</Button>
    </div>
  )
}
