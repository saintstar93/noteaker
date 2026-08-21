import type { BrowserContext } from '@playwright/test';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Crea un utente vero sullo stack locale e ne inietta i cookie di sessione nel
 * browser, così i test partono già dentro l'app senza passare dal magic link.
 *
 * Le chiavi qui sotto sono quelle dimostrative dello stack locale: pubbliche,
 * identiche per tutti, inutili fuori da localhost.
 */

export const URL_API = process.env.SUPABASE_API_URL ?? 'http://127.0.0.1:54321';
export const ANON =
  process.env.SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const SERVICE =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const admin = createClient(URL_API, SERVICE, { auth: { persistSession: false } });

export async function entraNellApp(context: BrowserContext) {
  const email = `e2e-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('utente non creato');

  const jar = new Map<string, string>();
  const supabase = createServerClient(URL_API, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (elenco) => {
        for (const { name, value } of elenco) jar.set(name, value);
      },
    },
  });
  await supabase.auth.signInWithPassword({ email, password: 'password123' });

  await context.addCookies(
    [...jar].map(([name, value]) => ({
      name,
      value,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    })),
  );

  return { userId: data.user.id, supabase };
}
