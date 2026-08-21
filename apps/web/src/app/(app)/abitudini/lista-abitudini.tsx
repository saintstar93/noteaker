'use client';

import {
  addDays,
  calcolaStreak,
  describeRrule,
  isDueOn,
  tassoDiRispetto,
  toDateKey,
  WEEKDAY_LABEL,
  WEEKDAYS,
} from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { Archive, Check, Flame } from 'lucide-react';
import { useState } from 'react';
import { archiviaHabit, toggleHabitLog } from '@/lib/actions';
import { SPACE_BG, SPACE_TEXT } from '@/lib/colors';
import type { Habit } from '@/lib/types';

/**
 * La griglia delle abitudini: una riga per abitudine, gli ultimi 7 giorni in
 * colonna. Ogni casella è cliccabile — un tocco segna fatto, un altro annulla.
 *
 * Streak e percentuali NON arrivano dal database: li calcola `packages/core`
 * dai log. Un contatore salvato è un contatore che prima o poi si disallinea
 * dalla realtà (docs/02 §7).
 */
export function ListaAbitudini({
  habits,
  logs,
}: {
  habits: Habit[];
  logs: Record<string, string[]>;
}) {
  // Copia locale per far reagire subito la casella al clic, senza aspettare
  // il giro sul server.
  const [locali, setLocali] = useState(logs);

  const oggi = new Date();
  const giorni = Array.from({ length: 7 }, (_, i) => addDays(oggi, -6 + i));

  const alterna = (habitId: string, giorno: string) => {
    setLocali((precedenti) => {
      const fatti = new Set(precedenti[habitId] ?? []);
      if (fatti.has(giorno)) fatti.delete(giorno);
      else fatti.add(giorno);
      return { ...precedenti, [habitId]: [...fatti] };
    });
    void toggleHabitLog(habitId, giorno);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden grid-cols-[1fr_repeat(7,2.25rem)_5rem] items-center gap-2 px-4 lg:grid">
        <span />
        {giorni.map((giorno) => (
          <span key={toDateKey(giorno)} className="label text-center text-fg-subtle">
            {WEEKDAY_LABEL[WEEKDAYS[(giorno.getDay() + 6) % 7] as keyof typeof WEEKDAY_LABEL]}
          </span>
        ))}
        <span className="label text-right text-fg-subtle">30 gg</span>
      </div>

      {habits.map((habit) => {
        const fatti = locali[habit.id] ?? [];
        const streak = calcolaStreak(habit.rrule, fatti, oggi);
        const tasso = tassoDiRispetto(habit.rrule, fatti, 30, oggi);
        const colore = (habit.color ?? 'green') as keyof typeof SPACE_BG;

        return (
          <article
            key={habit.id}
            className="grid grid-cols-1 items-center gap-3 rounded-md bg-surface-2 p-4 lg:grid-cols-[1fr_repeat(7,2.25rem)_5rem]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full', SPACE_BG[colore])} />
              <div className="min-w-0">
                <p className="truncate font-medium text-[15px]">{habit.title}</p>
                <p className="text-[12px] text-fg-subtle">
                  {describeRrule(habit.rrule)}
                  {streak > 0 ? (
                    <span className={cn('ml-2 inline-flex items-center gap-1', SPACE_TEXT[colore])}>
                      <Flame aria-hidden size={11} />
                      {streak}
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => archiviaHabit(habit.id)}
                aria-label={`Archivia "${habit.title}"`}
                className="ml-auto rounded-sm p-2 text-fg-subtle hover:bg-surface-3 lg:hidden"
              >
                <Archive aria-hidden size={14} />
              </button>
            </div>

            <div className="flex gap-2 lg:contents">
              {giorni.map((giorno) => {
                const chiave = toDateKey(giorno);
                const fatto = fatti.includes(chiave);
                const dovuto = isDueOn(habit.rrule, giorno);
                const futuro = chiave > toDateKey(oggi);

                return (
                  <button
                    key={chiave}
                    type="button"
                    disabled={futuro}
                    onClick={() => alterna(habit.id, chiave)}
                    aria-pressed={fatto}
                    aria-label={`${habit.title}, ${new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(giorno)}${fatto ? ', fatto' : ''}`}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-sm transition-colors duration-[120ms]',
                      fatto
                        ? cn(SPACE_BG[colore], 'text-on-accent')
                        : dovuto
                          ? 'bg-surface-3 text-fg-subtle hover:bg-surface hover:text-fg'
                          : 'bg-surface text-fg-subtle/40',
                      futuro && 'opacity-30',
                    )}
                  >
                    {fatto ? <Check aria-hidden size={15} strokeWidth={3} /> : null}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between lg:justify-end lg:gap-2">
              <span className="text-[13px] text-fg-muted lg:text-right">
                {tasso.percentuale}%
                <span className="ml-1 text-[11px] text-fg-subtle">
                  ({tasso.fatti}/{tasso.dovuti})
                </span>
              </span>
              <button
                type="button"
                onClick={() => archiviaHabit(habit.id)}
                aria-label={`Archivia "${habit.title}"`}
                className="hidden rounded-sm p-2 text-fg-subtle hover:bg-surface-3 lg:block"
              >
                <Archive aria-hidden size={14} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
