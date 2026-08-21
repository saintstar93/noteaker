import { cn } from '@noteaker/ui/cn';
import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { TitoloSchermata } from '@/components/ui';
import { SPACE_BG } from '@/lib/colors';
import { getSpaces } from '@/lib/queries';
import { NuovoSpace } from './gestione-spaces';

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
            <Link
              key={space.id}
              href={`/spaces/${space.id}`}
              className={cn(
                'flex min-h-32 flex-col justify-between rounded-lg p-5 text-on-accent',
                'transition-transform duration-[120ms] ease-out hover:scale-[1.01]',
                SPACE_BG[(space.color ?? 'yellow') as keyof typeof SPACE_BG],
              )}
            >
              <p className="label opacity-70">Space</p>
              <p className="font-bold text-[22px] leading-tight">{space.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
