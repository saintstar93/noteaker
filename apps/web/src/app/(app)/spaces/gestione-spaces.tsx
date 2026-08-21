'use client';

import { SPACE_COLORS } from '@noteaker/core';
import { Plus } from 'lucide-react';
import { useRef } from 'react';
import { Bottone, Campo, Pannello, Tendina } from '@/components/ui';
import { creaSpace } from '@/lib/actions';

export function NuovoSpace() {
  const form = useRef<HTMLFormElement>(null);

  return (
    <Pannello>
      <form
        ref={form}
        action={async (formData) => {
          await creaSpace(formData);
          form.current?.reset();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <Campo
          name="name"
          required
          placeholder="Nuovo space (Business, Fitness, Corsi…)"
          className="min-w-0 flex-1"
        />
        <Tendina name="color" defaultValue="yellow" aria-label="Colore">
          {SPACE_COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Tendina>
        <Bottone type="submit" variante="primario">
          <Plus aria-hidden size={14} /> Crea
        </Bottone>
      </form>
    </Pannello>
  );
}
