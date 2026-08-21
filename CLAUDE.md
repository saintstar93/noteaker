# CLAUDE.md — Noteaker

> Questo file viene caricato all'inizio di **ogni** sessione di Claude Code.
> Deve restare corto e ad alta densità. I dettagli stanno in `docs/`, che leggi
> **solo quando ti servono** per il task corrente.

---

## 1. Cos'è Noteaker

Il **sistema operativo personale di Daniele**: un unico posto dove finiscono le
informazioni che raccoglie (articoli web, reel Instagram/TikTok, video YouTube,
libri, corsi) e da cui gestisce la sua giornata (obiettivi → abitudini → task).

Sostituisce Notion. Deve essere **più veloce di Notion nella cattura** e
**più intelligente di Notion nel recupero**. Se una funzione non serve a uno di
questi due scopi, non entra nella v1.

Utente: **una persona sola** (Daniele). L'architettura però è multi-utente
fin dal primo giorno (RLS su ogni tabella, nessun dato globale) perché
l'app potrebbe essere aperta ad altri. Non costruire billing, team, inviti,
onboarding multi-tenant: solo *non precludere* quella strada.

---

## 2. Come devi lavorare con me (regole non negoziabili)

Daniele è **Marketing Manager, non sviluppatore di professione**. Sa leggere il
codice, ha già pubblicato un'app (React Native/Expo + Supabase), lavora con
Python e SQL, ma **sta imparando lo sviluppo ora**. L'obiettivo di questo
progetto è duplice: avere l'app **e** capire come funziona.

1. **Parla italiano.** Sempre, anche nei commenti del codice e nei messaggi di
   commit. Il codice (nomi di variabili, funzioni, tabelle) resta in inglese.
2. **Spiega prima di fare, non dopo.** Prima di ogni blocco di lavoro non
   banale: cosa stai per fare, perché quella scelta e non l'alternativa, cosa
   succederebbe se sbagliassimo. 5-10 righe, non un saggio.
3. **Niente gergo non spiegato.** La prima volta che usi un termine tecnico in
   una sessione, spiegalo in una riga e, se è strutturale, aggiungilo a
   `docs/05-glossario.md`.
4. **Spiega anche "cosa gira dietro".** Quando tocchi qualcosa che l'utente non
   vede (una policy RLS, un trigger, un service worker, un edge runtime), dedica
   un paragrafo a *dove* gira quel codice, *quando* viene eseguito e *chi* lo
   invoca. È la parte che Daniele vuole imparare.
5. **Procedi in autonomia sull'implementazione**, ma **fermati e chiedi** prima
   di: cambiare stack o aggiungere una dipendenza pesante, modificare lo schema
   del DB in modo distruttivo, toccare autenticazione o policy di sicurezza,
   spendere soldi (upgrade di piano, nuovo servizio a pagamento).
6. **Una fetta verticale per volta.** Mai "prima tutto il backend, poi tutto il
   frontend". Ogni pezzo di lavoro arriva fino allo schermo e si può usare.
7. **Ogni decisione architetturale finisce in un ADR** (`docs/adr/`), formato in
   `docs/adr/README.md`. Un ADR è mezza pagina, non un documento.
8. **Non inventare API.** Se non sei sicuro della firma di una libreria o della
   sintassi di una versione, leggi la documentazione (WebFetch) prima di
   scrivere. Meglio una ricerca in più che un'ora di debug.
9. **Se una cosa non funziona, dillo.** Niente "dovrebbe funzionare". Se non hai
   verificato, scrivi esplicitamente che non hai verificato.

---

## 3. Stack (fissato — non cambiarlo senza ADR)

| Livello | Scelta | Versione minima |
|---|---|---|
| Framework | **Next.js** App Router + Turbopack + React Compiler | **≥ 16.3** (vedi §7 sicurezza) |
| UI | React 19.2, **TypeScript strict**, **Tailwind CSS v4**, **shadcn/ui** (Radix) | — |
| Animazioni | **Motion** (ex framer-motion) | 12+ |
| Editor note | **BlockNote** (Notion-like, su ProseMirror/Tiptap) | 0.3x+ |
| Dati server | **Supabase**: Postgres 17, Auth, Storage, RLS, Edge Functions (Deno) | — |
| Vettori/coda | `pgvector`, `pgmq`, `pg_cron`, `pg_net` | — |
| Data fetching | **TanStack Query v5** + `@supabase/ssr` | — |
| Stato UI | **Zustand** (solo stato effimero, mai dati del server) | — |
| AI | **Vercel AI SDK 6** con provider astratto (Claude per testo, OpenAI per embedding) | — |
| Validazione | **Zod** su ogni confine (form, API, output AI) | — |
| Qualità | **Biome** (lint+format), **Vitest**, **Playwright** (solo flussi critici) | — |
| PWA | **Serwist** (service worker per Next.js) | — |
| Hosting | **Vercel** (web + API) + **Supabase** (dati) | — |

