/**
 * Token di cattura: generazione, impronta e confronto.
 *
 * Logica pura, senza database: sta qui perché la useranno sia l'app Next sia,
 * più avanti, le Edge Function in Deno. Usa la **Web Crypto API**, che esiste
 * identica in Node, nel browser e in Deno — quindi niente `require('crypto')`.
 */

const PREFISSO = 'ntk_';

/**
 * 32 byte casuali da un generatore crittografico.
 *
 * `Math.random()` NON va bene qui e non è un dettaglio da puristi: è
 * prevedibile a partire da poche estrazioni, e un token indovinabile è un
 * token inutile.
 */
export function generaToken(): string {
  const byte = new Uint8Array(32);
  globalThis.crypto.getRandomValues(byte);

  const esadecimale = Array.from(byte, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${PREFISSO}${esadecimale}`;
}

/**
 * L'impronta SHA-256, che è ciò che salviamo in database — mai il token.
 * Se il database finisse nelle mani sbagliate, dalle impronte non si
 * risale ai token: chi le ha non può usarle per catturare niente.
 */
export async function impronta(token: string): Promise<string> {
  const dati = new TextEncoder().encode(token);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', dati);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** I primi caratteri, per riconoscere un token nell'elenco senza rivelarlo. */
export function indizio(token: string): string {
  return `${token.slice(0, PREFISSO.length + 6)}…`;
}

/** Forma valida: prefisso + 64 caratteri esadecimali. */
export function sembraUnToken(valore: string): boolean {
  return new RegExp(`^${PREFISSO}[0-9a-f]{64}$`).test(valore);
}

/**
 * Estrae il token dall'intestazione `Authorization: Bearer <token>`.
 * Accetta anche il solo valore, perché lo Shortcut di iOS rende scomodo
 * aggiungere intestazioni: là il token viaggia in `X-Noteaker-Token`.
 */
export function leggiToken(headers: Headers): string | null {
  const authorization = headers.get('authorization');
  if (authorization?.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  const intestazioneDedicata = headers.get('x-noteaker-token');
  return intestazioneDedicata?.trim() || null;
}
