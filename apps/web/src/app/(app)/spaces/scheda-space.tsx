'use client';

import { SPACE_COLORS } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bottone, Campo, Tendina } from '@/components/ui';
import { eliminaSpace, rinominaSpace } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import type { SpaceRow } from '@/lib/types';

/**
 * La scheda di uno Space, con i suoi comandi.
 *
 * Tre stati: normale, in rinomina, in conferma di eliminazione.
 * L'eliminazione NON usa `window.confirm`: un secondo clic sullo stesso posto
 * è più veloce, funziona da tastiera e — soprattutto — permette di scrivere
 * *cosa* succede davvero, invece di un generico "sei sicuro?".
 */
export function SchedaSpace({ space }: { space: SpaceRow }) {
  const [modo, setModo] = useState<'normale' | 'rinomina' | 'conferma'>('normale');
  const [nome, setNome] = useState(space.name);
  const [coloreScelto, setColoreScelto] = useState(space.color ?? 'yellow');
  const router = useRouter();

  const colore = (space.color ?? 'yellow') as keyof typeof SPACE_BG;

  if (modo === 'rinomina') {
    return (
      <form
        action={async () => {
          await rinominaSpace(space.id, nome, coloreScelto);
          setModo('normale');
          router.refresh();
        }}
        className="flex min-h-32 flex-col justify-between gap-3 rounded-lg bg-surface-2 p-5"
      >
        <Campo
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
          aria-label="Nome dello space"
        />

        <div className="flex items-center gap-2">
          <Tendina
            value={coloreScelto}
            onChange={(e) => setColoreScelto(e.target.value)}
            aria-label="Colore"
            className="flex-1"
          >
            {SPACE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Tendina>
          <Bottone type="submit" variante="primario" aria-label="Salva">
            <Check aria-hidden size={14} />
          </Bottone>
          <Bottone
            type="button"
            onClick={() => {
              setNome(space.name);
              setModo('normale');
            }}
            aria-label="Annulla"
          >
            <X aria-hidden size={14} />
          </Bottone>
        </div>
      </form>
    );
  }

  if (modo === 'conferma') {
    return (
      <div className="flex min-h-32 flex-col justify-between gap-3 rounded-lg bg-surface-2 p-5">
        <div>
          <p className="font-semibold text-[15px]">Elimino «{space.name}»?</p>
          {/* Dire cosa succede vale più di un punto esclamativo. */}
          <p className="mt-1 text-[12px] text-fg-muted">
            Le sue cartelle spariscono. Le note che c'erano dentro <strong>non</strong> vengono
            cancellate: tornano in Inbox.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Bottone
            variante="pericolo"
            className="bg-danger text-on-accent"
            onClick={async () => {
              await eliminaSpace(space.id);
              router.refresh();
            }}
          >
            Sì, elimina
          </Bottone>
          <Bottone onClick={() => setModo('normale')}>Annulla</Bottone>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex min-h-32 flex-col justify-between rounded-lg p-5 text-on-accent',
        'transition-transform duration-[120ms] ease-out hover:scale-[1.01]',
        SPACE_BG[colore],
      )}
    >
      <Link href={`/spaces/${space.id}`} className="flex flex-1 flex-col justify-between">
        <p className="label opacity-70">Space</p>
        <p className="font-bold text-[22px] leading-tight">{space.name}</p>
      </Link>

      {/* I comandi compaiono al passaggio del mouse, ma restano raggiungibili
          da tastiera grazie a focus-visible. */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setModo('rinomina')}
          aria-label={`Rinomina "${space.name}"`}
          className="rounded-sm p-2 text-on-accent/70 hover:bg-black/10 hover:text-on-accent"
        >
          <Pencil aria-hidden size={14} />
        </button>
        <button
          type="button"
          onClick={() => setModo('conferma')}
          aria-label={`Elimina "${space.name}"`}
          className="rounded-sm p-2 text-on-accent/70 hover:bg-black/10 hover:text-on-accent"
        >
          <Trash2 aria-hidden size={14} />
        </button>
      </div>
    </div>
  );
}
