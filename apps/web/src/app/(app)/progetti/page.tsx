import { EmptyState } from '@/components/empty-state';
import { TitoloSchermata } from '@/components/ui';
import { getGoals, getProjects, getSpaces, getTasks } from '@/lib/queries';
import { NuovoProgetto, SchedaProgetto } from './gestione-progetti';

export const dynamic = 'force-dynamic';

export default async function ProgettiPage() {
  const [progetti, goals, spaces, tasks] = await Promise.all([
    getProjects(),
    getGoals(),
    getSpaces(),
    getTasks(),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <TitoloSchermata sopra="Su cosa stai lavorando">Progetti</TitoloSchermata>

      <p className="max-w-[68ch] text-[13px] text-fg-muted">
        Un progetto è un corpo di lavoro con un inizio e una fine — diverso da un obiettivo, che è
        trimestrale e misurabile. La catena è <strong>Obiettivo → Progetto → Task</strong>, e
        entrambi i collegamenti sono facoltativi: una task può stare benissimo per conto suo.
      </p>

      <NuovoProgetto goals={goals} spaces={spaces} />

      {progetti.length === 0 ? (
        <EmptyState
          title="Nessun progetto"
          description="Creane uno qui sopra: le task potranno essere raggruppate per progetto, sia in lista sia nella board."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {progetti.map((progetto) => {
            const sue = tasks.filter((t) => t.project_id === progetto.id);
            return (
              <SchedaProgetto
                key={progetto.id}
                progetto={progetto}
                goal={goals.find((g) => g.id === progetto.goal_id)}
                taskTotali={sue.length}
                taskFatte={sue.filter((t) => t.status === 'done').length}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
