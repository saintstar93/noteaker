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
          description="Qui finiranno gli articoli, i reel e i video che catturi da Chrome, dall'iPhone e da Telegram — la Fase 1 della roadmap. Per ora puoi creare note a mano dentro gli Spaces."
        />
      ) : destinazioni.length === 0 ? (
        <EmptyState
          title="Manca dove metterli"
          description="Hai roba da smistare ma nessuna cartella in cui metterla. Crea prima uno Space e almeno una cartella."
        />
      ) : (
        <Smistamento items={items} destinazioni={destinazioni} />
      )}
    </div>
  );
}
