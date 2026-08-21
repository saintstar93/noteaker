'use server';

import type { Route } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

/**
 * SERVER ACTION: una funzione che il browser può invocare come se fosse
 * locale, ma che ESEGUE SUL SERVER. Next genera l'endpoint HTTP da solo.
 * Vantaggio qui: la chiamata a Supabase e i cookie di sessione non passano
 * mai per il codice del browser.
 */

export type LoginState = { ok: boolean; message: string } | null;

const emailSchema = z.email({ message: 'Indirizzo email non valido.' });

async function siteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export async function signInWithMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase non è ancora configurato: manca .env.local.' };
  }

  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Email non valida.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${await siteUrl()}/auth/callback` },
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Ti ho mandato il link. Aprilo da questo dispositivo.' };
}

export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${await siteUrl()}/auth/callback` },
  });

  if (error || !data.url) return;

  // `typedRoutes` tipizza redirect() sulle rotte INTERNE dell'app; qui l'URL
  // è quello di Google, quindi il cast è corretto e non nasconde un errore.
  redirect(data.url as Route);
}
