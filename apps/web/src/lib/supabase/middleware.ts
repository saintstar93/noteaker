import type { Database } from '@noteaker/db';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, publicEnv } from '@/lib/env';

/** Rotte raggiungibili senza sessione. */
const PUBLIC_PATHS = ['/login', '/auth', '/api/capture'];

/**
 * Gira nel MIDDLEWARE, cioè su Edge runtime, prima di ogni richiesta.
 * Fa due cose: rinnova il token di sessione (altrimenti scade e l'utente
 * viene buttato fuori) e rimanda al login chi non è autenticato.
 *
 * ATTENZIONE (docs/06-sicurezza.md §3.7): questa NON è la barriera di
 * sicurezza. È comodità. Il muro portante è RLS dentro il database, perché
 * un bypass del middleware è già successo davvero (CVE-2026-64642).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Fase 0: senza chiavi Supabase l'app resta navigabile in modalità dimostrativa.
  if (!isSupabaseConfigured || !publicEnv) return response;

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser()` e non `getSession()`: il primo verifica il token col server
  // di Supabase, il secondo si fida del cookie. Qui serve la verifica vera.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
