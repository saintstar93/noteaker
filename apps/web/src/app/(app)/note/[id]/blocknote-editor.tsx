'use client';

import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

import type { Block, PartialBlock } from '@blocknote/core';
import { it } from '@blocknote/core/locales';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { useEffect, useRef, useState } from 'react';
import { salvaNota } from '@/lib/actions';
import { createClient } from '@/lib/supabase/client';
import type { ItemRow } from '@/lib/types';

/**
 * L'editor a blocchi vero (BlockNote, sopra ProseMirror/Tiptap).
 *
 * Questo componente NON viene mai renderizzato sul server: lo carica
 * `editor-nota.tsx` con `dynamic(..., { ssr: false })`. Il motivo è che
 * ProseMirror ha bisogno del DOM del browser per costruirsi, e sul server il
 * DOM non esiste.
 *
 * Cosa arriva gratis con BlockNote, senza scrivere niente: menu `/` con tutti i
 * blocchi, trascinamento dei blocchi, **tabelle**, **blocchi di codice** con
 * evidenziazione della sintassi, **immagini** anche trascinandole dentro,
 * **autolink** (scrivi un indirizzo e diventa cliccabile), scorciatoie da
 * tastiera, e la traduzione italiana dell'interfaccia.
 */

const BUCKET = 'note-media';
/** Prefisso interno: non è un URL vero, lo risolve `resolveFileUrl` al volo. */
const PREFISSO = '/media/';

export function BlocknoteEditor({
  item,
  userId,
  onStatoSalvataggio,
}: {
  item: ItemRow;
  userId: string;
  onStatoSalvataggio: (stato: 'fermo' | 'salvo' | 'salvato') => void;
}) {
  const supabase = createClient();
  const [titolo, setTitolo] = useState(item.title ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useCreateBlockNote({
    // `body` è jsonb: se la nota è nuova (o arriva dalla vecchia textarea)
    // si parte dal testo piatto, così niente va perso.
    initialContent: contenutoIniziale(item),
    dictionary: it,
    tables: { splitCells: true, cellBackgroundColor: true, headers: true },

    /**
     * Caricamento dei file. Gira NEL BROWSER e parla direttamente con Supabase
     * Storage: non passa dal nostro server. È sicuro perché le policy sul
     * bucket accettano scritture solo dentro la cartella dell'utente che sta
     * caricando (migrazione 003).
     *
     * Restituiamo il PERCORSO, non un URL firmato: un URL firmato scade, e
     * salvato dentro la nota si romperebbe dopo un'ora. Il percorso è stabile
     * per sempre; l'URL si genera al momento di mostrare l'immagine.
     */
    uploadFile: async (file: File) => {
      const estensione = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
      const percorso = `${userId}/${item.id}/${crypto.randomUUID()}.${estensione}`;

      const { error } = await supabase.storage.from(BUCKET).upload(percorso, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw new Error(`Caricamento fallito: ${error.message}`);

      return `${PREFISSO}${percorso}`;
    },

    /** Da percorso salvato a URL firmato, valido un'ora, generato al volo. */
    resolveFileUrl: async (url: string) => {
      if (!url.startsWith(PREFISSO)) return url;
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(url.slice(PREFISSO.length), 3600);
      return data?.signedUrl ?? url;
    },
  });

  /**
   * Salvataggio con debounce: si aspetta che tu smetta di scrivere per 800 ms.
   * Senza, ogni tasto sarebbe una scrittura sul database.
   *
   * Si salvano DUE colonne, ed è una scelta importante (docs/01 §4):
   *  - `body`      jsonb — la struttura dei blocchi, verità per l'editor;
   *  - `body_text` testo — lo stesso contenuto appiattito, che è ciò su cui
   *                lavorano la ricerca full-text e, più avanti, gli embedding.
   */
  const salvaFraPoco = (nuovoTitolo: string, blocchi: Block[]) => {
    onStatoSalvataggio('salvo');
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      const testo = await editor.blocksToMarkdownLossy(blocchi);
      await salvaNota(item.id, nuovoTitolo, testo, blocchi);
      onStatoSalvataggio('salvato');
    }, 800);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div className="nota-editor flex flex-col gap-4">
      <input
        value={titolo}
        onChange={(e) => {
          setTitolo(e.target.value);
          salvaFraPoco(e.target.value, editor.document);
        }}
        aria-label="Titolo della nota"
        placeholder="Senza titolo"
        className="nota-titolo w-full bg-transparent font-display font-extrabold text-[32px] leading-tight tracking-[-0.02em] placeholder:text-fg-subtle"
      />

      <BlockNoteView
        editor={editor}
        onChange={() => salvaFraPoco(titolo, editor.document)}
        // I colori non sono scritti a mano: puntano ai nostri token, così
        // l'editor cambia insieme al resto dell'app (docs/03 §2).
        theme={{
          colors: {
            editor: { text: 'var(--color-fg)', background: 'var(--color-bg)' },
            menu: { text: 'var(--color-fg)', background: 'var(--color-surface-2)' },
            tooltip: { text: 'var(--color-fg)', background: 'var(--color-surface-3)' },
            hovered: { text: 'var(--color-fg)', background: 'var(--color-surface-3)' },
            selected: { text: 'var(--color-on-accent)', background: 'var(--color-yellow)' },
            disabled: { text: 'var(--color-fg-subtle)', background: 'var(--color-surface)' },
            border: 'var(--color-border)',
            sideMenu: 'var(--color-fg-subtle)',
          },
          borderRadius: 10,
          fontFamily: 'var(--font-sans)',
        }}
      />
    </div>
  );
}

/**
 * Da cosa parte l'editor.
 * Tre casi: la nota ha già dei blocchi; è vuota; oppure ha solo testo piatto,
 * scritto con l'editor provvisorio di prima — in quel caso lo si recupera
 * trasformandolo in paragrafi, invece di buttarlo.
 */
function contenutoIniziale(item: ItemRow): PartialBlock[] | undefined {
  if (Array.isArray(item.body) && item.body.length > 0) {
    return item.body as unknown as PartialBlock[];
  }

  if (item.body_text) {
    return item.body_text
      .split('\n')
      .map((riga) => ({ type: 'paragraph' as const, content: riga }));
  }

  return undefined;
}
