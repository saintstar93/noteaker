'use client';

import { SPACE_COLORS, WEEKDAY_LABEL, WEEKDAYS } from '@noteaker/core';
import { Plus } from 'lucide-react';
import { useRef } from 'react';
import { Bottone, Campo, Etichetta, Pannello, Tendina } from '@/components/ui';
import { creaHabit } from '@/lib/actions';
import type { Goal } from '@/lib/types';

export function NuovaAbitudine({ goals }: { goals: Goal[] }) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <Pannello>
      <form
        ref={form}
        action={async (formData) => {
          await creaHabit(formData);
          form.current?.reset();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Campo name="title" required placeholder="Nuova abitudine" className="min-w-0 flex-1" />

          <Tendina name="color" defaultValue="green" aria-label="Colore">
            {SPACE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Tendina>

          <Tendina name="goal_id" defaultValue="" aria-label="Obiettivo collegato">
            <option value="">Senza obiettivo</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </Tendina>

          <Bottone type="submit" variante="primario">
            <Plus aria-hidden size={14} /> Crea
          </Bottone>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Giorni della settimana</legend>
          <Etichetta>In quali giorni — nessuno selezionato = ogni giorno</Etichetta>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((giorno) => (
              <label
                key={giorno}
                className="flex min-h-9 cursor-pointer items-center gap-2 rounded-sm bg-surface-3 px-3 text-[13px] has-checked:bg-yellow has-checked:text-on-accent"
              >
                <input type="checkbox" name="byday" value={giorno} className="sr-only" />
                {WEEKDAY_LABEL[giorno]}
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Pannello>
  );
}
