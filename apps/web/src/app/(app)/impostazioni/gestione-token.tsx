'use client';

import { cn } from '@noteaker/ui/cn';
import { Check, Copy, Plus, ShieldOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Bottone, Campo, Pannello } from '@/components/ui';
import { creaCaptureToken, revocaCaptureToken } from '@/lib/actions';
import type { Riga } from '@/lib/types';

type Token = Riga<'capture_tokens'>;

/**
 * I token di cattura: creazione, visualizzazione **una tantum**, revoca.
 *
 * Il pezzo importante è che il token appena creato si vede una volta sola.
 * Non è una scomodità gratuita: in database c'è solo la sua impronta, quindi
 * nemmeno noi possiamo rileggerlo. Se lo perdi, se ne crea un altro.
 */
export function GestioneToken({ tokens }: { tokens: Token[] }) {
  const [appenaCreato, setAppenaCreato] = useState<string | null>(null);
  const [copiato, setCopiato] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <Pannello>
        <form
          ref={form}
          action={async (formData) => {
            const token = await creaCaptureToken(formData);
            setAppenaCreato(token);
            setCopiato(false);
            form.current?.reset();
            router.refresh();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <Campo
            name="name"
            required
            placeholder="Nome della fonte (Chrome, iPhone, Telegram…)"
            className="min-w-0 flex-1"
          />
          <Bottone type="submit" variante="primario">
            <Plus aria-hidden size={14} /> Crea token
          </Bottone>
        </form>
      </Pannello>

      {appenaCreato ? (
        <div className="flex flex-col gap-3 rounded-lg bg-yellow p-5 text-on-accent">
          <div>
            <p className="label opacity-70">Copialo adesso</p>
            <p className="mt-1 text-[13px] opacity-80">
              È l'unica volta che lo vedi. In database c'è solo la sua impronta: se lo perdi non si
              recupera, se ne crea un altro.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-sm bg-black/10 px-3 py-2 font-mono text-[13px]">
              {appenaCreato}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(appenaCreato);
                setCopiato(true);
              }}
              className="flex min-h-9 items-center gap-2 rounded-sm bg-black/10 px-3 text-[13px] font-medium hover:bg-black/20"
            >
              {copiato ? <Check aria-hidden size={14} /> : <Copy aria-hidden size={14} />}
              {copiato ? 'Copiato' : 'Copia'}
            </button>
          </div>

          <Bottone
            variante="fantasma"
            className="self-start text-on-accent/70 hover:bg-black/10 hover:text-on-accent"
            onClick={() => setAppenaCreato(null)}
          >
            Fatto, l'ho salvato
          </Bottone>
        </div>
      ) : null}

      {tokens.length === 0 ? (
        <p className="rounded-lg border border-border border-dashed p-6 text-center text-[13px] text-fg-muted">
          Nessun token. Creane uno per fonte: così puoi revocarne uno senza rompere gli altri.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tokens.map((token) => {
            const revocato = Boolean(token.revoked_at);
            return (
              <li
                key={token.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-md bg-surface-2 p-4',
                  revocato && 'opacity-50',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[15px]">
                    {token.name}
                    {revocato ? <span className="ml-2 text-[12px]">— revocato</span> : null}
                  </p>
                  <p className="font-mono text-[12px] text-fg-subtle">{token.token_hint}</p>
                </div>

                <p className="text-[12px] text-fg-subtle">
                  {token.last_used_at
                    ? `usato ${new Intl.DateTimeFormat('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(token.last_used_at))}`
                    : 'mai usato'}
                </p>

                {!revocato ? (
                  <Bottone
                    variante="pericolo"
                    onClick={async () => {
                      await revocaCaptureToken(token.id);
                      router.refresh();
                    }}
                    aria-label={`Revoca "${token.name}"`}
                  >
                    <ShieldOff aria-hidden size={14} /> Revoca
                  </Bottone>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Le ultime chiamate all'endpoint: serve a capire se un canale funziona. */
export function RegistroCatture({
  eventi,
}: {
  eventi: { id: number; status: number; source: string | null; created_at: string }[];
}) {
  if (eventi.length === 0) {
    return (
      <p className="text-[13px] text-fg-subtle">
        Nessuna chiamata ancora. Comparirà qui appena catturi qualcosa.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {eventi.map((evento) => (
        <li key={evento.id} className="flex items-center gap-3 text-[13px]">
          <span
            className={cn(
              'w-11 shrink-0 rounded-sm px-1.5 py-0.5 text-center font-mono text-[11px]',
              evento.status < 300
                ? 'bg-success text-on-accent'
                : evento.status === 429
                  ? 'bg-warning text-on-accent'
                  : 'bg-danger text-on-accent',
            )}
          >
            {evento.status}
          </span>
          <span className="flex-1 text-fg-muted">{evento.source ?? '—'}</span>
          <span className="text-fg-subtle">
            {new Intl.DateTimeFormat('it-IT', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(evento.created_at))}
          </span>
        </li>
      ))}
    </ul>
  );
}
