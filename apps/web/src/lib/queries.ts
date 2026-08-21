import { toDateKey } from '@noteaker/core';
import { requireUser } from '@/lib/auth';
import type { CollectionRow, Goal, Habit, ItemRow, SpaceRow, Task } from '@/lib/types';

/**
 * Tutte le letture stanno qui, e girano SOLO sul server (le chiamano i
 * componenti server). Nessuna di queste funzioni filtra per `user_id`:
 * non serve, ci pensa RLS dentro Postgres. Se un giorno una di queste query
 * finisse per sbaglio in un componente client, restituirebbe comunque solo
 * le righe di chi è loggato.
 */

export async function getSpaces(): Promise<SpaceRow[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from('spaces').select('*').order('position');
  return data ?? [];
}

export async function getSpace(id: string): Promise<SpaceRow | null> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from('spaces').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function getCollections(spaceId: string): Promise<CollectionRow[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('collections')
    .select('*')
    .eq('space_id', spaceId)
    .order('path');
  return data ?? [];
}

/**
 * Tutte le cartelle di tutti gli space, con il nome dello space accanto.
 * Serve alla tendina di smistamento dell'Inbox: lì devi poter mandare un item
 * ovunque, non solo dentro lo space che stai guardando.
 */
export async function getTutteLeCollections() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('collections')
    .select('id, name, path, space_id, spaces(name, color)')
    .order('path');
  return data ?? [];
}

export async function getCollection(id: string): Promise<CollectionRow | null> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from('collections').select('*').eq('id', id).maybeSingle();
  return data;
}

/**
 * Gli item di una cartella e di tutte le sue discendenti.
 * È qui che il materialized path si ripaga: un `like 'corsi/ads/%'` invece
 * di una query ricorsiva sull'albero.
 */
export async function getItemsInCollectionTree(collection: CollectionRow): Promise<ItemRow[]> {
  const { supabase } = await requireUser();

  const { data: discendenti } = await supabase
    .from('collections')
    .select('id')
    .like('path', `${collection.path}/%`);

  const ids = [collection.id, ...(discendenti ?? []).map((c) => c.id)];

  const { data } = await supabase
    .from('items')
    .select('*')
    .in('collection_id', ids)
    .order('created_at', { ascending: false });

  return data ?? [];
}

export async function getInbox(): Promise<ItemRow[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'inbox')
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getItem(id: string): Promise<ItemRow | null> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from('items').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function getGoals(): Promise<Goal[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('goals')
    .select('*')
    .neq('status', 'dropped')
    .order('position');
  return data ?? [];
}

export async function getGoalsConKeyResults() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('goals')
    .select('*, key_results(*)')
    .neq('status', 'dropped')
    .order('position');
  return data ?? [];
}

export async function getTasks(): Promise<Task[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'dropped')
    .order('position')
    .order('created_at');
  return data ?? [];
}

/**
 * Le cose di oggi: quelle programmate per oggi o prima (le arretrate non
 * spariscono), più quelle scadute. Le già fatte oggi restano visibili: vedere
 * cosa hai chiuso è metà del valore di una schermata come questa.
 */
export async function getTaskDiOggi(): Promise<Task[]> {
  const { supabase } = await requireUser();
  const oggi = toDateKey(new Date());

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .neq('status', 'dropped')
    .or(`scheduled_for.lte.${oggi},due_on.lte.${oggi}`)
    .order('status')
    .order('priority')
    .order('position');

  return data ?? [];
}

export async function getHabits(): Promise<Habit[]> {
  const { supabase } = await requireUser();
  const { data } = await supabase.from('habits').select('*').eq('active', true).order('position');
  return data ?? [];
}

/**
 * I log delle abitudini degli ultimi `giorni` giorni, raggruppati per
 * abitudine. Servono per calcolare streak e percentuali: il calcolo lo fa
 * `packages/core`, qui si portano solo i dati.
 */
export async function getHabitLogs(giorni = 120): Promise<Map<string, Set<string>>> {
  const { supabase } = await requireUser();
  const da = new Date();
  da.setDate(da.getDate() - giorni);

  const { data } = await supabase
    .from('habit_logs')
    .select('habit_id, done_on')
    .gte('done_on', toDateKey(da));

  const perAbitudine = new Map<string, Set<string>>();
  for (const log of data ?? []) {
    const insieme = perAbitudine.get(log.habit_id) ?? new Set<string>();
    insieme.add(log.done_on);
    perAbitudine.set(log.habit_id, insieme);
  }
  return perAbitudine;
}

export async function contaInbox(): Promise<number> {
  const { supabase } = await requireUser();
  const { count } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'inbox');
  return count ?? 0;
}

export async function getCaptureTokens() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('capture_tokens')
    .select('*')
    .order('created_at', { ascending: false });
  return data ?? [];
}

/** Le ultime catture, per vedere se un canale funziona davvero. */
export async function getCaptureEvents(limite = 20) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from('capture_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite);
  return data ?? [];
}
