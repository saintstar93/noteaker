# 01 — Architettura: cosa abbiamo scelto e perché

Documento pensato per essere letto **anche da chi sta imparando lo sviluppo ora**.
Ogni sezione risponde a tre domande: *cos'è*, *perché questo*, *cosa abbiamo scartato*.

---

## 0. Il quadro d'insieme in una figura

```
        ┌──────────────────────────────────────────────────┐
        │  FONTI DI CATTURA                                │
        │  Chrome ext · Shortcut iOS · Bot Telegram · App  │
        └───────────────────────┬──────────────────────────┘
                                │ POST /api/capture  (token, Zod, <300ms)
                                ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  NEXT.JS su Vercel                                              │
   │  • React Server Components (rendering sul server)               │
   │  • Route API + Server Actions (scritture)                       │
   │  • Service worker (PWA, offline)                                │
   └───────────┬─────────────────────────────────┬───────────────────┘
               │ SQL diretto con RLS             │ chiamate AI
               ▼                                 ▼
   ┌───────────────────────────────┐   ┌────────────────────────────┐
   │  SUPABASE (Postgres 17)       │   │  Modelli (via AI SDK 6)    │
   │  auth · storage · RLS         │   │  Claude → riassunti, tag   │
   │  pgvector · pgmq · pg_cron    │──▶│  OpenAI → embedding        │
   │  Edge Functions (Deno)        │   │  Whisper → trascrizioni    │
   └───────────────────────────────┘   └────────────────────────────┘
```

Il punto chiave: **la cattura è sincrona e stupida, l'elaborazione è asincrona e
intelligente.** Quando salvi un reel dal telefono, il telefono aspetta solo una
scrittura su una tabella. Riassunto, tag ed embedding arrivano 20 secondi dopo,
mentre stai già facendo altro.

---

## 1. Perché una web app + PWA e non un'app nativa

**Cos'è una PWA.** Una normale web app che il browser può "installare": icona in
home screen, apertura a tutto schermo senza barra del browser, un *service
worker* (uno script che gira in background nel browser e intercetta le richieste
di rete) che permette di funzionare anche offline.

**Perché qui.** Scrivere appunti lunghi da libri e corsi si fa su schermo grande
con tastiera. Un'app iOS nativa avrebbe reso miserabile proprio l'attività
principale. E una sola codebase web, con Claude Code, si sviluppa 3-4 volte più
in fretta di una coppia app+web.

**Il prezzo da pagare, dichiarato in anticipo:** su iPhone una PWA **non può**
comparire nel menu "Condividi". WebKit non implementa la Web Share Target API
(il bug è aperto dal 2019 e a oggi non è risolto). Chi promette il contrario si
sbaglia. La soluzione vera è uno **Shortcut iOS**: gli Shortcut *possono* stare
nello share sheet, ricevono l'URL condiviso e fanno una chiamata HTTP al nostro
endpoint. Risultato identico per l'utente, 20 righe di configurazione invece di
un'app nativa da mantenere.

**Scartato:** Expo/React Native universale (doppia complessità, e il web di Expo
è il fratello povero); Tauri desktop (bellissimo, ma niente accesso da telefono);
app iOS pura (uccide la scrittura lunga).

---

## 2. Next.js 16.3 — cos'è e perché

**Cos'è un framework React "full-stack".** React da solo disegna interfacce nel
browser. Next.js aggiunge: routing (quale pagina per quale URL), esecuzione di
codice **sul server** (dove stanno le chiavi segrete e i dati), build ottimizzata,
e un modo per esporre endpoint HTTP. Con Next scrivi front-end e back-end nello
stesso progetto, nello stesso linguaggio.

**React Server Components (RSC).** Il concetto più importante da capire e il più
disorientante all'inizio. In Next.js moderno, **di default un componente gira sul
server**: interroga il database, produce HTML, e al browser arriva solo il
risultato. Nessun dato sensibile e nessuna libreria pesante viaggiano verso il
client. Un componente diventa "client" solo se scrivi `'use client'` in cima —
cosa che serve solo quando ti serve interattività (stato, eventi, animazioni).
Conseguenza pratica per noi: **le query al database si scrivono nei componenti
server**, l'editor BlockNote e i grafici sono componenti client.

**Perché la 16.3.** È la stabile di agosto 2026: Turbopack (il bundler in Rust)
stabile, React Compiler stabile — memoizza automaticamente i componenti, quindi
non serve più riempire il codice di `useMemo`/`useCallback` — Cache Components,
e soprattutto contiene le patch delle CVE di luglio 2026. Le 16.2.x sotto la
16.2.11 e le 15.5.x sotto la 15.5.21 sono vulnerabili: due SSRF, un DoS su
Server Actions e un bypass del middleware. Vedi `06-sicurezza.md`.

**Scartato:** Remix/React Router 7 (ottimo, ecosistema minore); Astro (perfetto
per siti di contenuto, non per un'app con stato pesante); SvelteKit (bello ma
meno materiale su cui Claude Code è addestrato → più errori); Vite+React "puro"
(dovresti costruirti a mano server, routing e caching).

---

