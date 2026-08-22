'use client';

import { cn } from '@noteaker/ui/cn';
import { KanbanSquare, List, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Pomodoro } from '@/components/pomodoro';
import { Bottone, Etichetta } from '@/components/ui';
import { spostaTaskInColonna } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import type { PomodoroSettings, Project, Task, TaskColumn } from '@/lib/types';
import { GestioneColonne } from './gestione-colonne';
import { NuovoTask } from './nuovo-task';
import { TaskCard } from './task-card';

/**
 * Due viste sugli stessi dati: lista raggruppata per progetto e board Kanban
 * con le colonne decise dall'utente. La scelta resta in `localStorage`, così
 * l'app riapre come l'hai lasciata.
 *
 * Perché i task stanno in `useState` invece di essere letti direttamente dalle
 * props: quando trascini una card vuoi vederla muoversi SUBITO, non dopo il
 * giro sul server. Si aggiorna la copia locale, si manda la scrittura, e se il
 * server risponde qualcosa di diverso l'effetto qui sotto riallinea tutto.
 */
export function TaskWorkspace({
  tasks,
  progetti,
  colonne,
  pomodoro,
  pomodoriDiOggi,
}: {
  tasks: Task[];
  progetti: Project[];
  colonne: TaskColumn[];
  pomodoro: PomodoroSettings | null;
  pomodoriDiOggi: number;
}) {
  const [vista, setVista] = useState<'lista' | 'board'>('board');
  const [locali, setLocali] = useState(tasks);
  const [sopra, setSopra] = useState<string | null>(null);
  const [trascinato, setTrascinato] = useState<string | null>(null);
  const [mostraColonne, setMostraColonne] = useState(false);
  const [taskDelPomodoro, setTaskDelPomodoro] = useState<Task | null>(null);
  const [filtroProgetto, setFiltroProgetto] = useState<string>('tutti');

  useEffect(() => setLocali(tasks), [tasks]);

  useEffect(() => {
    const salvata = localStorage.getItem('noteaker:vista-task');
    if (salvata === 'board' || salvata === 'lista') setVista(salvata);
  }, []);

  const cambiaVista = (nuova: 'lista' | 'board') => {
    setVista(nuova);
    localStorage.setItem('noteaker:vista-task', nuova);
  };

  const progettoDi = (task: Task) => progetti.find((p) => p.id === task.project_id);

  const visibili =
    filtroProgetto === 'tutti'
      ? locali
      : filtroProgetto === 'senza'
        ? locali.filter((t) => !t.project_id)
        : locali.filter((t) => t.project_id === filtroProgetto);

  const sposta = (id: string, columnId: string) => {
    const colonna = colonne.find((c) => c.id === columnId);
    setLocali((precedenti) =>
      precedenti.map((t) =>
        t.id === id
          ? {
              ...t,
              column_id: columnId,
              status: colonna?.is_done ? 'done' : t.status === 'done' ? 'todo' : t.status,
            }
          : t,
      ),
    );
    void spostaTaskInColonna(id, columnId);
  };

  return (
    <div className="flex flex-col gap-6">
      {pomodoro ? (
        <Pomodoro
          impostazioni={pomodoro}
          task={taskDelPomodoro}
          pomodoriDiOggi={pomodoriDiOggi}
          onChiudiTask={() => setTaskDelPomodoro(null)}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-sm bg-surface-2 p-1">
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

        {/* Il filtro per progetto: si può anche non selezionarne nessuno. */}
        <select
          value={filtroProgetto}
          onChange={(e) => setFiltroProgetto(e.target.value)}
          aria-label="Filtra per progetto"
          className="min-h-9 rounded-sm bg-surface-2 px-3 text-[13px] [&>option]:bg-surface-2"
        >
          <option value="tutti">Tutti i progetti</option>
          <option value="senza">Senza progetto</option>
          {progetti.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {vista === 'board' ? (
          <Bottone
            variante={mostraColonne ? 'primario' : 'fantasma'}
            onClick={() => setMostraColonne((m) => !m)}
            aria-expanded={mostraColonne}
          >
            <Settings2 aria-hidden size={14} /> Colonne
          </Bottone>
        ) : null}
      </div>

      {mostraColonne && vista === 'board' ? <GestioneColonne colonne={colonne} /> : null}

      <NuovoTask progetti={progetti} />

      {visibili.length === 0 ? (
        <EmptyState
          title={locali.length === 0 ? 'Nessun task' : 'Niente in questo progetto'}
          description={
            locali.length === 0
              ? 'Scrivi qui sopra la prima cosa da fare. Puoi collegarla a un progetto, ma non sei obbligato.'
              : 'Cambia filtro, oppure aggiungi qui sopra la prima cosa di questo progetto.'
          }
        />
      ) : vista === 'board' ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${colonne.length}, minmax(240px, 1fr))` }}
        >
          {colonne.map((colonna) => {
            const dentro = visibili.filter((t) => t.column_id === colonna.id);
            return (
              <section
                key={colonna.id}
                // La colonna riceve gli eventi di drop, quindi non è un
                // contenitore muto: un <section> con `aria-label` ha ruolo
                // implicito `region` ed è annunciabile da uno screen reader.
                // Il drag resta inaccessibile da tastiera: la via equivalente
                // è la tendina di colonna su ogni card (docs/03 §7).
                aria-label={`Colonna ${colonna.name}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setSopra(colonna.id);
                }}
                onDragLeave={() => setSopra((s) => (s === colonna.id ? null : s))}
                onDrop={() => {
                  if (trascinato) sposta(trascinato, colonna.id);
                  setTrascinato(null);
                  setSopra(null);
                }}
                className={cn(
                  'flex min-h-40 flex-col gap-3 rounded-lg p-3 transition-colors duration-[120ms]',
                  sopra === colonna.id ? 'bg-surface-3' : 'bg-surface',
                )}
              >
                <div className="flex items-center gap-2 px-1">
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 rounded-full',
                      SPACE_BG[(colonna.color ?? 'blue') as keyof typeof SPACE_BG],
                    )}
                  />
                  <Etichetta className="flex-1">{colonna.name}</Etichetta>
                  <span className="text-[11px] text-fg-subtle">{dentro.length}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {dentro.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      progetto={progettoDi(task)}
                      colonne={colonne}
                      trascinabile
                      onDragStart={() => setTrascinato(task.id)}
                      onAvviaPomodoro={setTaskDelPomodoro}
                    />
                  ))}
                </div>

                <NuovoTask progetti={progetti} colonna={colonna} compatto />
              </section>
            );
          })}
        </div>
      ) : (
        <ListaPerProgetto
          tasks={visibili}
          progetti={progetti}
          colonne={colonne}
          onAvviaPomodoro={setTaskDelPomodoro}
        />
      )}
    </div>
  );
}

