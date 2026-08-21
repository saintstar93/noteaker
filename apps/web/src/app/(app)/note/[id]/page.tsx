import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getCollection, getItem } from '@/lib/queries';
import { EditorNota } from './editor-nota';

export const dynamic = 'force-dynamic';

export default async function NotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();

  const item = await getItem(id);
  if (!item) notFound();

  // "Indietro" deve riportare alla cartella da cui sei arrivato, non a una
  // pagina generica: è la differenza fra un'app e un sito.
  const collection = item.collection_id ? await getCollection(item.collection_id) : null;
  const tornaA = (
    collection ? `/spaces/${collection.space_id}?c=${collection.id}` : '/inbox'
  ) as Route;

  return <EditorNota item={item} userId={user.id} tornaA={tornaA} />;
}
