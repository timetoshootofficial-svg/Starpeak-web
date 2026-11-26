import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env.js'

let client: SupabaseClient | null = null

/**
 * Server-side Supabase client using the service-role key. It bypasses Row
 * Level Security, so it must only ever run inside these serverless functions.
 */
export function db(): SupabaseClient {
  if (!client) {
    const e = env()
    client = createClient(e.supabaseUrl, e.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

/** Postgres unique-violation error code. */
export const UNIQUE_VIOLATION = '23505'
