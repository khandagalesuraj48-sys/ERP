import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when Supabase env vars are present. When false the app uses mock data. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Browser/anon Supabase client, or null if the project isn't configured yet.
 * The whole app runs on mock data until these env vars are set — nothing
 * breaks on a fresh clone or a free-tier project that hits its limits.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, { auth: { persistSession: true } })
  : null;
