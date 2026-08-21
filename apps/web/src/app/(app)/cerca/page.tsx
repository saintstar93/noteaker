import { EmptyState } from '@/components/empty-state';

export default function CercaPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display font-extrabold text-[34px] tracking-[-0.02em]">Cerca</h1>
      <EmptyState
        title="La ricerca non è ancora accesa"
        description="Prima full-text di Postgres (fase 2), poi ibrida con gli embedding fusi in RRF (fase 3). Vivrà dentro la command palette ⌘K."
      />
    </div>
  );
}
