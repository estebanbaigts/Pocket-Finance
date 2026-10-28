import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabaseClient'

/** Connexion par lien magique envoyé par e-mail : aucun mot de passe stocké ni saisi dans l'application. */
export async function sendMagicLink(email: string): Promise<{ ok: boolean; error: string | null }> {
  const client = getSupabase()
  if (!client) return { ok: false, error: 'Synchronisation non configurée' }
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  return { ok: !error, error: error ? 'Envoi impossible. Vérifie l’adresse et réessaie.' : null }
}

export async function currentSession(): Promise<Session | null> {
  const client = getSupabase()
  if (!client) return null
  const { data } = await client.auth.getSession()
  return data.session
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut()
}

export function onSessionChange(listener: (session: Session | null) => void): () => void {
  const client = getSupabase()
  if (!client) return () => undefined
  const { data } = client.auth.onAuthStateChange((_event, session) => listener(session))
  return () => data.subscription.unsubscribe()
}
