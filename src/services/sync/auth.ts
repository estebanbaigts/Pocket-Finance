import type { Session } from '@supabase/supabase-js'
import { getSupabase } from './supabaseClient'

/**
 * Envoie un lien de connexion par e-mail. Aucun mot de passe. `redirectTo` doit figurer dans la
 * liste des redirections autorisées du projet Supabase (supabase/config.toml).
 */
export async function sendLoginEmail(email: string, redirectTo?: string): Promise<{ ok: boolean; error: string | null }> {
  const client = await getSupabase()
  if (!client) return { ok: false, error: 'Synchronisation non configurée' }
  const { error } = await client.auth.signInWithOtp({ email, options: redirectTo ? { emailRedirectTo: redirectTo } : undefined })
  return { ok: !error, error: error ? 'Envoi impossible. Vérifie l’adresse ou réessaie dans une minute.' : null }
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
