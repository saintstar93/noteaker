import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

/**
 * ROUTE HANDLER: un endpoint HTTP dentro l'app. Ci atterra il browser dopo
 * aver cliccato il magic link o completato Google. Supabase passa un `code`
 * usa-e-getta; qui lo si scambia con la sessione vera, che viene scritta nei
 * cookie httpOnly (il JavaScript della pagina non può leggerli).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  // Open redirect: si accettano solo percorsi interni, mai un URL assoluto.
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';

  if (!code || !isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?error=codice-mancante`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=scambio-fallito`);
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
