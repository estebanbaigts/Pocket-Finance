import { App } from '@capacitor/app'
import { getSupabase } from '@/services/sync/supabaseClient'
import { isNativeApp } from './platform'

/** Adresse de retour du lien de connexion dans l'app iOS (déclarée dans Info.plist et dans Supabase). */
export const NATIVE_AUTH_REDIRECT = 'com.estebanbaigts.pocket://login'

/**
 * Dans l'app iOS, le lien de l'e-mail passe par Safari puis rouvre l'app avec `?code=…`.
 * On échange ce code contre une session (flux PKCE : le secret associé est resté dans l'app).
 */
export function listenForAuthRedirect(onError: () => void): () => void {
  if (!isNativeApp()) return () => undefined
  const pending = App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(NATIVE_AUTH_REDIRECT)) return
    const code = new URL(url.replace(/^com\.estebanbaigts\.pocket:\/\//, 'https://app/')).searchParams.get('code')
    const client = await getSupabase()
    if (!code || !client) return onError()
    const { error } = await client.auth.exchangeCodeForSession(code)
    if (error) onError()
  })
  return () => void pending.then((handle) => handle.remove())
}
