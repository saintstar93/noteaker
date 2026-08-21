import { TitoloSchermata } from '@/components/ui';
import { getGoals, getTasks } from '@/lib/queries';
import { TaskWorkspace } from './task-workspace';

export const dynamic = 'force-dynamic';

export default async function TaskPage() {
  // Due query in parallelo: `Promise.all` invece di due `await` in fila,
  // altrimenti la seconda aspetta inutilmente la prima.
  const [tasks, goals] = await Promise.all([getTasks(), getGoals()]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <TitoloSchermata sopra="Cosa c'è da fare">Task</TitoloSchermata>
      <TaskWorkspace tasks={tasks} goals={goals} />
    </div>
  );
}
