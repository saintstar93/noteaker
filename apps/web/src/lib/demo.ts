import type { Item, Space } from '@noteaker/core';

/**
 * DATI FINTI, solo per la Fase 0.
 * Servono a vedere il design system prima che il database esista. Spariscono
 * appena `items` è popolata davvero: nessun componente li importa direttamente,
 * li riceve come props.
 */
export const DEMO_SPACES: Space[] = [
  { id: 's1', name: 'Business', color: 'yellow', icon: null, position: 0 },
  { id: 's2', name: 'Fitness', color: 'green', icon: null, position: 1 },
  { id: 's3', name: 'Corsi', color: 'purple', icon: null, position: 2 },
  { id: 's4', name: 'Personale', color: 'blue', icon: null, position: 3 },
];

export const DEMO_INBOX: Item[] = [
  {
    id: 'i1',
    kind: 'article',
    status: 'inbox',
    title: 'Come si costruisce una landing che converte',
    summary: null,
    sourceUrl: 'https://example.com/landing',
    sourceDomain: 'example.com',
    collectionId: null,
    isFavorite: false,
    capturedVia: 'extension',
    createdAt: '2026-08-21T08:12:00Z',
  },
  {
    id: 'i2',
    kind: 'reel',
    status: 'inbox',
    title: 'Routine di mobilità per le spalle',
    summary: null,
    sourceUrl: 'https://instagram.com/reel/xyz',
    sourceDomain: 'instagram.com',
    collectionId: null,
    isFavorite: false,
    capturedVia: 'ios_shortcut',
    createdAt: '2026-08-21T07:40:00Z',
  },
  {
    id: 'i3',
    kind: 'video',
    status: 'inbox',
    title: 'Postgres full-text search spiegato bene',
    summary: null,
    sourceUrl: 'https://youtube.com/watch?v=abc',
    sourceDomain: 'youtube.com',
    collectionId: null,
    isFavorite: false,
    capturedVia: 'telegram',
    createdAt: '2026-08-20T21:05:00Z',
  },
];
