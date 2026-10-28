import { Haptics, NotificationType } from '@capacitor/haptics'
import { isNativeApp } from './platform'

/** Retour haptique discret après un enregistrement réussi ou une erreur (iPhone uniquement). */
export function hapticFeedback(kind: 'success' | 'error'): void {
  if (!isNativeApp()) return
  void Haptics.notification({ type: kind === 'success' ? NotificationType.Success : NotificationType.Error }).catch(() => undefined)
}