## 3. Tailwind v4 + shadcn/ui — perché non una libreria di componenti classica

**Tailwind** è CSS scritto come classi di utilità (`flex gap-4 rounded-2xl`).
Sembra brutto per dieci minuti, poi ti accorgi che non devi più inventare nomi di
classi né aprire un secondo file. La **v4** ha il motore riscritto (build quasi
istantanea) e la configurazione vive dentro il CSS, in `@theme`: i nostri design
token (colori, raggi, spaziature) stanno lì, in un posto solo.

**shadcn/ui** non è una libreria che installi: è un catalogo di componenti che
**copi dentro il tuo repo**. Sono costruiti su **Radix UI**, che risolve la parte
difficile e invisibile — accessibilità da tastiera, focus trap, ARIA, screen
reader — e li lascia completamente stilabili. Siccome il codice è tuo, puoi
piegarli al design del concept senza combattere contro gli stili della libreria.
È la ragione precisa per cui li scegliamo: il design che vogliamo è molto
caratterizzato, e le librerie "chiuse" (MUI, Mantine, Chakra) si combattono.

**Motion** (ex Framer Motion) per le animazioni: transizioni di layout, entrate
delle card, drag della griglia bento. Regole di misura in `03-design-system.md`.

---

## 4. BlockNote — l'editor a blocchi

**Cos'è.** Un editor "stile Notion": ogni paragrafo, titolo, immagine, checkbox è
un **blocco** spostabile col drag, e `/` apre il menu dei comandi. Sotto c'è
ProseMirror (il motore di editing testuale più solido in circolazione, lo stesso
di Tiptap e di mezza industria).

**Perché BlockNote e non Tiptap direttamente.** Tiptap è un toolkit: ti dà i
mattoni e ti lasci costruire il menu slash, il drag handle, la selezione dei
blocchi, il menu di formattazione — sono settimane di lavoro. BlockNote ti dà
quel comportamento già finito, restando estendibile con blocchi custom, perché è
costruito *sopra* Tiptap. Noi ci aggiungeremo blocchi nostri: `video-embed` con
timestamp cliccabili, `reel-card`, `highlight` con citazione della fonte,
`book-quote` con numero di pagina.

**Come salviamo il contenuto.** Due colonne, e la ragione è importante:
- `body jsonb` — la struttura dei blocchi, è la verità per l'editor;
- `body_text text` — lo stesso contenuto appiattito in testo semplice.

Il testo piatto serve a due cose che il JSON non sa fare: la **ricerca full-text**
di Postgres e il **chunking per gli embedding**. Rigenerarlo ogni volta a query
time sarebbe lento; lo scriviamo insieme al JSON a ogni salvataggio.

**Scartato:** Plate (potentissimo, curva ripida), Lexical (Meta; ottimo ma
l'ecosistema di blocchi Notion-like è meno pronto), Novel (bello ma è un layer
sottile su Tiptap con meno controllo).

---

## 5. Supabase — il "dietro le quinte"

**Cos'è.** Un Postgres gestito con intorno le cose che servono sempre: login,
storage dei file, funzioni serverless, API auto-generate. Non è un database
proprietario: è **Postgres vero**, quindi qualunque cosa impari qui vale ovunque
e i dati si portano via con un `pg_dump`.

**Row Level Security (RLS) — il concetto da capire per primo.** Normalmente la
sicurezza sta nel back-end: il server controlla "questo utente può vedere questa
riga?". Con RLS il controllo scende **dentro il database**: scrivi una policy SQL
che dice "un utente vede solo le righe dove `user_id = auth.uid()`", e da quel
momento *nessuna* query può violarla — nemmeno una scritta male dal front-end,
nemmeno una richiesta forgiata a mano. Il browser può parlare direttamente al
database in sicurezza. È la ragione per cui Supabase permette di saltare metà del
back-end tradizionale senza perdere sicurezza.

**Auth.** Magic link via email + Google OAuth. Supabase Auth (e non Clerk o
Better Auth) perché è l'unico che si integra nativamente con RLS: `auth.uid()`
dentro le policy funziona perché il token JWT è emesso da lui. Con un provider
esterno dovresti scrivere un ponte tra i due mondi. Clerk resta l'alternativa se
un giorno servissero organizzazioni e ruoli complessi; Better Auth se un giorno
si lasciasse Supabase. Entrambi sono cambi da ADR, non decisioni da corridoio.

**Edge Functions (Deno).** Funzioni TypeScript che girano vicino all'utente sui
server di Supabase. Le usiamo per il lavoro pesante e asincrono: generare
embedding, scaricare trascrizioni, chiamare i modelli. Perché non le API di
Next.js? Perché queste devono poter essere invocate **dal database stesso** (vedi
sotto) e possono durare più a lungo dei limiti di una serverless function di
Vercel.

**Le quattro estensioni Postgres che fanno la magia:**
- `pgvector` — un tipo di colonna `vector` per gli **embedding** (vedi §7) e gli
  indici per cercarci dentro velocemente.
- `pgmq` — una **coda di messaggi dentro Postgres**. Niente Redis, niente
  servizio esterno: i job stanno in una tabella, con visibilità e retry.
