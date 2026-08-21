'use client';

import { SPACE_COLORS } from '@noteaker/core';
import { cn } from '@noteaker/ui/cn';
import { Check, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Bottone, Campo, Pannello, Tendina } from '@/components/ui';
import { aggiornaKeyResult, cambiaStatoGoal, creaGoal, creaKeyResult } from '@/lib/actions';
import { SPACE_BG } from '@/lib/colors';
import type { Goal, KeyResult, SpaceRow } from '@/lib/types';

type GoalConKR = Goal & { key_results: KeyResult[] };

const ORIZZONTI: Record<string, string> = {
  quarter: 'Trimestre',
  year: 'Anno',
  life: 'Vita',
};

export function NuovoObiettivo({ spaces }: { spaces: SpaceRow[] }) {
  const form = useRef<HTMLFormElement>(null);

  return (
    <Pannello>
      <form
        ref={form}
        action={async (formData) => {
          await creaGoal(formData);
          form.current?.reset();
        }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Campo name="title" required placeholder="Nuovo obiettivo" className="min-w-0 flex-1" />

          <Tendina name="horizon" defaultValue="quarter" aria-label="Orizzonte">
            {Object.entries(ORIZZONTI).map(([valore, etichetta]) => (
              <option key={valore} value={valore}>
                {etichetta}
              </option>
            ))}
          </Tendina>

          <Tendina name="color" defaultValue="purple" aria-label="Colore">
            {SPACE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
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

        <Campo
          name="why"
          placeholder="Perché conta? (lo rileggerai nelle review, quando avrai voglia di mollare)"
        />
      </form>
    </Pannello>
  );
}

export function SchedaObiettivo({ goal }: { goal: GoalConKR }) {
  const colore = (goal.color ?? 'purple') as keyof typeof SPACE_BG;
  const form = useRef<HTMLFormElement>(null);

  return (
    <article className={cn('flex flex-col gap-4 rounded-lg p-5', 'bg-surface-2')}>
      <header className="flex items-start gap-3">
        <span aria-hidden className={cn('mt-2 size-2.5 shrink-0 rounded-full', SPACE_BG[colore])} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2
              className={cn(
                'font-bold text-[19px] leading-tight',
                goal.status === 'done' && 'line-through opacity-60',
              )}
            >
              {goal.title}
            </h2>
            <span className="label text-fg-subtle">{ORIZZONTI[goal.horizon] ?? goal.horizon}</span>
          </div>
          {goal.why ? <p className="mt-1 text-[13px] text-fg-muted">{goal.why}</p> : null}
        </div>

        <Bottone
          variante={goal.status === 'done' ? 'primario' : 'fantasma'}
          onClick={() => cambiaStatoGoal(goal.id, goal.status === 'done' ? 'active' : 'done')}
          aria-label={goal.status === 'done' ? 'Riapri obiettivo' : 'Segna come raggiunto'}
        >
          <Check aria-hidden size={14} />
        </Bottone>
      </header>

      {goal.key_results.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {goal.key_results.map((kr) => (
            <li key={kr.id}>
              <BarraKeyResult kr={kr} colore={colore} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-fg-subtle">
          Nessun risultato misurabile. Senza un numero non è un key result, è un desiderio.
        </p>
      )}

      <form
        ref={form}
        action={async (formData) => {
          await creaKeyResult(formData);
          form.current?.reset();
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="goal_id" value={goal.id} />
        <Campo
          name="title"
          required
          placeholder="Risultato misurabile"
          className="min-w-0 flex-1"
        />
        <Campo name="target" type="number" step="any" placeholder="Obiettivo" className="w-28" />
        <Campo name="unit" placeholder="€ / kg / n." className="w-24" />
        <Bottone type="submit">
          <Plus aria-hidden size={14} />
        </Bottone>
      </form>
    </article>
  );
}

function BarraKeyResult({ kr, colore }: { kr: KeyResult; colore: keyof typeof SPACE_BG }) {
  const [valore, setValore] = useState(Number(kr.current));
  const target = Number(kr.target ?? 0);
  const percentuale = target > 0 ? Math.min(100, Math.round((valore / target) * 100)) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-[14px]">{kr.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            type="number"
            step="any"
            value={valore}
            aria-label={`Valore attuale di "${kr.title}"`}
            onChange={(e) => setValore(Number(e.target.value))}
            onBlur={() => aggiornaKeyResult(kr.id, valore)}
            className="w-20 rounded-sm bg-surface-3 px-2 py-1 text-right text-[13px]"
          />
          <span className="text-[12px] text-fg-subtle">
            / {kr.target ?? '—'} {kr.unit ?? ''}
          </span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', SPACE_BG[colore])}
          style={{ width: `${percentuale}%` }}
        />
      </div>
    </div>
  );
}
