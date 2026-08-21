'use client';

import { useActionState } from 'react';
import { type LoginState, signInWithGoogle, signInWithMagicLink } from './actions';

export function LoginForm({ configured }: { configured: boolean }) {
  // useActionState collega il form alla server action e tiene il valore
  // restituito (il messaggio) più lo stato "in corso", senza useState a mano.
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    signInWithMagicLink,
    null,
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
