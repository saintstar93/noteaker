import type { Database } from '@noteaker/db';

/** Scorciatoia: `Riga<'tasks'>` invece della catena lunga di indici. */
export type Riga<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Task = Riga<'tasks'>;
export type Goal = Riga<'goals'>;
export type KeyResult = Riga<'key_results'>;
export type Habit = Riga<'habits'>;
export type HabitLog = Riga<'habit_logs'>;
export type SpaceRow = Riga<'spaces'>;
export type CollectionRow = Riga<'collections'>;
export type ItemRow = Riga<'items'>;

export const STATI_TASK = ['todo', 'doing', 'done'] as const;
export type StatoTask = (typeof STATI_TASK)[number];

/** Le colonne del Kanban, in ordine. */
export const COLONNE_KANBAN: { stato: StatoTask; titolo: string }[] = [
  { stato: 'todo', titolo: 'Da fare' },
  { stato: 'doing', titolo: 'In corso' },
  { stato: 'done', titolo: 'Fatto' },
];

export const ETICHETTA_PRIORITA: Record<number, string> = {
  1: 'Alta',
  2: 'Media',
  3: 'Bassa',
};