- `pg_net` — permette a Postgres di fare **chiamate HTTP** in modo asincrono.
- `pg_cron` — uno **scheduler** dentro il database (`ogni 10 secondi fai X`).

Messe insieme: un `TRIGGER` sulla tabella `items` accorge che il testo è
cambiato → mette un job in coda con `pgmq` → un job `pg_cron` ogni 10 secondi
prende un batch di job e con `pg_net` chiama l'Edge Function → la funzione
calcola gli embedding e riscrive la riga. Se qualcosa fallisce, il job resta in
coda e riparte al giro dopo. È il pattern ufficiale di Supabase per gli
"automatic embeddings" e ci evita di gestire un worker separato.

---

## 6. Vercel AI SDK 6 — parlare ai modelli

**Cos'è.** Una libreria che uniforma le API dei diversi provider (Anthropic,
OpenAI, Google, Groq…). Cambi modello cambiando una riga. Ci dà tre cose che ci
servono davvero:

1. **`generateObject` con Zod** — invece di chiedere al modello un testo e
   sperare, gli imponi uno schema (`{titolo: string, tag: string[], spazio: ...}`)
   e ricevi un oggetto tipizzato e validato. Per i tag automatici e lo
   smistamento è l'unica strada seria: niente parsing di JSON malfatto.
2. **Streaming** — il riassunto compare parola per parola invece di far aspettare
   dieci secondi con uno spinner.
3. **Agenti / tool loop** — nella fase 5, l'agente del mattino potrà chiamare i
   nostri "tool" (leggi i task di oggi, leggi le abitudini, leggi il calendario)
   in autonomia prima di rispondere.

**Politica sui modelli, per il costo.** Un modello piccolo e veloce per i compiti
meccanici (tag, titoli, classificazione), un modello forte solo per riassunti e
risposte alle domande. Gli embedding con il modello più economico che regge
(`text-embedding-3-small`, 1536 dimensioni). Ogni risultato si **memorizza**: un
contenuto non viene mai riassunto due volte.

---

## 7. Ricerca: perché due motori invece di uno

**Full-text search (Postgres `tsvector`).** Cerca le *parole*. Se hai scritto
"tasso di conversione" e cerchi "conversione", lo trova. Se cerchi "quanto
convertono le landing", non trova niente. Velocissima e gratis.

**Ricerca semantica (embedding + `pgvector`).** Un **embedding** è la traduzione
di un testo in una lista di ~1536 numeri, costruita in modo che testi di
significato simile abbiano liste vicine nello spazio. Cerchi per *significato*:
"quanto convertono le landing" trova la nota su "tasso di conversione" anche
senza parole in comune. Costa (una chiamata API per ogni testo) e può essere
vaga sui termini esatti — nomi propri, codici, numeri.

**I due difetti sono complementari**, quindi si usano entrambi e si fondono i due
elenchi di risultati con **Reciprocal Rank Fusion** (un metodo semplice: ogni
risultato prende punti in base alla sua *posizione* in ciascuna classifica, non
al punteggio grezzo, che tra i due motori non è confrontabile). Formula e SQL in
`02-modello-dati.md`.

---

## 8. Chrome Extension MV3

**Manifest V3** è la piattaforma attuale delle estensioni Chrome: niente più
script persistenti in background, solo un *service worker* che si sveglia
all'evento. Per noi è banale: click sull'icona (o scorciatoia da tastiera) →
prende URL, titolo ed eventuale testo selezionato → POST al nostro endpoint con
un token salvato in `chrome.storage`. Niente permessi invasivi: `activeTab`,
`scripting`, `storage` e basta. Vive in `apps/extension`, si carica in modalità
sviluppatore, non serve pubblicarla sullo store.

---

## 9. Costi (aggiornare quando cambiano)

| Servizio | Piano di partenza | Quando serve salire |
|---|---|---|
| Vercel | Hobby (gratis) | Solo se l'app diventa pubblica |
| Supabase | Free (gratis) | Il progetto va in pausa dopo 7 giorni di inattività e il DB è limitato → Pro (~25 $/mese) quando l'app diventa quotidiana |
| Modelli AI | pay-per-use | Con uso personale realistico si sta sotto i pochi euro/mese: gli embedding costano centesimi, i riassunti sono brevi e memorizzati |
| Trascrizioni | API transcript (gratis dove disponibile) → Whisper su Groq (pochi centesimi/ora) | Solo se le trascrizioni diventano quotidiane |

Regola operativa: prima di introdurre qualunque costo ricorrente, stima il
mensile e chiedi conferma.

---

## 10. Cosa NON facciamo (per ora, e deliberatamente)

- **Collaborazione in tempo reale** sull'editor (CRDT/Yjs). Utente singolo:
  costo di complessità enorme, valore zero. BlockNote lo supporta se un giorno
  servisse.
- **Sync local-first vero** (Electric, Zero, PowerSync). Affascinante, ancora
  giovane. Facciamo offline "buono": cache di lettura + coda di scrittura.
- **App nativa**, **multi-tenant**, **billing**, **API pubblica**.
