import 'server-only';

import type { Database } from '@noteaker/db';
import { createClient } from '@supabase/supabase-js';
import { requirePublicEnv } from '@/lib/env';

/**
 * ⚠️ CLIENT AMMINISTRATIVO — usa la chiave `service_role`, che **salta RLS**.
 *
 * `import 'server-only'` in cima non è decorativo: fa fallire la BUILD se
 * qualcuno importa questo file da un componente client. Senza, un import
 * distratto spedirebbe la chiave onnipotente dentro il JavaScript del browser
 * (docs/06-sicurezza.md §3.1).
 *
 * Va usato in un posto solo: `POST /api/capture`, che non ha una sessione
 * perché lo chiamano l'estensione, lo Shortcut e il bot. Lì il `user_id` non
 * arriva da `auth.uid()` — lo si ricava dal token e lo si scrive a mano.
 * È l'unico punto dell'app in cui la sicurezza NON è garantita dal database:
 * è garantita da questo codice. Per questo è coperto da test.
 */
export function createAdminClient() {
  const env = requirePublicEnv();
  const chiave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!chiave) {
    throw new Error(
      'Manca SUPABASE_SERVICE_ROLE_KEY. Va in apps/web/.env.local, senza prefisso NEXT_PUBLIC_.',
    );
  }

  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, chiave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
