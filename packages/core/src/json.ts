import { z } from 'zod';

/** Un valore JSON qualsiasi, annidato a profondità arbitraria. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

/**
 * Schema per validare JSON che arriva dal browser — nel nostro caso i blocchi
 * dell'editor. È un confine, e su un confine non ci si fida della forma
 * (docs/06-sicurezza.md §3.3).
 *
 * `z.lazy` permette allo schema di richiamare sé stesso: è l'unico modo di
 * descrivere una struttura annidata a profondità qualsiasi.
 *
 * `undefined` diventa `null`, e non è un dettaglio: BlockNote produce
 * `columnWidths: [undefined, undefined, undefined]` per una tabella a cui non
 * hai ancora toccato le larghezze. Rifiutare `undefined` significava rifiutare
 * ogni tabella — bug vero, trovato con un test in un browser vero.
 * Convertirlo in `null` è anche ciò che farebbe `JSON.stringify` da solo, e
 * quindi ciò che finirebbe comunque dentro una colonna `jsonb`.
 */
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.undefined().transform(() => null),
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
) as z.ZodType<JsonValue>;

/** I blocchi di una nota: un array di oggetti JSON, con un tetto di sicurezza. */
export const blocchiSchema = z.array(jsonValueSchema).max(10_000);
