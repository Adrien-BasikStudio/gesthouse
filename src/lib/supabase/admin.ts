import { createClient } from '@supabase/supabase-js'

// Client admin avec service role key — bypass RLS
// À utiliser UNIQUEMENT côté serveur pour les opérations d'initialisation
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
