import type { ItemKind, SpaceColor } from '@noteaker/core';

/**
 * Tailwind non può generare classi da stringhe costruite a runtime
 * (`bg-${colore}` non esiste nel CSS finale, perché il compilatore legge il
 * sorgente, non lo esegue). Quindi la mappa colore → classi è esplicita.
 */
export const SPACE_BG: Record<SpaceColor, string> = {
  yellow: 'bg-yellow',
  purple: 'bg-purple',
  green: 'bg-green',
  red: 'bg-red',
  blue: 'bg-blue',
  teal: 'bg-teal',
};

export const SPACE_TEXT: Record<SpaceColor, string> = {
  yellow: 'text-yellow',
  purple: 'text-purple',
  green: 'text-green',
  red: 'text-red',
  blue: 'text-blue',
  teal: 'text-teal',
};

/** Barra verticale a sinistra delle righe di lista (docs/03 §5). */
export const SPACE_BORDER: Record<SpaceColor, string> = {
  yellow: 'bg-yellow',
  purple: 'bg-purple',
  green: 'bg-green',
  red: 'bg-red',
  blue: 'bg-blue',
  teal: 'bg-teal',
};

/** Etichetta leggibile del tipo di contenuto. Il colore non basta mai da solo. */
export const KIND_LABEL: Record<ItemKind, string> = {
  note: 'Nota',
  article: 'Articolo',
  video: 'Video',
  reel: 'Reel',
  book: 'Libro',
  course: 'Corso',
  highlight: 'Highlight',
};
