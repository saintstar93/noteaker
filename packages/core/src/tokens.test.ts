import { describe, expect, it } from 'vitest';
import { generaToken, impronta, indizio, leggiToken, sembraUnToken } from './tokens';

describe('generaToken', () => {
  it('produce un token della forma attesa', () => {
    const token = generaToken();
    expect(token).toMatch(/^ntk_[0-9a-f]{64}$/);
    expect(sembraUnToken(token)).toBe(true);
  });

  it('non si ripete mai', () => {
    const insieme = new Set(Array.from({ length: 500 }, () => generaToken()));
    expect(insieme.size).toBe(500);
  });
});

describe('impronta', () => {
  it('è stabile: lo stesso token dà sempre la stessa impronta', async () => {
    const token = generaToken();
    expect(await impronta(token)).toBe(await impronta(token));
  });

  it('token diversi danno impronte diverse', async () => {
    expect(await impronta(generaToken())).not.toBe(await impronta(generaToken()));
  });

  it('è un SHA-256 in esadecimale', async () => {
    // Valore noto: SHA-256 di "abc". Se questo cambia, l'algoritmo è cambiato
    // e tutti i token esistenti smetterebbero di funzionare.
    expect(await impronta('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('dall’impronta non si intravede il token', async () => {
    const token = generaToken();
    const h = await impronta(token);
    expect(h).not.toContain(token.slice(4, 20));
  });
});

describe('indizio', () => {
  it('mostra solo l’inizio', () => {
    const token = 'ntk_0123456789abcdef';
    expect(indizio(token)).toBe('ntk_012345…');
    expect(indizio(token).length).toBeLessThan(token.length);
  });
});

describe('sembraUnToken', () => {
  it('rifiuta le forme sbagliate', () => {
    expect(sembraUnToken('')).toBe(false);
    expect(sembraUnToken('ntk_abc')).toBe(false);
    expect(sembraUnToken(`ntk_${'z'.repeat(64)}`)).toBe(false);
    expect(sembraUnToken('0'.repeat(64))).toBe(false);
  });
});

describe('leggiToken', () => {
  it('legge lo schema Bearer, anche con maiuscole diverse', () => {
    expect(leggiToken(new Headers({ authorization: 'Bearer ntk_abc' }))).toBe('ntk_abc');
    expect(leggiToken(new Headers({ authorization: 'bearer ntk_abc' }))).toBe('ntk_abc');
  });

  it('legge l’intestazione dedicata, per lo Shortcut di iOS', () => {
    expect(leggiToken(new Headers({ 'x-noteaker-token': 'ntk_abc' }))).toBe('ntk_abc');
  });

  it('restituisce null se non c’è niente di utile', () => {
    expect(leggiToken(new Headers())).toBeNull();
    expect(leggiToken(new Headers({ authorization: 'Basic pippo' }))).toBeNull();
  });
});
