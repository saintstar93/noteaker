'use client';

import { cn } from '@noteaker/ui/cn';
import { Calendar, Timer, Trash2 } from 'lucide-react';
import { eliminaTask, spostaTaskInColonna } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import { ETICHETTA_PRIORITA, type Project, type Task, type TaskColumn } from '@/lib/types';

const COLORE_PRIORITA: Record<number, keyof typeof SPACE_BG> = { 1: 'red', 2: 'yellow', 3: 'blue' };

export function TaskCard({
  task,
  progetto,
  colonne,
  onDragStart,
  trascinabile,
  onAvviaPomodoro,
}: {
  task: Task;
  progetto?: Project;
  colonne: TaskColumn[];
  onDragStart?: () => void;
  trascinabile?: boolean;
  onAvviaPomodoro?: (task: Task) => void;
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
        {progetto ? (
          <>
            <span aria-hidden>·</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-on-accent',
                SPACE_BG[(progetto.color ?? 'blue') as keyof typeof SPACE_BG],
              )}
            >
              {progetto.name}
            </span>
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
          aria-label={`Colonna di "${task.title}"`}
          value={task.column_id ?? ''}
          onChange={(e) => spostaTaskInColonna(task.id, e.target.value)}
          className="min-h-8 rounded-sm bg-surface-3 px-2 text-[11px] text-fg-muted [&>option]:bg-surface-2"
        >
          {colonne.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {onAvviaPomodoro && task.status !== 'done' ? (
          <button
            type="button"
            onClick={() => onAvviaPomodoro(task)}
            aria-label={`Avvia un pomodoro su "${task.title}"`}
            className="rounded-sm p-1.5 text-fg-subtle hover:bg-surface-3 hover:text-fg"
          >
            <Timer aria-hidden size={13} />
          </button>
        ) : null}

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
