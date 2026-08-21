import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Da usare in cima a ogni pagina e a ogni server action che tocca dati.
 *
 * `getUser()` e non `getSession()`: il primo verifica il token col server di
 * Supabase, il secondo si fida del cookie. Il proxy fa già un controllo, ma
 * non ci si appoggia mai a una barriera sola (docs/06-sicurezza.md §3.7).
 * E comunque il muro portante resta RLS, dentro il database.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  return { user, supabase };
}
