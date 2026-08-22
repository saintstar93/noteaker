import { TitoloSchermata } from '@/components/ui';
import {
  getPomodoriDiOggi,
  getPomodoroSettings,
  getProjects,
  getTaskColumns,
  getTasks,
} from '@/lib/queries';
import { TaskWorkspace } from './task-workspace';

export const dynamic = 'force-dynamic';

export default async function TaskPage() {
  // Tutte in parallelo: `Promise.all` invece di await in fila, altrimenti
  // ognuna aspetta inutilmente la precedente.
  const [tasks, progetti, colonne, pomodoro, pomodoriDiOggi] = await Promise.all([
    getTasks(),
    getProjects(),
    getTaskColumns(),
    getPomodoroSettings(),
    getPomodoriDiOggi(),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <TitoloSchermata sopra="Cosa c'è da fare">Task</TitoloSchermata>
      <TaskWorkspace
        tasks={tasks}
        progetti={progetti}
        colonne={colonne}
        pomodoro={pomodoro}
        pomodoriDiOggi={pomodoriDiOggi}
      />
    </div>
  );
}
