'use client';

import { Plus } from 'lucide-react';
import { useRef } from 'react';
import { Bottone, Campo, Tendina } from '@/components/ui';
import { creaTask } from '@/lib/actions';
import type { Goal, StatoTask } from '@/lib/types';

/**
 * Form di creazione. `action={...}` punta direttamente a una server action:
 * niente `onSubmit`, niente `fetch` scritto a mano, e funziona anche se il
 * JavaScript non è ancora stato caricato.
 */
export function NuovoTask({
  goals,
  stato = 'todo',
  goalId,
  compatto,
}: {
  goals: Goal[];
  stato?: StatoTask;
  goalId?: string | null;
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
      <input type="hidden" name="status" value={stato} />
      {goalId !== undefined ? <input type="hidden" name="goal_id" value={goalId ?? ''} /> : null}

      <Campo name="title" required placeholder="Cosa c'è da fare?" className="min-w-0 flex-1" />

      {!compatto ? (
        <>
          {goalId === undefined ? (
            <Tendina name="goal_id" defaultValue="" aria-label="Obiettivo collegato">
              <option value="">Senza obiettivo</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
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
