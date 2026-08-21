'use client';

import { calcolaStreak } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { Check, Flame } from 'lucide-react';
import { useState } from 'react';
import { Etichetta } from '@/components/ui';
import { toggleHabitLog } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import type { Habit } from '@/lib/types';

export function AbitudiniDiOggi({
  habits,
  logs,
  giorno,
}: {
  habits: Habit[];
  logs: Record<string, string[]>;
  giorno: string;
}) {
  const [locali, setLocali] = useState(logs);

  const alterna = (habitId: string) => {
    setLocali((precedenti) => {
      const fatti = new Set(precedenti[habitId] ?? []);
      if (fatti.has(giorno)) fatti.delete(giorno);
      else fatti.add(giorno);
      return { ...precedenti, [habitId]: [...fatti] };
    });
    void toggleHabitLog(habitId, giorno);
  };

  return (
    <section className="flex flex-col gap-3">
      <Etichetta>Abitudini di oggi</Etichetta>

      {habits.length === 0 ? (
        <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-muted">
          Nessuna abitudine prevista oggi.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {habits.map((habit) => {
            const fatti = locali[habit.id] ?? [];
            const fatto = fatti.includes(giorno);
            const colore = (habit.color ?? 'green') as keyof typeof SPACE_BG;
            const streak = calcolaStreak(habit.rrule, fatti);

            return (
              <li key={habit.id}>
                <button
                  type="button"
                  onClick={() => alterna(habit.id)}
                  aria-pressed={fatto}
                  className="flex min-h-14 w-full items-center gap-3 rounded-md bg-surface-2 px-4 text-left hover:bg-surface-3"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full',
                      fatto ? cn(SPACE_BG[colore], 'text-on-accent') : 'bg-surface-3',
                    )}
                  >
                    {fatto ? <Check aria-hidden size={13} strokeWidth={3} /> : null}
                  </span>
                  <span
                    className={cn('min-w-0 flex-1 truncate text-[15px]', fatto && 'opacity-60')}
                  >
                    {habit.title}
                  </span>
                  {streak > 0 ? (
                    <span className="flex shrink-0 items-center gap-1 text-[12px] text-fg-subtle">
                      <Flame aria-hidden size={12} />
                      {streak}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
