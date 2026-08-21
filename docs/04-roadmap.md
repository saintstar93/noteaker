# 04 — Roadmap

Sei fasi. Ogni fase è una **fetta verticale**: alla fine di ciascuna c'è
qualcosa di deployato che si può usare davvero. Nessuna fase è "solo backend".

Daniele ha scelto di avere tutto nella v1, AI inclusa. Per non impantanarsi,
l'ordine è pensato così: **prima quello che si usa ogni giorno** (cattura e
inbox), poi quello che dà valore al materiale accumulato (editor, ricerca, AI),
poi la giornata (produttività), infine i rituali (review, agente).

Spunta le caselle man mano. Questo file è lo stato del progetto.

---

## Fase 0 — Fondamenta (obiettivo: "esiste ed è online")

- [x] Monorepo pnpm: `apps/web`, `packages/db|core|ui`, `supabase/`
- [x] Next.js 16.3.1 + TypeScript strict + Tailwind v4 + Biome
- [ ] shadcn/ui — *rimandato*: i primi componenti Radix servono davvero solo con
      la command palette e i dialog (fase 2). Finora bastano componenti nostri.
- [~] Supabase: `supabase start` locale ✅ · progetto cloud ⏳ (serve l'account di Daniele)
- [x] Auth: magic link + Google OAuth, sessione con `@supabase/ssr` — magic link
      **provato end-to-end in locale**; Google ancora no (serve un client OAuth)
- [x] Migrazione 001: `profiles`, `spaces`, `collections`, `items` + **RLS su tutto**
- [x] Test automatico che fallisce se una tabella è senza RLS (`tests/rls.test.ts`)
- [x] Design system: token in `@theme`, `AppShell` (sidebar + centro + pannello)
- [ ] Deploy su Vercel + variabili d'ambiente — `.env.example` ✅, deploy ⏳
- [x] CI su GitHub Actions: `pnpm check` + `pnpm build` a ogni push

**Fatto quando:** ti logghi in produzione dal telefono e vedi una schermata
vuota ma tua, con i colori giusti.

---

## Fase 1 — Cattura e Inbox (obiettivo: "smetto di usare Notion per salvare cose")

> Fase ripresa dopo l'anticipo di produttività e organizzazione (ADR 0003).
> L'endpoint e i token ci sono; mancano ancora i tre canali che lo chiamano.

- [x] `POST /api/capture`: token → Zod → insert → 202. Rate limit (60/min per token). 11 test.
- [x] Sistema di `capture_tokens`: creazione, visualizzazione una tantum, revoca
      (pagina **Impostazioni**, con registro delle ultime chiamate)
- [ ] Coda `pgmq` + `pg_cron` + `pg_net` + prima Edge Function (`enrich`)
- [ ] Estrazione contenuto articoli (Readability) → titolo, autore, testo, immagine
- [x] Riconoscimento kind dall'URL: youtube → `video`, instagram/tiktok → `reel`, resto → `article`
- [ ] **Estensione Chrome MV3**: salva pagina, salva selezione come highlight
- [~] **Shortcut iOS**: istruzioni scritte in `docs/shortcut-ios.md` — **mai provate
      su un iPhone vero**, serve Daniele
- [ ] **Bot Telegram**: webhook, verifica firma, link dell'account al `user_id`
- [~] Schermata **Inbox**: smistamento verso una cartella ✅ · anteprime e
      scorciatoie da tastiera ⏳

**Fatto quando:** in una settimana hai catturato 30 cose da tre dispositivi
diversi senza mai aprire l'app apposta.

---

## Fase 2 — Note, organizzazione, ricerca (obiettivo: "sostituisce Notion")

- [x] Editor **BlockNote** + salvataggio con debounce (800 ms) — tabelle, blocchi
      di codice, immagini con drag&drop, autolink, interfaccia in italiano
- [x] Doppia scrittura `body` (jsonb) / `body_text` (markdown appiattito)
- [ ] Blocchi custom: `video-embed` con timestamp, `reel-card`, `highlight`, `book-quote`
- [x] Spaces e Collections: creazione, albero, trigger sul `path` — **manca il
      drag&drop** per spostare una cartella (si può solo creare, rinominare, eliminare)
- [ ] Tag, backlink `[[...]]` con autocomplete, pannello "collegate a questa"
- [ ] **Ricerca full-text** + Command palette ⌘K
- [ ] Smart View (query salvate) e filtri per kind, tag, dominio, data
- [ ] **Export completo** in Markdown + JSON
- [ ] PWA: manifest, service worker Serwist, lettura offline

**Fatto quando:** apri Noteaker invece di Notion per prendere appunti da un corso,
e ritrovi qualcosa scritto due settimane prima in meno di dieci secondi.

---

## Fase 3 — Intelligenza (obiettivo: "l'app ricorda al posto mio")

- [ ] Astrazione provider con AI SDK 6 + tracciamento costi in `ai_runs`
- [ ] Riassunti automatici, prompt diverso per kind, in streaming
- [ ] Tag e destinazione suggeriti con `generateObject` + Zod → chip di conferma
- [ ] Chunking + embedding automatici via coda (pattern Supabase)
- [ ] **Ricerca ibrida** (RRF) che sostituisce la full-text nella palette
- [ ] **Ask your notes**: RAG con citazioni obbligatorie agli item sorgente
- [ ] Trascrizioni YouTube con timestamp cliccabili; fallback Whisper
- [ ] Pagina Impostazioni → Costi AI del mese

**Fatto quando:** fai una domanda vaga su qualcosa che hai letto mesi fa e
l'app ti riporta il paragrafo esatto, con il link alla fonte.

---

## Fase 4 — La giornata (obiettivo: "l'ente centrale")

- [x] Goal + Key Result, collegati agli Space
- [x] Habit con `rrule`, logging a un tocco, streak calcolate
- [~] Task: scheduling ✅, priorità ✅, **Kanban** ✅ (fuori roadmap, vedi ADR 0003) ·
      ricorrenze ⏳, riordino manuale dentro la colonna ⏳, task da una nota ⏳
- [x] Schermata **Today**: bento, task di oggi, abitudini di oggi, inbox, avanzamento obiettivi
- [ ] **Google Calendar**: OAuth, lettura eventi in Today, creazione evento da task
- [ ] **Import da Notion**: parsing dell'export zip → items + collections + tag

**Fatto quando:** la mattina apri Today e non hai bisogno di aprire nient'altro.

---

## Fase 5 — Rituali e agente (obiettivo: "il sistema si chiude")

- [ ] Review settimanale guidata: statistiche precompilate + domande + note
- [ ] Review mensile: avanzamento dei key result, andamento abitudini, cosa hai imparato
- [ ] Grafici di completamento (task, abitudini, catture per fonte)
- [ ] **Agente del mattino**: tool loop su task/abitudini/calendario/inbox → piano della giornata
- [ ] Digest serale opzionale (email o Telegram)
- [ ] "Riemersione": ogni settimana ripropone 3 note vecchie e rilevanti

**Fatto quando:** l'app ti dice qualcosa di utile che non le avevi chiesto.

---

## Regole per non impantanarsi

1. **Una fase alla volta, e si deploya alla fine di ognuna.** Niente branch
   lunghi settimane.
2. **Se una casella si gonfia, si divide** in due caselle, non si allarga.
3. **Se una cosa non è nella lista, va discussa prima di essere costruita.**
   Le idee nuove si scrivono in fondo a questo file, in "Idee parcheggiate".
4. **Il debito tecnico si annota**, non si nasconde: un `TODO:` nel codice e una
   riga qui sotto.

## Debito tecnico aperto

- **Dati dimostrativi** in `apps/web/src/lib/demo.ts`: Today e Inbox mostrano tre
  item finti finché non c'è il database. Da togliere in fase 1 (vedi ADR 0002).
- **`packages/db/src/database.types.ts` è generato dallo schema LOCALE**
  (`pnpm db:types`). Va rigenerato dopo ogni migrazione, nello stesso commit.
- **TypeScript pinnato alla 5.9.3** mentre la 7 è già stabile (ADR 0001).
- **`collections.path` non ha ancora il trigger** che lo aggiorna quando si sposta
  una cartella: arriva in fase 2 col drag&drop dell'albero.
- **Nessun rate limit** ancora, perché non c'è ancora un endpoint pubblico.
- **I file non si cancellano** quando cancelli la nota che li conteneva: restano
  nello storage a occupare spazio (ADR 0004). Serve una pulizia.
- **L'URL firmato delle immagini dura un'ora**: una nota lasciata aperta più a
  lungo mostra le immagini rotte finché non ricarichi.
- **Blocchi custom non ancora fatti**: `video-embed` con timestamp, `reel-card`,
  `highlight`, `book-quote` (sono una casella a parte della fase 2).
- **Kanban senza riordino manuale**: `position` esiste in tabella ma il drag
  imposta solo lo stato.
- **`useState` + `useEffect` per l'optimistic UI** in cinque componenti;
  `useOptimistic` sarebbe più corretto.
- **`revalidatePath` a tappeto** in `apps/web/src/lib/actions.ts`: rigenera più
  del necessario. Irrilevante con un utente solo.
- **`analytics` (Logflare) disattivato** in `supabase/config.toml`: in locale non
  parte in modo affidabile e non ci serve. In cloud lo fornisce Supabase.
- **Il magic link è verificato solo in locale** (invio → clic → `/auth/callback`
  → sessione → Today). Sul progetto cloud va rifatto: cambiano `site_url` e le
  `additional_redirect_urls`, ed è lì che il flusso si rompe più spesso.
- **Google OAuth non è mai stato provato**: in locale non c'è un client Google
  configurato. Si prova sul cloud.

## Idee parcheggiate

- Tema chiaro
- Grafo delle note navigabile
- Condivisione pubblica di una singola nota (link read-only)
- App Expo companion se lo Shortcut iOS si rivelasse scomodo
- Spaced repetition sugli highlight dei libri
