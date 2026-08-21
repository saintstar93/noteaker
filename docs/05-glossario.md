# 05 — Glossario

Ogni termine tecnico che compare nel progetto, spiegato senza dare per scontato
niente. Ordine: dal generale al particolare, non alfabetico — si legge una volta
dall'inizio e poi si consulta.

**Regola per Claude:** quando introduci un termine nuovo e strutturale, aggiungilo
qui nello stesso commit.

---

## Le fondamenta

**Client / Server.** Il *client* è il browser sul dispositivo di chi usa l'app:
tutto quello che gira lì è ispezionabile da chiunque, quindi non ci vanno segreti.
Il *server* è la macchina remota: lì stanno le chiavi e i dati. Metà delle
decisioni di sicurezza si riducono a "questa cosa gira sul client o sul server?".

**Front-end / Back-end.** Front-end = ciò che si vede. Back-end = ciò che
calcola e conserva. Con Next.js li scrivi nello stesso progetto, il che è comodo
e pericoloso insieme: bisogna sapere sempre da che parte del confine si è.

**API / Endpoint.** Un *endpoint* è un indirizzo che accetta richieste HTTP e
risponde (`POST /api/capture`). L'insieme degli endpoint è l'*API*.

**HTTP: GET / POST / status code.** `GET` chiede dati, `POST` ne manda. La
risposta ha un numero: 200 ok, 202 "preso in carico, lo faccio dopo", 401 non
autenticato, 403 autenticato ma non autorizzato, 429 troppe richieste, 500 errore
del server.

**JSON.** Il formato con cui i sistemi si scambiano dati strutturati. `jsonb` è
la versione binaria e indicizzabile che usa Postgres.

**Sincrono / Asincrono.** Sincrono = aspetti la risposta. Asincrono = registri la
richiesta e vai avanti, il lavoro si fa dopo. Tutta la nostra pipeline AI è
asincrona: è la ragione per cui salvare un reel è istantaneo.

---

## Il web moderno

**SPA (Single Page Application).** App in cui il browser scarica un programma
JavaScript che poi ridisegna le pagine senza mai ricaricare. Veloce dopo il primo
caricamento, lenta al primo.

**SSR (Server-Side Rendering).** L'HTML viene generato sul server e arriva già
pronto. Prima schermata veloce, buono per SEO.

**RSC (React Server Components).** L'evoluzione: singoli *componenti* girano solo
sul server. Possono interrogare il database direttamente e il loro codice non
viene mai spedito al browser. In Next.js sono il default; `'use client'` in cima
al file trasforma un componente in "client".

**Server Action.** Una funzione che scrivi in un file React ma che **esegue sul
server**: React genera dietro le quinte l'endpoint HTTP. Comodissimo per i form.
Attenzione: è una porta aperta verso il server, quindi va sempre autenticata e
validata come un endpoint qualsiasi.

