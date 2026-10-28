import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabaseClient'

/** Connexion par lien magique envoyé par e-mail : aucun mot de passe stocké ni saisi dans l'application. */
export async function sendMagicLink(email: string): Promise<{ ok: boolean; error: string | null }> {
  const client = await getSupabase()
  if (!client) return { ok: false, error: 'Synchronisation non configurée' }
  const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  return { ok: !error, error: error ? 'Envoi impossible. Vérifie l’adresse et réessaie.' : null }
}

export async function currentSession(): Promise<Session | null> {
  const client = await getSupabase()
  if (!client) return null
  const { data } = await client.auth.getSession()
  return data.session
}

export async function signOut(): Promise<void> {
  await (await getSupabase())?.auth.signOut()
}

export function onSessionChange(listener: (session: Session | null) => void): () => void {
  const pending = getSupabase()
  if (!pending) return () => undefined
  let unsubscribe = () => undefined as void
  let cancelled = false
  void pending.then((client) => {
    if (cancelled) return
    const { data } = client.auth.onAuthStateChange((_event, session) => listener(session))
    unsubscribe = () => data.subscription.unsubscribe()
  })
  return () => {
    cancelled = true
    unsubscribe()
  }
}
