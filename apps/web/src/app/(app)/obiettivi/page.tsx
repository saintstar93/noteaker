import { EmptyState } from '@/components/empty-state';
import { TitoloSchermata } from '@/components/ui';
import { getGoalsConKeyResults, getSpaces } from '@/lib/queries';
import { NuovoObiettivo, SchedaObiettivo } from './gestione-obiettivi';

export const dynamic = 'force-dynamic';

export default async function ObiettiviPage() {
  const [goals, spaces] = await Promise.all([getGoalsConKeyResults(), getSpaces()]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <TitoloSchermata sopra="Dove stai andando">Obiettivi</TitoloSchermata>

      <NuovoObiettivo spaces={spaces} />

      {goals.length === 0 ? (
        <EmptyState
          title="Nessun obiettivo"
          description="L'obiettivo sta in cima alla catena: da lui nascono le abitudini e le task. Senza, ogni giorno riparti dalla lista della spesa."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {goals.map((goal) => (
            <SchedaObiettivo key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
