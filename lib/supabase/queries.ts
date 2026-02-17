/**
 * Supabase query compatibility barrel.
 *
 * Keep existing imports like:
 * `import { fetchDealById } from '@/lib/supabase/queries'`
 * while implementation lives in domain modules.
 */

export * from "./deals";
export * from "./cdes";
export * from "./investors";
