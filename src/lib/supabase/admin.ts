import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for Supabase Auth admin operations (creating users on
 * behalf of the Super Admin). This key bypasses Row Level Security entirely,
 * so this file must never be imported from a Client Component - the
 * `server-only` import above turns that into a build error instead of a
 * runtime leak.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
