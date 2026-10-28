import { NativeBiometric } from '@capgo/capacitor-native-biometric'
import { isNativeApp } from './platform'

/** Face ID / Touch ID disponible et configuré sur l'appareil. */
export async function biometricAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false
  try {
    return (await NativeBiometric.isAvailable()).isAvailable
  } catch {
    return false
  }
}

/** Demande Face ID (avec repli sur le code de l'appareil). Renvoie vrai si l'identité est confirmée. */
export async function verifyOwner(): Promise<boolean> {
  if (!(await biometricAvailable())) return false
  try {
    await NativeBiometric.verifyIdentity({ reason: 'Déverrouiller Pocket', title: 'Pocket', useFallback: true, fallbackTitle: 'Utiliser le code' })
    return true
  } catch {
    return false
  }
}
