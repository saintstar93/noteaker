'use client';

import { SPACE_COLORS } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Bottone, Campo, Pannello, Tendina } from '@/components/ui';
import { cambiaStatoProject, creaProject, eliminaProject, rinominaProject } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import type { Goal, Project, SpaceRow } from '@/lib/types';

export function NuovoProgetto({ goals, spaces }: { goals: Goal[]; spaces: SpaceRow[] }) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <Pannello>
      <form
        ref={form}
        action={async (formData) => {
          await creaProject(formData);
          form.current?.reset();
          router.refresh();
        }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Campo name="name" required placeholder="Nuovo progetto" className="min-w-0 flex-1" />

          <Tendina name="color" defaultValue="blue" aria-label="Colore">
            {SPACE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Tendina>

          {/* Facoltativo: un progetto può servire un obiettivo, oppure no. */}
          <Tendina name="goal_id" defaultValue="" aria-label="Obiettivo servito">
            <option value="">Senza obiettivo</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </Tendina>

          <Tendina name="space_id" defaultValue="" aria-label="Space">
            <option value="">Nessuno space</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Tendina>

          <Bottone type="submit" variante="primario">
            <Plus aria-hidden size={14} /> Crea
          </Bottone>
        </div>

        <Campo name="description" placeholder="A cosa serve? (facoltativo)" />
      </form>
    </Pannello>
  );
}

export function SchedaProgetto({
  progetto,
  goal,
  taskTotali,
  taskFatte,
}: {
  progetto: Project;
  goal?: Goal;
  taskTotali: number;
  taskFatte: number;
}) {
  const [modo, setModo] = useState<'normale' | 'rinomina' | 'conferma'>('normale');
  const [nome, setNome] = useState(progetto.name);
  const [coloreScelto, setColoreScelto] = useState(progetto.color ?? 'blue');
  const router = useRouter();

  const colore = (progetto.color ?? 'blue') as keyof typeof SPACE_BG;
  const percentuale = taskTotali === 0 ? 0 : Math.round((taskFatte / taskTotali) * 100);

  if (modo === 'rinomina') {
    return (
      <form
        action={async () => {
          await rinominaProject(progetto.id, nome, coloreScelto);
          setModo('normale');
          router.refresh();
        }}
        className="flex flex-col gap-3 rounded-lg bg-surface-2 p-5"
      >
        <Campo
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-label="Nome del progetto"
        />
        <div className="flex items-center gap-2">
          <Tendina
            value={coloreScelto}
            onChange={(e) => setColoreScelto(e.target.value)}
            aria-label="Colore"
            className="flex-1"
          >
            {SPACE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Tendina>
          <Bottone type="submit" variante="primario" aria-label="Salva">
            <Check aria-hidden size={14} />
          </Bottone>
          <Bottone type="button" onClick={() => setModo('normale')} aria-label="Annulla">
            <X aria-hidden size={14} />
          </Bottone>
        </div>
      </form>
    );
  }

  if (modo === 'conferma') {
    return (
      <div className="flex flex-col gap-3 rounded-lg bg-surface-2 p-5">
        <div>
          <p className="font-semibold text-[15px]">Elimino «{progetto.name}»?</p>
          <p className="mt-1 text-[12px] text-fg-muted">
            Le sue {taskTotali} task <strong>non</strong> vengono cancellate: restano, senza
            progetto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bottone
            variante="pericolo"
            className="bg-danger text-on-accent"
            onClick={async () => {
              await eliminaProject(progetto.id);
              router.refresh();
            }}
          >
            Sì, elimina
          </Bottone>
          <Bottone onClick={() => setModo('normale')}>Annulla</Bottone>
        </div>
      </div>
    );
  }

  return (
    <article className="group flex flex-col gap-3 rounded-lg bg-surface-2 p-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', SPACE_BG[colore])}
        />
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              'font-bold text-[17px] leading-tight',
              progetto.status === 'done' && 'line-through opacity-60',
            )}
          >
            {progetto.name}
          </h2>
          {progetto.description ? (
            <p className="mt-1 text-[13px] text-fg-muted">{progetto.description}</p>
          ) : null}
          {goal ? <p className="mt-1 text-[12px] text-fg-subtle">↳ serve «{goal.title}»</p> : null}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => setModo('rinomina')}
            aria-label={`Rinomina "${progetto.name}"`}
            className="rounded-sm p-2 text-fg-subtle hover:bg-surface-3 hover:text-fg"
          >
            <Pencil aria-hidden size={14} />
          </button>
          <button
            type="button"
            onClick={() => setModo('conferma')}
            aria-label={`Elimina "${progetto.name}"`}
            className="rounded-sm p-2 text-fg-subtle hover:bg-danger hover:text-on-accent"
          >
            <Trash2 aria-hidden size={14} />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className={cn('h-full rounded-full transition-[width] duration-300', SPACE_BG[colore])}
            style={{ width: `${percentuale}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span>
            {taskFatte}/{taskTotali} task
          </span>
          <Bottone
            variante="fantasma"
            onClick={async () => {
              await cambiaStatoProject(progetto.id, progetto.status === 'done' ? 'active' : 'done');
              router.refresh();
            }}
          >
            {progetto.status === 'done' ? 'Riapri' : 'Concluso'}
          </Bottone>
        </div>
      </div>
    </article>
  );
}
