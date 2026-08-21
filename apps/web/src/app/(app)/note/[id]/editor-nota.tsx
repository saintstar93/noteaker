'use client';

import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import type { Route } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import type { ItemRow } from '@/lib/types';

/**
 * Il guscio della pagina nota: intestazione, indicatore di salvataggio, e
 * l'editor caricato **solo nel browser**.
 *
 * `dynamic(..., { ssr: false })` dice a Next di non provare a renderizzare
 * BlockNote sul server. ProseMirror, che gli sta sotto, ha bisogno del DOM per
 * costruirsi, e sul server il DOM non esiste: senza questa riga la pagina
 * esploderebbe al primo caricamento. In cambio, l'editor arriva un istante
 * dopo il resto — da qui il segnaposto qui sotto.
 */
const Editor = dynamic(() => import('./blocknote-editor').then((m) => m.BlocknoteEditor), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-4" aria-hidden>
      <div className="h-10 w-2/3 animate-pulse rounded-sm bg-surface-2" />
      <div className="h-4 w-full animate-pulse rounded-sm bg-surface-2" />
      <div className="h-4 w-5/6 animate-pulse rounded-sm bg-surface-2" />
    </div>
  ),
});

export function EditorNota({
  item,
  userId,
  tornaA,
}: {
  item: ItemRow;
  userId: string;
  tornaA: Route;
}) {
  const [stato, setStato] = useState<'fermo' | 'salvo' | 'salvato'>('fermo');

  return (
    <div className="mx-auto flex w-full max-w-[68ch] flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          href={tornaA}
          className="inline-flex items-center gap-2 text-[13px] text-fg-muted hover:text-fg"
        >
          <ArrowLeft aria-hidden size={14} /> Indietro
        </Link>

        <span aria-live="polite" className="flex items-center gap-1.5 text-[12px] text-fg-subtle">
          {stato === 'salvo' ? (
            <>
              <Loader2 aria-hidden size={12} className="animate-spin" /> Salvo…
            </>
          ) : stato === 'salvato' ? (
            <>
              <Check aria-hidden size={12} /> Salvato
            </>
          ) : null}
        </span>
      </div>

      <Editor item={item} userId={userId} onStatoSalvataggio={setStato} />
    </div>
  );
}
