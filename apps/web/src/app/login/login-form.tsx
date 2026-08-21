'use client';

import { useActionState } from 'react';
import {
  entraComeSviluppo,
  type LoginState,
  signInWithGoogle,
  signInWithMagicLink,
} from './actions';

export function LoginForm({ configured, locale }: { configured: boolean; locale: boolean }) {
  // useActionState collega il form alla server action e tiene il valore
  // restituito (il messaggio) più lo stato "in corso", senza useState a mano.
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    signInWithMagicLink,
    null,
  );

  // Azione senza payload: `useActionState` la accetta lo stesso, e in cambio
  // l'eventuale errore compare nello stesso posto degli altri.
  const [statoSviluppo, azioneSviluppo, inCorsoSviluppo] = useActionState(
    entraComeSviluppo,
    null as LoginState,
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="email" className="label text-fg-subtle">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@esempio.it"
          className="min-h-11 rounded-sm bg-surface-2 px-4 text-[16px] placeholder:text-fg-subtle"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-sm bg-yellow px-4 font-semibold text-[15px] text-on-accent disabled:opacity-60"
        >
          {pending ? 'Invio…' : 'Mandami il link'}
        </button>
      </form>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="min-h-11 w-full rounded-sm bg-surface-2 px-4 text-[15px] hover:bg-surface-3"
        >
          Continua con Google
        </button>
      </form>

      {locale ? (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" aria-hidden />
            <span className="label text-fg-subtle">solo in locale</span>
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>

          <form action={azioneSviluppo}>
            <button
              type="submit"
              disabled={inCorsoSviluppo}
              className="min-h-11 w-full rounded-sm border border-border border-dashed px-4 text-[15px] text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-60"
            >
              {inCorsoSviluppo ? 'Entro…' : 'Entra come Daniele (senza email)'}
            </button>
          </form>

          {statoSviluppo && !statoSviluppo.ok ? (
            <p role="status" className="text-[13px] text-danger">
              {statoSviluppo.message}
            </p>
          ) : null}

          <p className="text-[12px] text-fg-subtle">
            Utente creato da <code className="font-mono">supabase/seed.sql</code>. Sopravvive a
            <code className="font-mono"> supabase db reset</code>, così non devi più passare da
            Mailpit. Questo pulsante non esiste in produzione.
          </p>
        </>
      ) : null}

      {state ? (
        <p
          role="status"
          className={state.ok ? 'text-[13px] text-success' : 'text-[13px] text-danger'}
        >
          {state.message}
        </p>
      ) : null}

      {configured ? null : (
        <p className="rounded-sm bg-surface-2 p-3 text-[13px] text-fg-muted">
          Supabase non è configurato. Copia <code className="font-mono">.env.example</code> in{' '}
          <code className="font-mono">.env.local</code> e riempilo: fino ad allora il login non può
          funzionare, ma il resto dell'app è navigabile.
        </p>
      )}
    </div>
  );
}
