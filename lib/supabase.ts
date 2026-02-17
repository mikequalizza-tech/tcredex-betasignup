/**
 * Supabase Client Configuration
 *
 * Provides both client-side and server-side Supabase clients
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase client (uses anon key)
let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
}

// Server-side Supabase admin client (uses service role key)
let supabaseAdminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  // On the browser, never expose the service key; fall back to anon client to avoid runtime crashes.
  if (typeof window !== "undefined") {
    return getSupabase();
  }

  if (!supabaseAdminClient) {
    if (!supabaseServiceKey) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is required for admin operations",
      );
    }

    supabaseAdminClient = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }
  return supabaseAdminClient;
}

// Export the admin client directly for backward compatibility
export const supabaseAdmin = getSupabaseAdmin();

// Re-export for convenience
export { createClient };
