import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * L'accesso rapido è comodo in locale e sarebbe un buco in produzione:
 * un endpoint pubblico che tenta un login con credenziali note.
 *
 * Questi controlli guardano il SORGENTE, non il comportamento a runtime,
 * perché il punto è proprio che quel codice non deve poter girare altrove.
 * Se qualcuno un giorno togliesse la guardia, questo test diventa rosso.
 */

const azioni = readFileSync(
  new URL('../apps/web/src/app/login/actions.ts', import.meta.url),
  'utf8',
);
const env = readFileSync(new URL('../apps/web/src/lib/env.ts', import.meta.url), 'utf8');

describe('accesso rapido di sviluppo', () => {
  it('è protetto da una guardia sullo stack locale', () => {
    const funzione = azioni.slice(azioni.indexOf('export async function entraComeSviluppo'));
    expect(funzione).toContain('if (!isSupabaseLocale)');
    // La guardia deve venire PRIMA di qualunque tentativo di login
    expect(funzione.indexOf('isSupabaseLocale')).toBeLessThan(
      funzione.indexOf('signInWithPassword'),
    );
  });

  it("riconosce il locale dall'indirizzo di Supabase, non da NODE_ENV", () => {
    // NODE_ENV dice come è stata compilata l'app, non a quale database parla.
    expect(env).toContain('127.0.0.1');
    expect(env).toContain('localhost');
    const definizione = env.slice(env.indexOf('export const isSupabaseLocale'));
    expect(definizione.slice(0, 200)).not.toContain('NODE_ENV');
  });

  it('le credenziali di sviluppo non finiscono in una variabile pubblica', () => {
    // Se fossero in una NEXT_PUBLIC_*, sarebbero nel bundle del browser.
    expect(env).not.toMatch(/NEXT_PUBLIC_[A-Z_]*PASSWORD/);
  });
});
