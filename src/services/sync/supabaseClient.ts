import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Seules l'URL du projet et la clé publique (« anon » / « publishable ») sont lues.
 * Ces deux valeurs sont conçues pour être visibles dans le navigateur : la protection des
 * données repose sur l'authentification et les politiques RLS. Aucune clé secrète ici.
 */
export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function isCloudConfigured(): boolean {
  return supabaseConfig() !== null
}

let client: Promise<SupabaseClient> | null = null

/** Le SDK n'est téléchargé que si la synchronisation est configurée : le mode local reste léger. */
export function getSupabase(): Promise<SupabaseClient> | null {
  const config = supabaseConfig()
  if (!config) return null
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    }),
  )
  return client
}
