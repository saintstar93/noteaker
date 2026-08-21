'use client';

import { cn } from '@noteaker/ui/cn';
import { useEffect, useState } from 'react';
import { Etichetta } from '@/components/ui';
import { toggleTask } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import type { Goal, Task } from '@/lib/types';

const COLORE_PRIORITA: Record<number, keyof typeof SPACE_BG> = { 1: 'red', 2: 'yellow', 3: 'blue' };

/** Spuntare una task deve essere immediato: si aggiorna la copia locale e si manda la scrittura. */
export function TaskDiOggi({ tasks, goals }: { tasks: Task[]; goals: Goal[] }) {
  const [locali, setLocali] = useState(tasks);
  useEffect(() => setLocali(tasks), [tasks]);

  const alterna = (task: Task) => {
    const fatto = task.status !== 'done';
    setLocali((precedenti) =>
      precedenti.map((t) => (t.id === task.id ? { ...t, status: fatto ? 'done' : 'todo' } : t)),
    );
    void toggleTask(task.id, fatto);
  };

  return (
    <section className="flex flex-col gap-3">
      <Etichetta>Da chiudere oggi</Etichetta>

      {locali.length === 0 ? (
        <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-muted">
          Niente in programma. Aggiungi una task e programmala per oggi.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {locali.map((task) => {
            const goal = goals.find((g) => g.id === task.goal_id);
            const fatto = task.status === 'done';
            return (
              <li key={task.id}>
                <label
                  className={cn(
                    'flex min-h-14 cursor-pointer items-center gap-3 rounded-md bg-surface-2 px-4 hover:bg-surface-3',
                    fatto && 'opacity-60',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={fatto}
                    onChange={() => alterna(task)}
                    className="size-4 shrink-0 accent-yellow"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      SPACE_BG[COLORE_PRIORITA[task.priority] ?? 'blue'],
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-[15px]', fatto && 'line-through')}>
                      {task.title}
                    </span>
                    {goal ? (
                      <span className="block truncate text-[12px] text-fg-subtle">
                        {goal.title}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
