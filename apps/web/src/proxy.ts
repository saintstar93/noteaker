import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * PROXY (in Next ≤16.2 si chiamava "middleware", il file è stato rinominato).
 * Gira su Edge runtime PRIMA di ogni richiesta che passa dal matcher qui sotto:
 * non è codice dell'app, è codice davanti all'app.
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Esclude file statici e immagini: farci girare il proxy sopra
  // sarebbe solo latenza sprecata.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
