'use client';

import { cn } from '@noteaker/ui/cn';
import { Globe, Puzzle, Send, Smartphone, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bottone, Tendina } from '@/components/ui';
import { eliminaItem, spostaItem } from '@/lib/actions';
import { KIND_LABEL } from '@/lib/colors';
import type { ItemRow } from '@/lib/types';

/**
 * Lo smistamento dell'Inbox.
 *
 * Il principio (CLAUDE.md §5.2): al momento della cattura non si decide niente,
 * tutto atterra qui. La decisione si prende dopo, in blocco, scegliendo una
 * destinazione dalla tendina. Dalla Fase 3 la destinazione arriverà già
 * proposta dall'AI e questo diventerà un tasto di conferma.
 *
 * L'item sparisce dalla lista appena lo smisti, senza aspettare il server:
 * altrimenti smistare venti cose di fila sarebbe un'attesa continua.
 */

type Destinazione = {
  id: string;
  name: string;
  path: string;
  spaces: { name: string; color: string | null } | null;
};

const ICONA_FONTE = {
  app: Globe,
  extension: Puzzle,
  ios_shortcut: Smartphone,
  telegram: Send,
} as const;

export function Smistamento({
  items,
  destinazioni,
}: {
  items: ItemRow[];
  destinazioni: Destinazione[];
}) {
  const [locali, setLocali] = useState(items);
  useEffect(() => setLocali(items), [items]);

  // Le cartelle arrivano già ordinate per `path`, quindi raggrupparle per
  // Space non ne cambia l'ordine dentro al gruppo.
  const gruppi = new Map<string, Destinazione[]>();
  for (const destinazione of destinazioni) {
    const spazio = destinazione.spaces?.name ?? 'Senza space';
    gruppi.set(spazio, [...(gruppi.get(spazio) ?? []), destinazione]);
  }

  const rimuovi = (id: string) => setLocali((precedenti) => precedenti.filter((i) => i.id !== id));

  return (
    <ul className="flex flex-col gap-2">
      {locali.map((item) => {
        const Icona =
          item.captured_via && item.captured_via in ICONA_FONTE
            ? ICONA_FONTE[item.captured_via as keyof typeof ICONA_FONTE]
            : Globe;

        return (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-md bg-surface-2 p-4 lg:flex-row lg:items-center"
          >
            <Link href={`/note/${item.id}`} className="min-w-0 flex-1">
              <p className="truncate font-medium text-[15px]">{item.title ?? 'Senza titolo'}</p>
              <p className="flex items-center gap-2 text-[12px] text-fg-subtle">
                <Icona aria-hidden size={12} />
                <span>{KIND_LABEL[item.kind]}</span>
                {item.source_domain ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{item.source_domain}</span>
                  </>
                ) : null}
              </p>
            </Link>

            <div className="flex shrink-0 items-center gap-2">
              <Tendina
                defaultValue=""
                aria-label={`Sposta "${item.title ?? 'senza titolo'}" in una cartella`}
                onChange={(e) => {
                  const destinazione = e.target.value;
                  if (!destinazione) return;
                  rimuovi(item.id);
                  void spostaItem(item.id, destinazione);
                }}
              >
                <option value="">Sposta in…</option>
                {/*
                  Raggruppate per Space con <optgroup>: con venti cartelle un
                  elenco piatto diventa illeggibile, e il browser rende i gruppi
                  in modo nativo anche da tastiera e da screen reader.
                */}
                {[...gruppi.entries()].map(([spaceName, cartelle]) => (
                  <optgroup key={spaceName} label={spaceName}>
                    {cartelle.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.path.replace(/\//g, ' / ')}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Tendina>

              <Bottone
                variante="pericolo"
                onClick={() => {
                  rimuovi(item.id);
                  void eliminaItem(item.id);
                }}
                aria-label={`Elimina "${item.title ?? 'senza titolo'}"`}
              >
                <Trash2 aria-hidden size={14} />
              </Bottone>
            </div>
          </li>
        );
      })}

      {locali.length === 0 ? (
        <li className={cn('rounded-lg border border-border border-dashed p-8 text-center')}>
          <p className="font-semibold text-[17px]">Inbox pulita</p>
          <p className="mt-1 text-[13px] text-fg-muted">Non c'è più niente da smistare.</p>
        </li>
      ) : null}
    </ul>
  );
}
