import { ItemRow } from '@/components/item-row';
import { DEMO_INBOX } from '@/lib/demo';

export default function InboxPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display font-extrabold text-[34px] tracking-[-0.02em]">Inbox</h1>
      <p className="text-[13px] text-fg-muted">
        Tutto atterra qui. Nessuna decisione al momento della cattura: si smista dopo, con la
        destinazione già proposta dall'AI (fase 3).
      </p>
      <ul className="flex flex-col gap-2">
        {DEMO_INBOX.map((item, i) => (
          <li key={item.id}>
            <ItemRow item={item} color={(['yellow', 'green', 'purple'] as const)[i % 3]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