Il perché di ogni riga, con le alternative scartate, è in
`docs/01-architettura.md`. **Leggilo prima di proporre un cambio di stack.**

---

## 4. Struttura del repo (monorepo leggero)

```
noteaker/
├── CLAUDE.md              ← questo file
├── docs/                  ← contesto lungo, letto su richiesta
│   ├── 00-come-iniziare.md     guida operativa per Daniele (non per te)
│   ├── 01-architettura.md      stack, perché, alternative scartate
│   ├── 02-modello-dati.md      schema Postgres, RLS, ricerca ibrida
│   ├── 03-design-system.md     token, palette, componenti, motion
│   ├── 04-roadmap.md           fasi, fette verticali, definition of done
│   ├── 05-glossario.md         termini tecnici spiegati da zero
│   ├── 06-sicurezza.md         modello di minaccia e checklist
│   └── adr/                    una decisione = un file
├── apps/
│   ├── web/               Next.js (l'app vera e propria)
│   └── extension/         estensione Chrome MV3 per la cattura
├── packages/
│   ├── db/                migrazioni SQL + tipi generati da Supabase
│   ├── core/              logica pura condivisa (parsing, ranking, rrule)
│   └── ui/                componenti shadcn condivisi
└── supabase/
    ├── migrations/        SQL versionato (mai modifiche a mano in dashboard)
    └── functions/         Edge Functions Deno (embedding, trascrizioni)
```

**Regola d'oro sul database:** ogni modifica allo schema è una **migrazione SQL
versionata** in `supabase/migrations/`. Non si tocca lo schema dalla dashboard di
Supabase. Se lo schema cambia, rigenera i tipi TypeScript nello stesso commit.

---

## 5. I quattro moduli

### 5.1 Capture — "zero attrito"
Tutte le fonti convergono su **un solo endpoint**: `POST /api/capture`.
Chi lo chiama:
- **Estensione Chrome MV3** — salva la pagina, o il testo selezionato come highlight.
- **Shortcut iOS** — l'iPhone non permette a una PWA di comparire nello share
  sheet (WebKit non implementa la Web Share Target API). La soluzione corretta e
  affidabile è uno **Shortcut** "Salva su Noteaker" che appare nello share sheet
  e fa una POST all'endpoint. Non perdere tempo a cercare workaround PWA.
- **Bot Telegram** — webhook → stesso endpoint. È il canale più veloce in assoluto.
- **Campo "incolla link"** dentro l'app.

L'endpoint fa **solo tre cose** e risponde in <300 ms: autentica il token,
valida con Zod, scrive una riga in `items` con `status='inbox'`. Tutto il resto
(fetch della pagina, trascrizione, riassunto, tag, embedding) è **asincrono**,
gestito dalla coda `pgmq`. La cattura non deve **mai** aspettare l'AI.

### 5.2 Knowledge — "fluido, innovativo, facile"
Daniele non ha scelto un metodo di organizzazione, ha chiesto il modo più fluido.
Il modello è **inbox-first con smistamento assistito**:

- Tutto atterra in **Inbox**. Nessuna decisione al momento della cattura.
- Gerarchia: **Space** (macro-area: Business, Fitness, Corsi…) → **Collection**
  (cartelle nidificabili) → **Item**.
- Ogni item ha **tag** trasversali e **backlink** `[[wikilink]]` verso altri item.
- Quando l'AI ha finito di processare un item, **propone** destinazione + tag +
  titolo: l'utente conferma con un tasto. È qui che sta il "fluido": non decidi
  dove va, **confermi** dove l'AI l'ha messo.
