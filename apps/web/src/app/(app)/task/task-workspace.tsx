'use client';

import { cn } from '@noteaker/ui/cn';
import { KanbanSquare, List } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Bottone, Etichetta } from '@/components/ui';
import { spostaTask } from '@/lib/actions';
import { COLONNE_KANBAN, type Goal, type StatoTask, type Task } from '@/lib/types';
import { NuovoTask } from './nuovo-task';
import { TaskCard } from './task-card';

/**
 * Due viste sugli stessi dati: lista raggruppata per obiettivo e board Kanban.
 * La scelta resta in `localStorage`, così l'app riapre come l'hai lasciata.
 *
 * Perché i task stanno in `useState` invece di essere letti direttamente dalle
 * props: quando trascini una card vuoi vederla muoversi SUBITO, non dopo il
 * giro sul server. Si aggiorna la copia locale, si manda la scrittura, e se
 * il server risponde qualcosa di diverso l'effetto qui sotto riallinea tutto.
 * È l'optimistic UI di cui parla CLAUDE.md §6.
 */
export function TaskWorkspace({ tasks, goals }: { tasks: Task[]; goals: Goal[] }) {
  const [vista, setVista] = useState<'lista' | 'board'>('lista');
  const [locali, setLocali] = useState(tasks);
  const [sopra, setSopra] = useState<StatoTask | null>(null);
  const [trascinato, setTrascinato] = useState<string | null>(null);

  useEffect(() => setLocali(tasks), [tasks]);

  useEffect(() => {
    const salvata = localStorage.getItem('noteaker:vista-task');
    if (salvata === 'board' || salvata === 'lista') setVista(salvata);
  }, []);

  const cambiaVista = (nuova: 'lista' | 'board') => {
    setVista(nuova);
    localStorage.setItem('noteaker:vista-task', nuova);
  };

  const goalDi = (task: Task) => goals.find((g) => g.id === task.goal_id);

  const sposta = (id: string, stato: StatoTask) => {
    setLocali((precedenti) => precedenti.map((t) => (t.id === id ? { ...t, status: stato } : t)));
    void spostaTask(id, stato);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-1 self-start rounded-sm bg-surface-2 p-1">
        <Bottone
          variante={vista === 'lista' ? 'primario' : 'fantasma'}
          onClick={() => cambiaVista('lista')}
          aria-pressed={vista === 'lista'}
        >
          <List aria-hidden size={14} /> Lista
        </Bottone>
        <Bottone
          variante={vista === 'board' ? 'primario' : 'fantasma'}
          onClick={() => cambiaVista('board')}
          aria-pressed={vista === 'board'}
        >
          <KanbanSquare aria-hidden size={14} /> Kanban
        </Bottone>
      </div>

      <NuovoTask goals={goals} />

      {locali.length === 0 ? (
        <EmptyState
          title="Nessun task"
          description="Scrivi qui sopra la prima cosa da fare. Collegala a un obiettivo se ne hai uno: è quello che tiene insieme la giornata e il trimestre."
        />
      ) : vista === 'board' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLONNE_KANBAN.map(({ stato, titolo }) => {
            const colonna = locali.filter((t) => t.status === stato);
            return (
              <section
                key={stato}
                // La colonna riceve gli eventi di drop, quindi non è un
                // contenitore muto: un <section> con `aria-label` ha ruolo
                // implicito `region` ed è annunciabile da uno screen reader.
                // Il drag resta inaccessibile da tastiera: la via equivalente
                // è la tendina di stato su ogni card (docs/03 §7).
                aria-label={`Colonna ${titolo}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSopra(stato);
                }}
                onDragLeave={() => setSopra((s) => (s === stato ? null : s))}
                onDrop={() => {
                  if (trascinato) sposta(trascinato, stato);
                  setTrascinato(null);
                  setSopra(null);
                }}
                className={cn(
                  'flex min-h-40 flex-col gap-3 rounded-lg p-3 transition-colors duration-[120ms]',
                  sopra === stato ? 'bg-surface-3' : 'bg-surface',
                )}
              >
                <div className="flex items-center justify-between px-1">
                  <Etichetta>{titolo}</Etichetta>
                  <span className="text-[11px] text-fg-subtle">{colonna.length}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {colonna.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      goal={goalDi(task)}
                      trascinabile
                      onDragStart={() => setTrascinato(task.id)}
                    />
                  ))}
                </div>

                {stato === 'todo' ? <NuovoTask goals={goals} stato="todo" compatto /> : null}
              </section>
            );
          })}
        </div>
      ) : (
        <ListaPerObiettivo tasks={locali} goals={goals} />
      )}
    </div>
  );
}

/**
 * "Task divise per progetto": il progetto è l'OBIETTIVO a cui la task è
 * collegata. È la catena descritta in CLAUDE.md §5.3, Goal → Task: una cosa
 * da fare che non serve a nessun obiettivo è una domanda, non un compito.
 */
function ListaPerObiettivo({ tasks, goals }: { tasks: Task[]; goals: Goal[] }) {
  const gruppi = [
    ...goals.map((goal) => ({
      chiave: goal.id,
      titolo: goal.title,
      goal,
      elementi: tasks.filter((t) => t.goal_id === goal.id),
    })),
    {
      chiave: 'senza',
      titolo: 'Senza obiettivo',
      goal: undefined,
      elementi: tasks.filter((t) => !t.goal_id),
    },
  ].filter((g) => g.elementi.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {gruppi.map((gruppo) => (
        <section key={gruppo.chiave} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-[17px]">{gruppo.titolo}</h2>
            <span className="text-[11px] text-fg-subtle">
              {gruppo.elementi.filter((t) => t.status === 'done').length}/{gruppo.elementi.length}{' '}
              fatte
            </span>
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
            {gruppo.elementi.map((task) => (
              <TaskCard key={task.id} task={task} goal={gruppo.goal} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
