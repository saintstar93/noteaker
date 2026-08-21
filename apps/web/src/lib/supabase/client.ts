'use client';

import type { Database } from '@noteaker/db';
import { createBrowserClient } from '@supabase/ssr';
import { requirePublicEnv } from '@/lib/env';

/**
 * Client per i componenti CLIENT (quelli con 'use client').
 * Gira nel browser e usa la chiave anon: è pubblica di proposito, perché
 * a proteggere i dati ci pensa RLS dentro Postgres (docs/02 §9).
 */
export function createClient() {
  const env = requirePublicEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
