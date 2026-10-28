import { useEffect, useState } from 'react'
import { PageSkeleton, ToastProvider } from '@/components/ui'
import { MotionProvider } from '@/components/motion'
import { LedgerProvider, useLedger } from '@/features/data/LedgerProvider'
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow'
import { SyncProvider } from '@/features/sync/SyncProvider'
import { bootstrap, watchForeground } from './bootstrap'
import { Shell } from './Shell'
import { StartupError } from './StartupError'

function Gate() {
  const { settings } = useLedger()
  if (!settings) return <PageSkeleton />
  return settings.onboardingDone ? <Shell /> : <OnboardingFlow />
}

export function App() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    bootstrap().then(() => setState('ready'), () => setState('error'))
    return watchForeground()
  }, [])

  if (state === 'error') return <StartupError />
  return (
    <MotionProvider>
      <ToastProvider>
        {state === 'loading' ? <div className="mx-auto max-w-[720px] p-6"><PageSkeleton /></div> : (
          <LedgerProvider fallback={<div className="mx-auto max-w-[720px] p-6"><PageSkeleton /></div>}>
            <SyncProvider>
              <Gate />
            </SyncProvider>
          </LedgerProvider>
        )}
      </ToastProvider>
    </MotionProvider>
  )
}
