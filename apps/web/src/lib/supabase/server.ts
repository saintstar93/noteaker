import type { Database } from '@noteaker/db';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requirePublicEnv } from '@/lib/env';

/**
 * Client per i componenti SERVER, le Route Handler e le Server Action.
 * Gira sui server di Vercel, legge la sessione dai cookie e la rinnova.
 * In Next 16 `cookies()` è asincrona, quindi questa funzione lo è a sua volta.
 */
export async function createClient() {
  const env = requirePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Da un Server Component non si possono scrivere cookie.
            // Non è un problema: il middleware ha già rinfrescato la sessione.
          }
        },
      },
    },
  );
}
