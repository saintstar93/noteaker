import Link from 'next/link';
import { EmptyState } from '@/components/empty-state';
import { TitoloSchermata } from '@/components/ui';
import { getInbox, getTutteLeCollections } from '@/lib/queries';
import { Smistamento } from './smistamento';

export const dynamic = 'force-dynamic';

export default async function InboxPage() {
  const [items, destinazioni] = await Promise.all([getInbox(), getTutteLeCollections()]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <TitoloSchermata sopra="Da smistare">Inbox</TitoloSchermata>

      <p className="max-w-[68ch] text-[13px] text-fg-muted">
        Tutto atterra qui. Nessuna decisione al momento della cattura: si sceglie dopo, in blocco.
        Dalla Fase 3 la destinazione arriverà già proposta dall'AI e questo diventerà un tasto di
        conferma.
      </p>

      {items.length === 0 ? (
        <EmptyState
          title="Inbox vuota"
          description="Qui finisce quello che catturi da Chrome, dall'iPhone e da Telegram. Crea un token in Impostazioni per collegare una fonte."
          action={
            <Link
              href="/impostazioni"
              className="inline-flex min-h-9 items-center rounded-sm bg-yellow px-3 font-medium text-[13px] text-on-accent"
            >
              Vai alle impostazioni
            </Link>
          }
        />
      ) : (
        <>
          {/*
            Gli item si mostrano SEMPRE, anche senza cartelle dove metterli.
            Prima venivano nascosti dietro uno stato vuoto: catturavi qualcosa,
            aprivi l'Inbox, non vedevi niente e concludevi che la cattura era
            rotta. Il consiglio si dà accanto alla roba, non al posto suo.
          */}
          {destinazioni.length === 0 ? (
            <p className="rounded-md bg-surface-2 p-4 text-[13px] text-fg-muted">
              Non hai ancora cartelle in cui smistare. Crea uno{' '}
              <Link href="/spaces" className="underline">
                Space
              </Link>{' '}
              con almeno una cartella: da lì in poi il menu «Sposta in…» avrà delle destinazioni.
            </p>
          ) : null}

          <Smistamento items={items} destinazioni={destinazioni} />
        </>
      )}
    </div>
  );
}
