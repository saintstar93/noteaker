import { z } from 'zod';

/**
 * Le variabili pubbliche vanno lette con il nome per intero
 * (`process.env.NEXT_PUBLIC_X`, mai `process.env[chiave]`): Next le sostituisce
 * a build time cercando la stringa letterale nel codice.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Fase 0: senza progetto Supabase l'app deve comunque partire e mostrare
 * qualcosa di sensato, non una schermata bianca. Chi ha bisogno del DB
 * controlla questo flag prima di creare un client.
 */
export const isSupabaseConfigured = parsed.success;

export const publicEnv: PublicEnv | null = parsed.success ? parsed.data : null;

export function requirePublicEnv(): PublicEnv {
  if (!publicEnv) {
    throw new Error(
      'Supabase non è configurato: copia .env.example in .env.local e riempi NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  return publicEnv;
}

/**
 * Siamo sullo stack Supabase LOCALE?
 *
 * Si guarda l'indirizzo di Supabase e non `NODE_ENV`: `NODE_ENV` dice come è
 * stata compilata l'app, non a quale database sta parlando. Un `pnpm build`
 * fatto sul portatile ma puntato al progetto cloud sarebbe "production" con
 * NODE_ENV e locale con questo controllo — ed è questo che conta.
 *
 * Serve a far esistere le scorciatoie di sviluppo (come l'accesso rapido nella
 * pagina di login) SOLO quando il database è quello finto sul Mac. In
 * produzione l'indirizzo è quello di Supabase cloud e la condizione è falsa,
 * quindi quel codice non viene nemmeno renderizzato.
 */
export const isSupabaseLocale =
  publicEnv?.NEXT_PUBLIC_SUPABASE_URL.includes('127.0.0.1') === true ||
  publicEnv?.NEXT_PUBLIC_SUPABASE_URL.includes('localhost') === true;

/** L'utente creato da `supabase/seed.sql`. Esiste solo in locale. */
export const UTENTE_DI_SVILUPPO = {
  email: 'daniele@noteaker.local',
  password: 'noteaker',
} as const;
