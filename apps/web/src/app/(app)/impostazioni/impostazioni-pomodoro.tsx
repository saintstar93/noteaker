'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bottone, Campo, Pannello } from '@/components/ui';
import { salvaImpostazioniPomodoro } from '@/lib/actions';
import type { PomodoroSettings } from '@/lib/types';

/**
 * Le impostazioni del pomodoro stanno in **database**, non in `localStorage`.
 * Motivo: devono valere anche sull'iPhone. Se le tenessimo nel browser
 * avresti due configurazioni diverse sui due dispositivi e non capiresti
 * perché il timer dura 25 minuti sul Mac e 30 sul telefono.
 */
export function ImpostazioniPomodoro({ impostazioni }: { impostazioni: PomodoroSettings }) {
  const [salvato, setSalvato] = useState(false);
  const router = useRouter();

  const campi = [
    {
      nome: 'work_minutes',
      etichetta: 'Concentrazione',
      valore: impostazioni.work_minutes,
      min: 1,
      max: 180,
    },
    {
      nome: 'short_break_minutes',
      etichetta: 'Pausa breve',
      valore: impostazioni.short_break_minutes,
      min: 1,
      max: 60,
    },
    {
      nome: 'long_break_minutes',
      etichetta: 'Pausa lunga',
      valore: impostazioni.long_break_minutes,
      min: 1,
      max: 120,
    },
    {
      nome: 'cycles_before_long',
      etichetta: 'Cicli prima della lunga',
      valore: impostazioni.cycles_before_long,
      min: 2,
      max: 12,
    },
  ] as const;

  return (
    <Pannello>
      <form
        action={async (formData) => {
          await salvaImpostazioniPomodoro(formData);
          setSalvato(true);
          router.refresh();
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {/*
            `htmlFor` + `id` espliciti invece di annidare il campo dentro
            l'etichetta: il collegamento è esplicito, e Biome non deve
            indovinare che <Campo> renderizza un <input>.
          */}
          {campi.map((campo) => (
            <div key={campo.nome} className="flex flex-col gap-1.5">
              <label htmlFor={campo.nome} className="label text-fg-subtle">
                {campo.etichetta}
              </label>
              <Campo
                id={campo.nome}
                type="number"
                name={campo.nome}
                defaultValue={campo.valore}
                min={campo.min}
                max={campo.max}
                onChange={() => setSalvato(false)}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex min-h-9 items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              name="auto_start_next"
              defaultChecked={impostazioni.auto_start_next}
              onChange={() => setSalvato(false)}
              className="accent-yellow"
            />
            Avvia da solo la fase successiva
          </label>

          <label className="flex min-h-9 items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              name="suono"
              defaultChecked={impostazioni.suono}
              onChange={() => setSalvato(false)}
              className="accent-yellow"
            />
            Suono a fine fase
          </label>

          <Bottone type="submit" variante="primario" className="ml-auto">
            {salvato ? <Check aria-hidden size={14} /> : null}
            {salvato ? 'Salvato' : 'Salva'}
          </Bottone>
        </div>

        <p className="text-[12px] text-fg-subtle">
          Valgono su tutti i dispositivi: stanno in database, non nel browser. Il timer invece è di
          questo dispositivo, e si basa sull'orario di fine — così sopravvive a schermo bloccato e
          ricaricamenti.
        </p>
      </form>
    </Pannello>
  );
}
