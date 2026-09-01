import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client for the Apple Health sync API routes.
 * Uses the publishable (anon) key -- the `health_metrics` table has RLS
 * enabled with no permissive policies, so this key alone grants no direct
 * table access. The only entry points are the two security-definer RPC
 * functions (`health_metrics_upsert` / `health_metrics_read`), reachable
 * only after our own bearer-token check in the route handler passes.
 */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY are not configured for this deployment."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