- **Smart View**: query salvate (es. "reel non ancora rivisti", "highlight di
  questo mese"). Sostituiscono le cartelle manuali per i tagli trasversali.
- Tipi di item (`kind`): `note`, `article`, `video`, `reel`, `book`, `course`,
  `highlight`. Stessa tabella, campi specifici in `metadata` jsonb.

### 5.3 Productivity — "l'ente centrale della giornata"
Catena esplicita: **Goal** (trimestrale/annuale, con key result misurabili) →
**Habit** (ricorrente, con streak) → **Task** (giornaliero, collegabile a un goal
o a un item). Schermata principale = **Today**: le 3-5 cose che contano, le
abitudini di oggi, gli eventi da Google Calendar, l'inbox da smistare.
Sopra tutto: **Review** settimanale e mensile guidata (cosa è stato completato,
cosa è slittato, cosa hai imparato — con i dati precompilati dall'app).

### 5.4 Intelligence — "ricordare per te"
- **Riassunto automatico** di ogni item catturato (Claude, prompt diverso per kind).
- **Trascrizione** video YouTube (transcript API, fallback Whisper) con timestamp
  cliccabili.
- **Tag e destinazione suggeriti** (structured output con Zod, mai testo libero).
- **Ricerca ibrida**: full-text Postgres (`tsvector`, config `italian`) +
  semantica (`pgvector`, HNSW), fuse con Reciprocal Rank Fusion. Vedi `docs/02`.
- **Ask your notes**: domanda in linguaggio naturale → RAG sui chunk → risposta
  **sempre con citazioni** agli item sorgente. Se non trova nulla, dice che non
  trova nulla; non inventa.
- **Agente del mattino** (fase 5): prepara il piano della giornata dai dati.

---

## 6. Vincoli di prodotto

- **Costi:** ottimizza per stare sul free tier finché possibile. Prima di
  introdurre qualcosa che costa, calcola il costo mensile stimato e chiedi.
  Modelli AI: sempre il più economico che regge il compito; batch dove possibile;
  cache dei riassunti (mai rigenerare due volte lo stesso contenuto).
- **Performance percepita:** cattura <300 ms, apertura di una nota <100 ms,
  ricerca <500 ms. Optimistic UI ovunque si scrive.
- **Offline:** lettura delle note già viste e scrittura in coda devono funzionare
  senza rete (service worker + IndexedDB). Il sync riparte da solo.
- **I dati sono di Daniele:** export completo in Markdown + JSON deve esistere
  dalla fase 2. Nessun lock-in, mai.

---

## 7. Sicurezza (leggi `docs/06-sicurezza.md` prima di toccare auth o API)

Le cinque regole che non si violano mai:

1. **Next.js ≥ 16.3.** Le versioni precedenti hanno CVE ad alta severità di
   luglio 2026 su Server Actions (DoS, SSRF) e bypass del middleware. Se lo
   aggiorni, verifica sempre la pagina delle security release.
2. **RLS attiva su ogni tabella, deny by default.** Nessuna tabella senza policy.
   Ogni riga ha `user_id` con default `auth.uid()`.
3. **`service_role` key solo lato server**, mai in un componente client, mai
   nell'estensione, mai nelle variabili `NEXT_PUBLIC_*`.
4. **Zod su ogni input**, comprese le risposte dei modelli AI e i payload dei
   webhook. Rate limit su `/api/capture` e sul webhook Telegram.
5. **Token di cattura hashati** in DB (mai in chiaro), revocabili, uno per fonte
   (estensione, shortcut, bot) così si può revocarne uno senza rompere gli altri.

---

## 8. Comandi

```bash
pnpm dev              # Next.js in locale (Turbopack)
pnpm build            # build di produzione — deve passare prima di ogni push
pnpm check            # Biome lint + format + typecheck
pnpm test             # Vitest (unit)
pnpm test:e2e         # Playwright (flussi critici)
supabase start        # stack Supabase locale (Docker)
supabase db reset     # riapplica tutte le migrazioni da zero
supabase db diff -f <nome>   # genera una nuova migrazione dalle modifiche locali
pnpm db:types         # rigenera i tipi TypeScript dallo schema
```

## 9. Definition of Done

Un pezzo di lavoro è finito quando: `pnpm check` e `pnpm build` passano; c'è RLS
sulle tabelle nuove; gli errori sono gestiti e visibili all'utente (niente
schermate bianche); gli stati vuoti e di caricamento esistono; funziona su
schermo largo **e** su iPhone; i documenti in `docs/` sono aggiornati se hai
cambiato architettura, schema o design.

## 10. Stato attuale

**Fase 0 — non ancora iniziata.** Il repo contiene solo documentazione.
Il piano di lavoro, fase per fase, è in `docs/04-roadmap.md`: leggilo e parti
dalla prima casella non spuntata.
