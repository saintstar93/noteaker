'use client';

import { Plus } from 'lucide-react';
import { useRef } from 'react';
import { Bottone, Campo, Tendina } from '@/components/ui';
import { creaTask } from '@/lib/actions';
import type { Project, TaskColumn } from '@/lib/types';

/**
 * Form di creazione. `action={...}` punta direttamente a una server action:
 * niente `onSubmit`, niente `fetch` scritto a mano, e funziona anche se il
 * JavaScript non è ancora stato caricato.
 */
export function NuovoTask({
  progetti,
  colonna,
  projectId,
  compatto,
}: {
  progetti: Project[];
  colonna?: TaskColumn;
  projectId?: string | null;
  compatto?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      action={async (formData) => {
        await creaTask(formData);
        form.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      {colonna ? <input type="hidden" name="column_id" value={colonna.id} /> : null}
      {projectId !== undefined ? (
        <input type="hidden" name="project_id" value={projectId ?? ''} />
      ) : null}

      <Campo name="title" required placeholder="Cosa c'è da fare?" className="min-w-0 flex-1" />

      {!compatto ? (
        <>
          {projectId === undefined ? (
            <Tendina name="project_id" defaultValue="" aria-label="Progetto">
              <option value="">Senza progetto</option>
              {progetti.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Tendina>
          ) : null}

          <Tendina name="priority" defaultValue="2" aria-label="Priorità">
            <option value="1">Alta</option>
            <option value="2">Media</option>
            <option value="3">Bassa</option>
          </Tendina>

          <Campo
            type="date"
            name="scheduled_for"
            aria-label="Programma per il giorno"
            className="w-auto"
          />
        </>
      ) : null}

      <Bottone type="submit" variante="primario">
        <Plus aria-hidden size={14} /> Aggiungi
      </Bottone>
    </form>
  );
}
