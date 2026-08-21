import { EmptyState } from '@/components/empty-state';
import { TitoloSchermata } from '@/components/ui';
import { getSpaces } from '@/lib/queries';
import { NuovoSpace } from './gestione-spaces';
import { SchedaSpace } from './scheda-space';

export const dynamic = 'force-dynamic';

export default async function SpacesPage() {
  const spaces = await getSpaces();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <TitoloSchermata sopra="Come è organizzato">Spaces</TitoloSchermata>

      <NuovoSpace />

      {spaces.length === 0 ? (
        <EmptyState
          title="Nessuno space"
          description="Uno space è una macro-area: Business, Fitness, Corsi. Dentro ci stanno cartelle annidate quanto vuoi — per esempio Corsi → Meta Ads → le note di ogni lezione."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <SchedaSpace key={space.id} space={space} />
          ))}
        </div>
      )}
    </div>
  );
}
