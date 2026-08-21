import {
  captureInputSchema,
  guessKindFromUrl,
  impronta,
  leggiToken,
  sembraUnToken,
} from '@noteaker/core';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/capture — l'unica porta dell'app aperta su internet senza login.
 *
 * Chi la chiama: l'estensione Chrome, lo Shortcut dell'iPhone, il bot Telegram
 * e il campo "incolla link" dentro l'app. Tutti mandano la stessa cosa allo
 * stesso posto (CLAUDE.md §5.1).
 *
 * Fa TRE cose e basta, e deve rispondere in meno di 300 ms:
 *   1. autentica il token,
 *   2. valida il corpo con Zod,
 *   3. scrive una riga in `items` con status 'inbox'.
 *
 * Tutto il resto — scaricare la pagina, trascrivere, riassumere, taggare,
 * calcolare gli embedding — è asincrono e non è affar suo. **La cattura non
 * deve mai aspettare l'AI**: quando salvi un reel dal telefono, il telefono
 * aspetta una sola scrittura su una tabella.
 *
 * ⚠️ Questo è l'unico punto dell'app che usa la chiave `service_role`, che
 * salta RLS. Il `user_id` non arriva da `auth.uid()`: lo ricaviamo dal token e
 * lo scriviamo a mano. Quindi qui la sicurezza NON la garantisce il database,
 * la garantisce questo file — ed è per questo che è coperto da test.
 */

/** Limite: 60 richieste al minuto per token (docs/06-sicurezza.md §3.4). */
const RICHIESTE_AL_MINUTO = 60;

/** Un corpo più grande di così non è una cattura, è un attacco. */
const CORPO_MASSIMO_BYTE = 100_000;

function risposta(stato: number, corpo: Record<string, unknown>) {
  return NextResponse.json(corpo, {
    status: stato,
    headers: { 'cache-control': 'no-store' },
  });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();

  // ---- 1. Il token -----------------------------------------------------
  const token = leggiToken(request.headers);

  // Si controlla la FORMA prima di interrogare il database: così una raffica
  // di spazzatura da un bot non si trasforma in una raffica di query.
  if (!token || !sembraUnToken(token)) {
    return risposta(401, { errore: 'Token mancante o malformato.' });
  }

  // Si cerca per impronta, mai per token in chiaro: in database il token non
  // c'è. Il confronto lo fa Postgres sull'indice, in tempo costante rispetto
  // al contenuto.
  const { data: riga } = await supabase
    .from('capture_tokens')
    .select('id, user_id, revoked_at')
    .eq('token_hash', await impronta(token))
    .maybeSingle();

  // Stesso messaggio per "non esiste" e "revocato": a chi bussa non si dice
  // se ha indovinato metà della serratura.
  if (!riga || riga.revoked_at) {
    return risposta(401, { errore: 'Token non valido.' });
  }

  // ---- 2. Rate limit ---------------------------------------------------
  // Il conteggio sta in Postgres e non in memoria perché l'app gira su
  // funzioni serverless: nascono e muoiono a ogni richiesta e non
  // condividono niente fra loro. Un contatore in una variabile non
  // limiterebbe proprio nulla.
  const unMinutoFa = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from('capture_events')
    .select('id', { count: 'exact', head: true })
    .eq('token_id', riga.id)
    .gte('created_at', unMinutoFa);

  if ((count ?? 0) >= RICHIESTE_AL_MINUTO) {
    await registra(supabase, riga, 429, null);
    return NextResponse.json(
      { errore: 'Troppe richieste. Riprova fra un minuto.' },
      { status: 429, headers: { 'retry-after': '60', 'cache-control': 'no-store' } },
    );
  }

  // ---- 3. Il corpo -----------------------------------------------------
  const grezzo = await request.text();
  if (grezzo.length > CORPO_MASSIMO_BYTE) {
    await registra(supabase, riga, 413, null);
    return risposta(413, { errore: 'Contenuto troppo grande.' });
  }

  let json: unknown;
  try {
    json = JSON.parse(grezzo);
  } catch {
    await registra(supabase, riga, 400, null);
    return risposta(400, { errore: 'JSON non valido.' });
  }

  const validato = captureInputSchema.safeParse(json);
  if (!validato.success) {
    await registra(supabase, riga, 400, null);
    return risposta(400, {
      errore: 'Dati non validi.',
      dettagli: validato.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  const dati = validato.data;

  // ---- 4. La scrittura -------------------------------------------------
  const { data: item, error } = await supabase
    .from('items')
    .insert({
      // Il punto delicato di tutto il file: `user_id` viene dal TOKEN, mai
      // dal corpo della richiesta. Se lo prendessimo dal payload, chiunque
      // avesse un token qualsiasi potrebbe scrivere nelle note di chiunque.
      user_id: riga.user_id,
      kind: dati.kind ?? (dati.url ? guessKindFromUrl(dati.url) : 'note'),
      status: 'inbox',
      title: dati.title ?? null,
      body_text: dati.text ?? null,
      source_url: dati.url ?? null,
      captured_via: dati.source,
    })
    .select('id')
    .single();

  if (error) {
    await registra(supabase, riga, 500, dati.source);
    return risposta(500, { errore: 'Salvataggio fallito.' });
  }

  await supabase
    .from('capture_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', riga.id);

  await registra(supabase, riga, 202, dati.source);

  // 202 "Accepted" e non 201 "Created": la riga esiste, ma l'elaborazione
  // vera (riassunto, tag, embedding) deve ancora cominciare. Il codice dice
  // la verità su cosa è successo.
  return risposta(202, { id: item.id, stato: 'inbox' });
}

/** Registro di ogni chiamata: serve al rate limit e ad accorgersi degli abusi. */
async function registra(
  supabase: ReturnType<typeof createAdminClient>,
  riga: { id: string; user_id: string },
  status: number,
  source: string | null,
) {
  await supabase
    .from('capture_events')
    .insert({ token_id: riga.id, user_id: riga.user_id, status, source });
}

/** Una GET su questo indirizzo è quasi sempre un bot che cerca porte aperte. */
export function GET() {
  return risposta(405, { errore: 'Usa POST.' });
}
