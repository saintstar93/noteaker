'use client';

import { SPACE_COLORS } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { ChevronLeft, ChevronRight, Flag, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Bottone, Campo, Pannello, Tendina } from '@/components/ui';
import { aggiornaColonna, creaColonna, eliminaColonna, riordinaColonne } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import type { TaskColumn } from '@/lib/types';

/**
 * Le colonne della board le decide l'utente.
 *
 * Una colonna può essere marcata **finale** ("arrivare qui vuol dire aver
 * finito"): quando una task ci entra, il suo `status` diventa `done` grazie a
 * un trigger nel database. È così che Today continua a sapere cosa resta da
 * chiudere anche se hai chiamato la colonna "Consegnato" o "Spedito".
 */
export function GestioneColonne({ colonne }: { colonne: TaskColumn[] }) {
  const [errore, setErrore] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const scambia = async (indice: number, direzione: -1 | 1) => {
    const nuovo = [...colonne];
    const altro = indice + direzione;
    if (altro < 0 || altro >= nuovo.length) return;

    const a = nuovo[indice];
    const b = nuovo[altro];
    if (!a || !b) return;
    nuovo[indice] = b;
    nuovo[altro] = a;

    await riordinaColonne(nuovo.map((c) => c.id));
    router.refresh();
  };

  return (
    <Pannello className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {colonne.map((colonna, indice) => (
          <li key={colonna.id} className="flex flex-wrap items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'size-2.5 shrink-0 rounded-full',
                SPACE_BG[(colonna.color ?? 'blue') as keyof typeof SPACE_BG],
              )}
            />

            <Campo
              defaultValue={colonna.name}
              aria-label={`Nome della colonna ${colonna.name}`}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== colonna.name) {
                  aggiornaColonna(colonna.id, { name: e.target.value }).then(() =>
                    router.refresh(),
                  );
                }
              }}
              className="min-w-32 flex-1"
            />

            <Tendina
              defaultValue={colonna.color ?? 'blue'}
              aria-label={`Colore della colonna ${colonna.name}`}
              onChange={(e) =>
                aggiornaColonna(colonna.id, { color: e.target.value }).then(() => router.refresh())
              }
            >
              {SPACE_COLORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Tendina>

            <Bottone
              variante={colonna.is_done ? 'primario' : 'fantasma'}
              onClick={() =>
                aggiornaColonna(colonna.id, { is_done: !colonna.is_done }).then(() =>
                  router.refresh(),
                )
              }
              aria-pressed={colonna.is_done}
              title="Arrivare in questa colonna vuol dire aver finito"
            >
              <Flag aria-hidden size={13} /> Finale
            </Bottone>

            <div className="flex items-center">
              <Bottone
                variante="fantasma"
                onClick={() => scambia(indice, -1)}
                disabled={indice === 0}
                aria-label={`Sposta "${colonna.name}" a sinistra`}
              >
                <ChevronLeft aria-hidden size={14} />
              </Bottone>
              <Bottone
                variante="fantasma"
                onClick={() => scambia(indice, 1)}
                disabled={indice === colonne.length - 1}
                aria-label={`Sposta "${colonna.name}" a destra`}
              >
                <ChevronRight aria-hidden size={14} />
              </Bottone>
            </div>

            <Bottone
              variante="pericolo"
              onClick={async () => {
                setErrore(null);
                try {
                  await eliminaColonna(colonna.id);
                  router.refresh();
                } catch (e) {
                  setErrore(e instanceof Error ? e.message : 'Eliminazione fallita.');
                }
              }}
              aria-label={`Elimina la colonna "${colonna.name}"`}
            >
              <Trash2 aria-hidden size={13} />
            </Bottone>
          </li>
        ))}
      </ul>

      {errore ? (
        <p role="status" className="text-[13px] text-danger">
          {errore}
        </p>
      ) : null}

      <p className="text-[12px] text-fg-subtle">
        Le task di una colonna eliminata non spariscono: si spostano nella prima colonna rimasta.
        «Finale» significa che arrivare lì conta come fatto — è quello che legge la schermata Today.
      </p>

      <form
        ref={form}
        action={async (formData) => {
          await creaColonna(formData);
          form.current?.reset();
          router.refresh();
        }}
        className="flex flex-wrap items-center gap-2 border-border border-t pt-4"
      >
        <Campo name="name" required placeholder="Nuova colonna" className="min-w-32 flex-1" />
        <Tendina name="color" defaultValue="purple" aria-label="Colore della nuova colonna">
          {SPACE_COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Tendina>
        <label className="flex min-h-9 items-center gap-2 rounded-sm bg-surface-3 px-3 text-[13px]">
          <input type="checkbox" name="is_done" className="accent-yellow" />
          Finale
        </label>
        <Bottone type="submit" variante="primario">
          <Plus aria-hidden size={14} /> Aggiungi
        </Bottone>
      </form>
    </Pannello>
  );
}
