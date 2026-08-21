'use client';

import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AreaTesto } from '@/components/ui';
import { salvaNota } from '@/lib/actions';
import type { ItemRow } from '@/lib/types';

/**
 * Editor provvisorio: titolo + testo semplice.
 *
 * L'editor a blocchi vero (BlockNote, stile Notion, con `/` per i comandi e i
 * blocchi custom per video e highlight) è la Fase 2. Metterlo adesso
 * significherebbe rifare due volte la parte di salvataggio, perché BlockNote
 * scrive `body` in jsonb mentre qui scriviamo solo `body_text`. Il testo
 * scritto ora non va perso: `body_text` è la stessa colonna che userà la
 * ricerca.
 *
 * DEBOUNCE: non si salva a ogni tasto — si aspetta che tu smetta di scrivere
 * per 800 ms. Senza, ogni lettera sarebbe una scrittura sul database.
 */
/**
 * `tornaA` è tipizzata `Route` e non `string` perché `typedRoutes` controlla a
 * compilazione che ogni link punti a una rotta che esiste davvero. Qui l'URL è
 * costruito a runtime dalla cartella dell'item, quindi il controllo lo facciamo
 * a monte: chi chiama passa un percorso interno valido.
 */
export function EditorNota({ item, tornaA }: { item: ItemRow; tornaA: Route }) {
  const [titolo, setTitolo] = useState(item.title ?? '');
  const [testo, setTesto] = useState(item.body_text ?? '');
  const [stato, setStato] = useState<'fermo' | 'salvo' | 'salvato'>('fermo');
  const primoRender = useRef(true);

  useEffect(() => {
    if (primoRender.current) {
      primoRender.current = false;
      return;
    }

    setStato('salvo');
    const timer = setTimeout(async () => {
      await salvaNota(item.id, titolo, testo);
      setStato('salvato');
    }, 800);

    return () => clearTimeout(timer);
  }, [titolo, testo, item.id]);

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

      <input
        value={titolo}
        onChange={(e) => setTitolo(e.target.value)}
        aria-label="Titolo della nota"
        placeholder="Senza titolo"
        className="w-full bg-transparent font-display font-extrabold text-[32px] leading-tight tracking-[-0.02em] placeholder:text-fg-subtle"
      />

      {/*
        Larghezza massima 68 caratteri: oltre, l'occhio perde la riga
        successiva quando torna a capo (docs/03 §4).
      */}
      <AreaTesto
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        aria-label="Contenuto della nota"
        placeholder="Scrivi qui…"
        rows={22}
        className="bg-transparent p-0 text-[16px] leading-[1.7]"
      />
    </div>
  );
}
