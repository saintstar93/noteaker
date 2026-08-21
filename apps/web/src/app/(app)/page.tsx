import { ColoredCard, SurfaceCard } from '@/components/colored-card';
import { ItemRow } from '@/components/item-row';
import { DEMO_INBOX } from '@/lib/demo';

/**
 * TODAY — la schermata principale. In fase 0 mostra la griglia bento vuota,
 * col design definitivo: è esattamente il traguardo della fase
 * ("una schermata vuota ma tua, con i colori giusti").
 */
export default function TodayPage() {
  const oggi = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="label text-fg-subtle">{oggi}</p>
        {/* Il display grande compare UNA volta per schermata (docs/03 §3). */}
        <h1 className="font-display font-extrabold text-[34px] leading-[1.05] tracking-[-0.02em] lg:text-[52px]">
          Le cose
          <br />
          che contano oggi
        </h1>
      </header>

      {/* Griglia bento: 12 colonne, righe da 96px (docs/03 §4). */}
      <div className="grid grid-cols-1 gap-4 lg:auto-rows-[96px] lg:grid-cols-12">
        <ColoredCard color="yellow" label="Task" className="lg:col-span-5 lg:row-span-2">
          <p className="font-bold text-[22px] leading-tight">Nessun task per oggi</p>
          <p className="mt-auto text-[13px] opacity-70">
            Goal → Habit → Task arrivano nella fase 4.
          </p>
        </ColoredCard>

        <ColoredCard color="green" label="Abitudini" className="lg:col-span-3 lg:row-span-2">
          <p className="font-bold text-[22px] leading-tight">0 / 0</p>
          <p className="mt-auto text-[13px] opacity-70">Streak in arrivo.</p>
        </ColoredCard>

        <SurfaceCard label="Inbox" className="lg:col-span-4 lg:row-span-2">
          <p className="font-bold text-[22px] leading-tight">{DEMO_INBOX.length} da smistare</p>
          <p className="mt-auto text-[13px] text-fg-muted">Dati dimostrativi — fase 0.</p>
        </SurfaceCard>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="label text-fg-subtle">Catturato di recente</h2>
        <ul className="flex flex-col gap-2">
          {DEMO_INBOX.map((item, i) => (
            <li key={item.id}>
              <ItemRow item={item} color={(['yellow', 'green', 'purple'] as const)[i % 3]} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
