import { calcolaStreak, isDueOn, toDateKey } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import Link from 'next/link';
import { Etichetta } from '@/components/ui';
import { SPACE_BG } from '@/lib/colors';
import {
  contaInbox,
  getGoalsConKeyResults,
  getHabitLogs,
  getHabits,
  getTaskDiOggi,
} from '@/lib/queries';
import { AbitudiniDiOggi } from './today-abitudini';
import { TaskDiOggi } from './today-task';

/**
 * `new Date()` in un componente server viene valutato QUANDO la pagina viene
 * prodotta. Senza questa riga Next la prerenderebbe a build time e la data
 * resterebbe ferma al giorno del deploy.
 */
export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const oggi = new Date();
  const chiaveOggi = toDateKey(oggi);

  const [tasks, habits, logs, goals, inbox] = await Promise.all([
    getTaskDiOggi(),
    getHabits(),
    getHabitLogs(),
    getGoalsConKeyResults(),
    contaInbox(),
  ]);

  const abitudiniDiOggi = habits.filter((h) => isDueOn(h.rrule, oggi));
  const fatteOggi = abitudiniDiOggi.filter((h) => logs.get(h.id)?.has(chiaveOggi)).length;

  const daFare = tasks.filter((t) => t.status !== 'done');
  const fatte = tasks.filter((t) => t.status === 'done');

  const logsSerializzabili = Object.fromEntries(
    [...logs.entries()].map(([habitId, giorni]) => [habitId, [...giorni]]),
  );

  const streakMigliore = habits.reduce(
    (massimo, h) => Math.max(massimo, calcolaStreak(h.rrule, logs.get(h.id) ?? [], oggi)),
    0,
  );

  const dataLeggibile = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(oggi);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Etichetta>{dataLeggibile}</Etichetta>
        {/* Il display grande compare UNA volta per schermata (docs/03 §3). */}
        <h1 className="font-display font-extrabold text-[34px] leading-[1.05] tracking-[-0.02em] lg:text-[52px]">
          Le cose
          <br />
          che contano oggi
        </h1>
      </header>

      {/* Griglia bento: 12 colonne, righe da 96px (docs/03 §4). */}
      <div className="grid grid-cols-1 gap-4 lg:auto-rows-[96px] lg:grid-cols-12">
        <Link
          href="/task"
          className="flex flex-col gap-2 rounded-lg bg-yellow p-5 text-on-accent transition-transform duration-[120ms] ease-out hover:scale-[1.01] lg:col-span-5 lg:row-span-2"
        >
          <p className="label opacity-70">Task di oggi</p>
          <p className="font-bold text-[28px] leading-tight">
            {daFare.length === 0 ? 'Tutto fatto' : `${daFare.length} da chiudere`}
          </p>
          <p className="mt-auto text-[13px] opacity-70">
            {fatte.length > 0 ? `${fatte.length} già fatte oggi` : 'Nessuna ancora completata'}
          </p>
        </Link>

        <Link
          href="/abitudini"
          className="flex flex-col gap-2 rounded-lg bg-green p-5 text-on-accent transition-transform duration-[120ms] ease-out hover:scale-[1.01] lg:col-span-3 lg:row-span-2"
        >
          <p className="label opacity-70">Abitudini</p>
          <p className="font-bold text-[28px] leading-tight">
            {fatteOggi}/{abitudiniDiOggi.length}
          </p>
          <p className="mt-auto text-[13px] opacity-70">
            {streakMigliore > 0 ? `Streak migliore: ${streakMigliore} giorni` : 'Nessuna streak'}
          </p>
        </Link>

        <Link
          href="/inbox"
          className="flex flex-col gap-2 rounded-lg bg-surface-2 p-5 transition-colors hover:bg-surface-3 lg:col-span-4"
        >
          <p className="label text-fg-subtle">Inbox</p>
          <p className="font-bold text-[22px] leading-tight">
            {inbox === 0 ? 'Vuota' : `${inbox} da smistare`}
          </p>
        </Link>

        <Link
          href="/obiettivi"
          className="flex flex-col gap-2 rounded-lg bg-surface-2 p-5 transition-colors hover:bg-surface-3 lg:col-span-4"
        >
          <p className="label text-fg-subtle">Obiettivi attivi</p>
          <p className="font-bold text-[22px] leading-tight">
            {goals.filter((g) => g.status === 'active').length || 'Nessuno'}
          </p>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <TaskDiOggi tasks={tasks} goals={goals} />
        <AbitudiniDiOggi habits={abitudiniDiOggi} logs={logsSerializzabili} giorno={chiaveOggi} />
      </div>

      {goals.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Etichetta>Verso cosa stai andando</Etichetta>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {goals
              .filter((g) => g.status === 'active')
              .map((goal) => {
                const kr = goal.key_results;
                const media =
                  kr.length === 0
                    ? 0
                    : Math.round(
                        (kr.reduce((somma, k) => {
                          const target = Number(k.target ?? 0);
                          return somma + (target > 0 ? Math.min(1, Number(k.current) / target) : 0);
                        }, 0) /
                          kr.length) *
                          100,
                      );

                return (
                  <Link
                    key={goal.id}
                    href="/obiettivi"
                    className="flex flex-col gap-2 rounded-md bg-surface-2 p-4 hover:bg-surface-3"
                  >
                    <p className="truncate font-medium text-[14px]">{goal.title}</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          SPACE_BG[(goal.color ?? 'purple') as keyof typeof SPACE_BG],
                        )}
                        style={{ width: `${media}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-fg-subtle">{media}%</p>
                  </Link>
                );
              })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