**Route Handler.** Un endpoint HTTP dentro l'app Next: un file `route.ts` in una
cartella di `app/`, che esporta `GET`, `POST`… La differenza con una Server
Action: la Route Handler ha un URL pubblico e la chiama chiunque (un webhook,
l'estensione Chrome), la Server Action la chiama solo la tua interfaccia.

**Route group.** Una cartella con il nome tra parentesi, es. `app/(app)/`. Serve
solo a raggruppare pagine sotto un layout comune: **non** aggiunge un pezzo
all'URL. `app/(app)/inbox/page.tsx` risponde a `/inbox`, non a `/app/inbox`.

**Proxy (fino a Next 16.2 si chiamava *middleware*).** Codice che gira **prima**
di ogni richiesta, su Edge runtime: sta davanti all'app, non dentro. Noi lo usiamo
per rinnovare la sessione e rimandare al login. Non è una barriera di sicurezza:
quella è RLS, dentro il database.

**Bundler / Turbopack.** Il programma che impacchetta decine di file sorgente in
pochi file ottimizzati per il browser. Turbopack è quello di Next.js, scritto in
Rust, molto più veloce del precedente (Webpack).

**Hydration.** Il momento in cui l'HTML arrivato dal server "si accende" nel
browser e diventa interattivo.

**PWA (Progressive Web App).** Una web app installabile come un'app: icona,
schermo intero, funzionamento offline.

**Service worker.** Uno script che gira in background nel browser, tra la pagina
e la rete. Può servire contenuti dalla cache quando non c'è connessione. È il
motore dell'offline della PWA.

**IndexedDB.** Il database dentro al browser. Ci mettiamo la cache delle note e
la coda delle scritture fatte offline.

**Manifest V3 (MV3).** Lo standard attuale delle estensioni Chrome. Niente più
processi in background sempre attivi: solo un service worker che si sveglia sugli
eventi.

---

## Dati e database

**Postgres.** Il database relazionale che usiamo. Dati in tabelle, si interroga
in SQL. È il motore che sta sotto Supabase.

**Migrazione.** Un file SQL numerato che descrive un cambiamento allo schema
(crea tabella, aggiungi colonna). Applicandoli in ordine da zero si ricostruisce
il database identico. È il "git del database": senza, dopo tre mesi nessuno sa
più com'è fatto lo schema.

**Chiave primaria / esterna.** La primaria identifica una riga (`id`). L'esterna
punta alla riga di un'altra tabella (`collection_id` → `collections.id`).

**Indice.** Una struttura che rende veloce la ricerca su una colonna, al costo di
un po' di spazio e di scritture leggermente più lente. `GIN` per il testo e il
JSON, `HNSW` per i vettori.

**Colonna generata (`generated always as ... stored`).** Una colonna che Postgres
calcola da sola a partire dalle altre. Non può disallinearsi, perché non la
scrive nessuno a mano.

**Trigger.** Codice che il database esegue automaticamente quando succede
qualcosa (dopo un `INSERT`, prima di un `UPDATE`). Noi lo usiamo per mettere in
coda i job di embedding.

**`GRANT` / ruolo.** Il permesso *sull'oggetto*: dice quali ruoli (`anon`,
`authenticated`, `service_role`) possono leggere o scrivere una tabella. Viene
prima di RLS, che invece filtra *le righe*. Servono tutti e due: senza `GRANT`
il database rifiuta la richiesta ancora prima di guardare le policy.

**RLS (Row Level Security).** Regole di accesso scritte **dentro** il database:
"un utente vede solo le righe con il suo `user_id`". Nessuna query può aggirarle.
È ciò che permette al browser di parlare direttamente al database senza rischi.

**`auth.uid()`.** Funzione di Supabase che, dentro una policy, restituisce l'id
dell'utente che sta facendo la richiesta, letto dal suo token.

**JWT.** Il "biglietto" firmato che il client mostra a ogni richiesta per
dimostrare chi è. Contiene l'id utente e una scadenza.

**`anon key` / `service_role key`.** La prima è pubblica e soggetta a RLS: può
stare nel browser. La seconda **bypassa RLS** ed è onnipotente: solo lato server,
mai in un file che finisce nel browser.

**Bucket / Storage.** Il posto dove finiscono i file (immagini, allegati). In
Supabase i byte stanno su disco ma i **metadati stanno in una tabella Postgres**
(`storage.objects`): quindi i permessi sui file si scrivono con RLS, esattamente
come quelli sulle righe. Un bucket *pubblico* è leggibile da chiunque conosca
l'URL; il nostro è privato.

**URL firmato.** Un indirizzo temporaneo che contiene una firma crittografica e
una scadenza. Serve a dare accesso a un file privato senza renderlo pubblico:
vale un'ora, poi non funziona più. Per questo nella nota salviamo il *percorso*
del file, non l'URL — altrimenti la nota si romperebbe da sola (ADR 0004).

**Edge Function.** Una funzione TypeScript che gira sui server di Supabase (in
Deno), vicino all'utente. La usiamo per il lavoro pesante e per il codice che
deve essere invocabile dal database.

**pgmq / pg_cron / pg_net.** Estensioni di Postgres: una coda di messaggi, uno
scheduler, e la capacità di fare chiamate HTTP. Insieme sostituiscono un server
worker separato.

---

## AI

