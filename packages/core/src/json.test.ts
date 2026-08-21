import { describe, expect, it } from 'vitest';
import { blocchiSchema, jsonValueSchema } from './json';

describe('jsonValueSchema', () => {
  it('accetta i tipi primitivi e le strutture annidate', () => {
    const valore = { a: 1, b: 'due', c: true, d: null, e: [1, { f: [] }] };
    expect(jsonValueSchema.parse(valore)).toEqual(valore);
  });

  it('converte undefined in null invece di rifiutarlo', () => {
    expect(jsonValueSchema.parse(undefined)).toBeNull();
    expect(jsonValueSchema.parse({ larghezza: undefined })).toEqual({ larghezza: null });
  });

  it('accetta un blocco tabella di BlockNote', () => {
    // È la forma reale prodotta da BlockNote per una tabella appena inserita:
    // `columnWidths` è un array di `undefined` finché non ridimensioni le
    // colonne. Con lo schema precedente questo blocco veniva RIFIUTATO e la
    // nota non si salvava più, in silenzio.
    const tabella = {
      id: 'abc',
      type: 'table',
      props: { textColor: 'default' },
      content: {
        type: 'tableContent',
        columnWidths: [undefined, undefined, undefined],
        rows: [
          {
            cells: [{ type: 'tableCell', content: [], props: { colspan: 1, rowspan: 1 } }],
          },
        ],
      },
      children: [],
    };

    const risultato = blocchiSchema.parse([tabella]);
    expect(risultato).toHaveLength(1);
    expect((risultato[0] as Record<string, unknown>).type).toBe('table');
  });

  it('rifiuta quello che JSON non può contenere', () => {
    expect(() => jsonValueSchema.parse(() => 1)).toThrow();
    expect(() => jsonValueSchema.parse(new Date())).toThrow();
  });

  it('mette un tetto al numero di blocchi', () => {
    const troppi = Array.from({ length: 10_001 }, () => ({ type: 'paragraph' }));
    expect(() => blocchiSchema.parse(troppi)).toThrow();
  });
});
