import { useEffect, useState } from 'react'
import { Panel, Toggle, useToast } from '@/components/ui'
import { biometricAvailable, verifyOwner } from '@/lib/native/biometric'
import { clearReminders, requestNotificationPermission } from '@/lib/native/notifications'
import { isNativeApp } from '@/lib/native/platform'
import { setNativePref, useNativePref } from '../native/nativePrefs'

/** Réglages propres à l'app iPhone : Face ID et rappels d'échéances. */
export function NativeSection() {
  const toast = useToast()
  const lock = useNativePref('lock')
  const reminders = useNativePref('reminders')
  const amounts = useNativePref('reminderAmounts')
  const [faceId, setFaceId] = useState(false)
  useEffect(() => void biometricAvailable().then(setFaceId), [])
  if (!isNativeApp()) return null

  const toggleLock = async (on: boolean) => {
    // Activer ou désactiver le verrou exige de prouver qu'on est bien le propriétaire.
    if (on && !(await biometricAvailable())) return toast({ title: 'Configure d’abord Face ID ou un code dans les Réglages de l’iPhone.', tone: 'error' })
    if (!(await verifyOwner())) return toast({ title: 'Identité non confirmée : réglage inchangé.', tone: 'error' })
    setNativePref('lock', on)
  }
  const toggleReminders = async (on: boolean) => {
    if (on && !(await requestNotificationPermission())) return toast({ title: 'Notifications refusées : autorise-les dans Réglages > Pocket.', tone: 'error' })
    if (!on) await clearReminders()
    setNativePref('reminders', on)
  }

  return (
    <Panel title="Sur cet iPhone">
      <div className="flex flex-col gap-3">
        <Toggle checked={lock && faceId} onChange={(v) => void toggleLock(v)} label="Verrouiller avec Face ID" description={faceId ? 'À l’ouverture et après 30 s en arrière-plan.' : 'Face ID ou code de l’appareil non configuré.'} />
        <Toggle checked={reminders} onChange={(v) => void toggleReminders(v)} label="Rappels d’échéances" description="La veille à 9 h, pour les factures et mensualités des 30 prochains jours." />
        {reminders && <Toggle checked={amounts} onChange={(v) => setNativePref('reminderAmounts', v)} label="Afficher les montants" description="Désactivé par défaut : les notifications sont visibles sur l’écran verrouillé." />}
      </div>
    </Panel>
  )
}
