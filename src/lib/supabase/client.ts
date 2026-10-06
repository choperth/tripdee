import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let clientInstance: SupabaseClient<Database> | null = null;

/**
 * Get or create the Supabase client instance.
 * Safe for both browser and server environments.
 * Returns null if Supabase environment variables are missing.
 */
export function getSupabase(): SupabaseClient<Database> | null {
  const isServer = typeof window === 'undefined';
  const effectiveKey = (isServer && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : supabaseKey;

  if (!supabaseUrl || !effectiveKey) {
    if (!isServer) {
      console.warn(
        '[TripDee] Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.'
      );
    }
    return null;
  }

  if (!clientInstance) {
    clientInstance = createClient<Database>(supabaseUrl, effectiveKey, {
      auth: {
        persistSession: !isServer,
        autoRefreshToken: !isServer,
      },
    });
  }

  return clientInstance;
}

/**
 * Export default supabase client (or null if unconfigured)
 */
export const supabase = getSupabase();
