import { notFound } from 'next/navigation';
import { EmptyState } from '@/components/empty-state';
import { Etichetta, TitoloSchermata } from '@/components/ui';
import { getCollection, getCollections, getItemsInCollectionTree, getSpace } from '@/lib/queries';
import { AlberoCartelle, NuovaNota, RigaItem } from './albero-cartelle';

export const dynamic = 'force-dynamic';

/**
 * In Next 16 `params` e `searchParams` sono PROMESSE: la pagina può iniziare a
 * renderizzare prima che l'URL sia stato analizzato del tutto. Da qui l'`await`.
 */
export default async function SpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { id } = await params;
  const { c } = await searchParams;

  const space = await getSpace(id);
  if (!space) notFound();

  const collections = await getCollections(id);
  const selezionata = c ? await getCollection(c) : null;
  const items = selezionata ? await getItemsInCollectionTree(selezionata) : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <TitoloSchermata sopra="Space">{space.name}</TitoloSchermata>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <AlberoCartelle
          spaceId={id}
          collections={collections}
          selezionata={selezionata?.id ?? null}
        />

        <section className="flex min-w-0 flex-col gap-4">
          {selezionata ? (
            <>
              <div className="flex flex-col gap-1">
                <Etichetta>{selezionata.path.replace(/\//g, ' / ')}</Etichetta>
                <h2 className="font-bold text-[22px]">{selezionata.name}</h2>
              </div>

              <NuovaNota collectionId={selezionata.id} />

              {items.length === 0 ? (
                <EmptyState
                  title="Cartella vuota"
                  description="Crea la prima nota qui sopra. Quello che sta nelle sottocartelle compare comunque in questa lista."
                />
              ) : (
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <RigaItem item={item} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <EmptyState
              title="Scegli una cartella"
              description="Le cartelle si annidano: Corsi → Meta Ads → Lezione 3. Aprendone una vedi anche tutto quello che sta nelle sue sottocartelle."
            />
          )}
        </section>
      </div>
    </div>
  );
}
