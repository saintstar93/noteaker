'use client';

import { cn } from '@noteaker/ui/cn';
import { Calendar, Trash2 } from 'lucide-react';
import { eliminaTask, spostaTask } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import { COLONNE_KANBAN, ETICHETTA_PRIORITA, type Goal, type Task } from '@/lib/types';

const COLORE_PRIORITA: Record<number, keyof typeof SPACE_BG> = {
  1: 'red',
  2: 'yellow',
  3: 'blue',
};

export function TaskCard({
  task,
  goal,
  onDragStart,
  trascinabile,
}: {
  task: Task;
  goal?: Goal;
  onDragStart?: () => void;
  trascinabile?: boolean;
}) {
  return (
    <article
      draggable={trascinabile}
      onDragStart={onDragStart}
      className={cn(
        'group flex flex-col gap-2 rounded-md bg-surface-2 p-3',
        trascinabile && 'cursor-grab active:cursor-grabbing',
        task.status === 'done' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className={cn(
            'mt-1.5 size-2 shrink-0 rounded-full',
            SPACE_BG[COLORE_PRIORITA[task.priority] ?? 'blue'],
          )}
        />
        <p
          className={cn(
            'min-w-0 flex-1 text-[14px] leading-snug',
            task.status === 'done' && 'line-through',
          )}
        >
          {task.title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-fg-subtle">
        <span>{ETICHETTA_PRIORITA[task.priority]}</span>
        {goal ? (
          <>
            <span aria-hidden>·</span>
            <span className="truncate">{goal.title}</span>
          </>
        ) : null}
        {task.scheduled_for ? (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Calendar aria-hidden size={11} />
              {new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(
                new Date(`${task.scheduled_for}T12:00:00`),
              )}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-1">
        {/*
          Il trascinamento non è usabile da tastiera né da screen reader.
          Questa tendina fa la stessa identica cosa ed è la via accessibile:
          il drag resta una scorciatoia, non l'unico modo (docs/03 §7).
        */}
        <select
          aria-label={`Stato di "${task.title}"`}
          value={task.status}
          onChange={(e) => spostaTask(task.id, e.target.value)}
          className="min-h-8 rounded-sm bg-surface-3 px-2 text-[11px] text-fg-muted [&>option]:bg-surface-2"
        >
          {COLONNE_KANBAN.map((c) => (
            <option key={c.stato} value={c.stato}>
              {c.titolo}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => eliminaTask(task.id)}
          aria-label={`Elimina "${task.title}"`}
          className="ml-auto rounded-sm p-1.5 text-fg-subtle opacity-0 transition-opacity hover:bg-danger hover:text-on-accent focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 aria-hidden size={13} />
        </button>
      </div>
    </article>
  );
}
