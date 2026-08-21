import { z } from 'zod';
import { CAPTURE_SOURCES, ITEM_KINDS, type ItemKind } from './types';

/**
 * Schema del payload di POST /api/capture (fase 1).
 * Vive qui e non in apps/web perché lo useranno anche l'estensione Chrome e
 * il bot Telegram: un solo contratto, validato allo stesso modo ovunque.
 */
export const captureInputSchema = z
  .object({
    url: z.url().max(2048).optional(),
    title: z.string().max(500).optional(),
    text: z.string().max(50_000).optional(),
    kind: z.enum(ITEM_KINDS).optional(),
    source: z.enum(CAPTURE_SOURCES).default('app'),
  })
  .refine((v) => Boolean(v.url ?? v.text), {
    message: 'Serve almeno un url o del testo.',
  });

export type CaptureInput = z.infer<typeof captureInputSchema>;

/**
 * Indovina il tipo di contenuto dall'URL, senza scaricare niente.
 * È solo un primo tentativo: l'elaborazione asincrona può correggerlo.
 */
export function guessKindFromUrl(rawUrl: string): ItemKind {
  let host: string;
  try {
    host = new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'note';
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') return 'video';
  if (host === 'instagram.com' || host === 'tiktok.com') return 'reel';
  return 'article';
}