/**
 * "Task divise per progetto". Il progetto è facoltativo: quelle senza
 * finiscono in un gruppo a parte, non spariscono.
 */
function ListaPerProgetto({
  tasks,
  progetti,
  colonne,
  onAvviaPomodoro,
}: {
  tasks: Task[];
  progetti: Project[];
  colonne: TaskColumn[];
  onAvviaPomodoro: (task: Task) => void;
}) {
  const gruppi = [
    ...progetti.map((progetto) => ({
      chiave: progetto.id,
      titolo: progetto.name,
      progetto,
      elementi: tasks.filter((t) => t.project_id === progetto.id),
    })),
    {
      chiave: 'senza',
      titolo: 'Senza progetto',
      progetto: undefined,
      elementi: tasks.filter((t) => !t.project_id),
    },
  ].filter((g) => g.elementi.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {gruppi.map((gruppo) => (
        <section key={gruppo.chiave} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              {gruppo.progetto ? (
                <span
                  aria-hidden
                  className={cn(
                    'size-2 rounded-full',
                    SPACE_BG[(gruppo.progetto.color ?? 'blue') as keyof typeof SPACE_BG],
                  )}
                />
              ) : null}
              <h2 className="font-semibold text-[17px]">{gruppo.titolo}</h2>
            </div>
            <span className="text-[11px] text-fg-subtle">
              {gruppo.elementi.filter((t) => t.status === 'done').length}/{gruppo.elementi.length}{' '}
              fatte
            </span>
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
            {gruppo.elementi.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                progetto={gruppo.progetto}
                colonne={colonne}
                onAvviaPomodoro={onAvviaPomodoro}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
