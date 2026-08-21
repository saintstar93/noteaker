/**
 * Tipi condivisi tra web, estensione ed Edge Functions.
 * Rispecchiano lo schema in docs/02-modello-dati.md: se cambia il DB,
 * questo file cambia nello stesso commit.
 */

/** I sette tipi di contenuto. Stessa tabella `items`, campi extra in `metadata`. */
export const ITEM_KINDS = [
  'note',
  'article',
  'video',
  'reel',
  'book',
  'course',
  'highlight',
] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/** Ciclo di vita di un item: entra in inbox, l'AI lo elabora, si smista. */
export const ITEM_STATUSES = ['inbox', 'processing', 'active', 'archived'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

/** Da dove è stato catturato. Serve a capire quale canale usi davvero. */
export const CAPTURE_SOURCES = ['app', 'extension', 'ios_shortcut', 'telegram'] as const;
export type CaptureSource = (typeof CAPTURE_SOURCES)[number];

/**
 * Nomi dei colori della palette (docs/03-design-system.md §2).
 * Non sono valori esadecimali: sono chiavi verso i token CSS, così il colore
 * si cambia in un posto solo e il tema chiaro un giorno costa un blocco CSS.
 */
export const SPACE_COLORS = ['yellow', 'purple', 'green', 'red', 'blue', 'teal'] as const;
export type SpaceColor = (typeof SPACE_COLORS)[number];

export type Space = {
  id: string;
  name: string;
  color: SpaceColor;
  icon: string | null;
  position: number;
};

export type Collection = {
  id: string;
  spaceId: string;
  parentId: string | null;
  name: string;
  /** materialized path, es. 'business/ads/meta' — vedi docs/02 §3 */
  path: string;
  position: number;
};

export type Item = {
  id: string;
  kind: ItemKind;
  status: ItemStatus;
  title: string | null;
  summary: string | null;
  sourceUrl: string | null;
  sourceDomain: string | null;
  collectionId: string | null;
  isFavorite: boolean;
  capturedVia: CaptureSource | null;
  createdAt: string;
};
