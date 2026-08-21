import { EmptyState } from '@/components/empty-state';

export default function LibraryPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display font-extrabold text-[34px] tracking-[-0.02em]">Library</h1>
      <EmptyState
        title="Ancora niente di archiviato"
        description="Spaces, collection ad albero e note con l'editor a blocchi arrivano nella fase 2."
      />
    </div>
  );
}