**LLM (Large Language Model).** Il modello che genera testo (Claude, GPT). Non
"sa" cose: predice testo plausibile. Per questo gli diamo sempre il contesto e
gli chiediamo le citazioni.

**Token.** L'unità con cui i modelli contano il testo (~4 caratteri). Si paga a
token, in ingresso e in uscita.

**Prompt / System prompt.** Le istruzioni che dai al modello. Il *system prompt*
è quello fisso che definisce il ruolo e le regole.

**Structured output.** Costringere il modello a rispondere con un oggetto che
rispetta uno schema (per noi: Zod). Elimina il parsing fragile del testo libero.

**Embedding.** La traduzione di un testo in una lista di numeri (un *vettore*)
tale che testi di significato simile abbiano vettori vicini. È ciò che permette
di cercare per significato invece che per parole.

**Distanza coseno (`<=>` in pgvector).** Il modo in cui si misura quanto due
vettori "puntano nella stessa direzione". Più il numero è piccolo, più i testi si
somigliano.

**Chunk.** Il pezzo di testo (500-800 token) in cui si spezza un documento lungo
prima di calcolarne l'embedding, così la ricerca restituisce il paragrafo giusto
e non l'intero documento.

**RAG (Retrieval-Augmented Generation).** Il metodo: prima **cerchi** i pezzi
rilevanti nei tuoi dati, poi li **passi** al modello chiedendogli di rispondere
solo su quelli. È come si fa un'AI che risponde sui tuoi appunti senza inventare.

**Reciprocal Rank Fusion (RRF).** Il modo in cui fondiamo la classifica della
ricerca per parole e quella per significato: ogni risultato prende punti in base
alla sua *posizione* in ciascuna lista.

**Tool / Tool loop / Agente.** Dare al modello delle funzioni che può chiamare
("leggi i task di oggi"). Il *loop* è il ciclo in cui il modello chiama uno
strumento, guarda il risultato e decide la mossa dopo. Un *agente* è questo loop
con un obiettivo.

**Hallucination.** Quando il modello afferma con sicurezza qualcosa di falso.
Contromisura nel nostro caso: citazioni obbligatorie e "non lo so" ammesso.

---

## Strumenti e pratiche

**TypeScript / `strict`.** JavaScript con i tipi. In modalità `strict` il
compilatore rifiuta le ambiguità: è il motivo per cui molti errori si vedono
mentre scrivi invece che in produzione.

**Zod.** Libreria per validare dati a runtime. Descrivi la forma attesa, e i dati
che non la rispettano vengono rifiutati con un errore chiaro. Va messa su ogni
confine: form, endpoint, webhook, risposte dei modelli.

**pnpm / monorepo / workspace.** `pnpm` è il gestore di pacchetti (più veloce e
parsimonioso di npm). Un *monorepo* tiene più progetti (`apps/web`,
`apps/extension`, `packages/*`) in un solo repository, condividendo codice.

**Biome.** Strumento unico che sostituisce ESLint (controlla gli errori di stile
e i bug probabili) e Prettier (formatta). Scritto in Rust, istantaneo.

**Vitest / Playwright.** Il primo esegue i test unitari (una funzione fa quello
che deve?). Il secondo guida un browser vero e verifica i flussi (riesco davvero
a catturare un link e ritrovarlo?).

**CI (Continuous Integration).** Su GitHub Actions: a ogni push gira lint, tipi,
test e build. Se qualcosa si rompe lo sai in tre minuti, non tra due settimane.

**Optimistic UI.** L'interfaccia mostra subito il risultato dell'azione, prima
che il server confermi, e torna indietro se fallisce. È ciò che fa sembrare
un'app "istantanea".

**Debounce.** Aspettare che l'utente smetta di digitare (es. 500 ms) prima di
salvare o cercare, invece di farlo a ogni tasto.

**CVE.** L'identificativo pubblico di una vulnerabilità nota (es.
CVE-2026-64641). Quando esce una CVE sul tuo framework, si aggiorna.

**ADR (Architecture Decision Record).** Mezza pagina che dice: contesto,
decisione presa, alternative scartate, conseguenze. Serve al Daniele di tra sei
mesi, che non ricorderà perché una cosa è fatta così.
