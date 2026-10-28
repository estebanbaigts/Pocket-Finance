import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Coque iOS native autour de l'application web (même code, mêmes tests).
 * Les fichiers sont servis localement par l'app (capacitor://localhost) : aucun serveur nécessaire,
 * tout fonctionne hors ligne. Seule la synchronisation (facultative) contacte Supabase.
 */
const config: CapacitorConfig = {
  appId: 'com.estebanbaigts.pocket',
  appName: 'Pocket',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#f6f3ec',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    LocalNotifications: { iconColor: '#1f4d3a' },
  },
}

export default config
