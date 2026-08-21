'use client';

import { cn } from '@noteaker/ui/cn';
import { ChevronRight, FilePlus2, FolderPlus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Bottone, Campo, Etichetta } from '@/components/ui';
import { creaCollection, creaNota, eliminaCollection } from '@/lib/actions';
import type { CollectionRow, ItemRow } from '@/lib/types';

/**
 * L'albero delle cartelle. La profondità si legge dal `path`: 'corsi/meta/ads'
 * sta a livello 2 perché ha due slash. Non serve ricostruire la gerarchia in
 * JavaScript — il database la tiene già scritta, ordinata per `path`, ed è
 * esattamente il motivo per cui quella colonna esiste (docs/02 §3).
 */
export function AlberoCartelle({
  spaceId,
  collections,
  selezionata,
}: {
  spaceId: string;
  collections: CollectionRow[];
  selezionata: string | null;
}) {
  const [aggiungiA, setAggiungiA] = useState<string | null | undefined>(undefined);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const livello = (path: string) => path.split('/').length - 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Etichetta>Cartelle</Etichetta>
        <Bottone
          variante="fantasma"
          onClick={() => setAggiungiA((a) => (a === null ? undefined : null))}
          aria-label="Nuova cartella alla radice"
        >
          <FolderPlus aria-hidden size={14} />
        </Bottone>
      </div>

      {aggiungiA !== undefined ? (
        <form
          ref={form}
          action={async (formData) => {
            await creaCollection(formData);
            form.current?.reset();
            setAggiungiA(undefined);
            router.refresh();
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="space_id" value={spaceId} />
          <input type="hidden" name="parent_id" value={aggiungiA ?? ''} />
          <Campo name="name" required autoFocus placeholder="Nome della cartella" />
          <Bottone type="submit" variante="primario">
            Crea
          </Bottone>
        </form>
      ) : null}

      <ul className="flex flex-col gap-0.5">
        {collections.map((collection) => {
          const attiva = collection.id === selezionata;
          return (
            <li key={collection.id} style={{ paddingLeft: `${livello(collection.path) * 14}px` }}>
              <div
                className={cn(
                  'group flex items-center gap-1 rounded-sm pr-1',
                  attiva ? 'bg-surface-3' : 'hover:bg-surface-2',
                )}
              >
                <Link
                  href={`/spaces/${spaceId}?c=${collection.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-[13px]"
                >
                  <ChevronRight
                    aria-hidden
                    size={13}
                    className={cn('shrink-0', attiva ? 'text-fg' : 'text-fg-subtle')}
                  />
                  <span className="truncate">{collection.name}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setAggiungiA(collection.id)}
                  aria-label={`Nuova sottocartella dentro "${collection.name}"`}
                  className="rounded-sm p-1.5 text-fg-subtle opacity-0 hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <FolderPlus aria-hidden size={13} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await eliminaCollection(collection.id);
                    router.refresh();
                  }}
                  aria-label={`Elimina "${collection.name}"`}
                  className="rounded-sm p-1.5 text-fg-subtle opacity-0 hover:bg-danger hover:text-on-accent focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 aria-hidden size={13} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {collections.length === 0 ? (
        <p className="px-2 py-3 text-[13px] text-fg-subtle">
          Nessuna cartella. Creane una: dentro puoi annidarne altre.
        </p>
      ) : null}
    </div>
  );
}

/** Crea una nota dentro la cartella aperta e ci porta subito dentro. */
export function NuovaNota({ collectionId }: { collectionId: string | null }) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={form}
      action={async (formData) => {
        const id = await creaNota(formData);
        form.current?.reset();
        if (id) router.push(`/note/${id}`);
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="collection_id" value={collectionId ?? ''} />
      <Campo name="title" required placeholder="Titolo della nota" className="min-w-0 flex-1" />
      <Bottone type="submit" variante="primario">
        <FilePlus2 aria-hidden size={14} /> Nota
      </Bottone>
    </form>
  );
}

export function RigaItem({ item }: { item: ItemRow }) {
  return (
    <Link
      href={`/note/${item.id}`}
      className="flex min-h-14 items-center gap-3 rounded-md bg-surface-2 px-4 hover:bg-surface-3"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[15px]">{item.title ?? 'Senza titolo'}</p>
        <p className="truncate text-[12px] text-fg-subtle">
          {item.body_text?.slice(0, 90) || 'Vuota'}
        </p>
      </div>
    </Link>
  );
}
