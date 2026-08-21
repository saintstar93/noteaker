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
