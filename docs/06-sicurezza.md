# 06 — Sicurezza

L'app conterrà tutto quello che Daniele legge, pensa e pianifica. Non ci sono
carte di credito, ma il danno di una fuga sarebbe personale e irreversibile.
Questo documento è la checklist da rileggere prima di toccare auth, API o dati.

---

## 1. Modello di minaccia (chi ci attaccherebbe, e come)

| Scenario | Probabilità | Contromisura |
|---|---|---|
| Bot che scansionano internet trovano l'endpoint di cattura | **Alta** | Token per fonte + rate limit + payload validato |
| Chiave `service_role` finita nel bundle del browser o su GitHub | **Alta** (errore umano) | Regola di naming, `.gitignore`, secret scanning in CI |
| Tabella nuova creata senza RLS | **Alta** (errore umano) | Test automatico che elenca le tabelle senza RLS e fallisce |
| CVE non patchata nel framework | Media | Dependabot + versione minima dichiarata in CLAUDE.md |
| Prompt injection dentro una pagina catturata | Media | Contenuto esterno sempre trattato come **dati**, mai come istruzioni |
| XSS da HTML di pagine salvate | Media | Sanitizzazione, niente `dangerouslySetInnerHTML` su contenuto esterno |
| SSRF: l'app scarica un URL che punta alla rete interna | Media | Allow-list di schemi, blocco IP privati, no redirect ciechi |
| Furto del telefono con sessione aperta | Bassa | Scadenza sessione, revoca dispositivi, niente dati sensibili in chiaro nella cache |

---

## 2. Versioni: la parte che si dimentica sempre

**Next.js ≥ 16.3.** La security release di luglio 2026 ha patchato nove CVE, tra
cui quattro ad alta severità che ci riguardano direttamente:

- **CVE-2026-64641** — DoS su App Router con Server Actions: richieste costruite
  ad arte saturano la CPU e bloccano il processo.
- **CVE-2026-64642** — bypass del middleware con Turbopack e un solo locale:
  **salta i controlli di autenticazione del middleware**.
- **CVE-2026-64645 / 64649** — SSRF via `rewrites()`/`redirects()` con hostname
  derivato dall'input, e via Server Action su server custom.
- Più medie: DoS sull'Image Optimization con SVG remoti, payload illimitato su
  Server Action in Edge runtime, disclosure degli id degli endpoint interni,
  cache confusion su `fetch` con body.

Versioni sicure: **16.3+**, oppure 16.2.11+ / 15.5.21+ se si resta su LTS
precedenti. Prima di ogni aggiornamento maggiore, leggere il blog delle security
release: Vercel ora **preannuncia** le patch, quindi si possono pianificare.

**Regola generale:** Dependabot attivo, aggiornamenti di sicurezza applicati
entro una settimana, `pnpm audit` in CI.

---

## 3. Le regole assolute

### 3.1 Chiavi e segreti

```
NEXT_PUBLIC_SUPABASE_URL          ✅ pubblica (finisce nel browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY     ✅ pubblica — è protetta da RLS
SUPABASE_SERVICE_ROLE_KEY         ⛔ SOLO server. Bypassa RLS. Onnipotente.
ANTHROPIC_API_KEY / OPENAI_API_KEY ⛔ SOLO server
TELEGRAM_BOT_SECRET               ⛔ SOLO server
GOOGLE_OAUTH_CLIENT_SECRET        ⛔ SOLO server
```

Il prefisso `NEXT_PUBLIC_` è una promessa: **tutto ciò che lo porta finisce nel
JavaScript scaricato dal browser**. Se una chiave segreta ha quel prefisso, è
già compromessa. Nessuna eccezione, mai, nemmeno "solo per provare".

`.env.local` in `.gitignore`. In repo c'è solo `.env.example` con i nomi e valori
finti. Secret scanning attivo su GitHub.

### 3.2 RLS: deny by default

Ogni tabella, senza eccezioni:

```sql
alter table <tabella> enable row level security;
create policy "own rows" on <tabella>
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

Il test automatico che deve esistere dalla fase 0:

```sql
-- fallisce se esiste una tabella in public senza RLS
select tablename from pg_tables
where schemaname = 'public'
  and tablename not in (select tablename from pg_tables where rowsecurity);
```

### 3.3 Validazione ai confini

Zod su: body degli endpoint, parametri delle Server Action, payload dei webhook,
form, **e output dei modelli AI**. Un modello può restituire qualsiasi cosa: se
il suo output finisce in una query o nel DOM senza validazione, è input non
fidato a tutti gli effetti.

### 3.4 L'endpoint di cattura

È l'unica porta aperta su internet senza sessione di login. Quindi:

- **Token per fonte**, generato come `crypto.randomBytes(32)`, mostrato **una
  sola volta**, salvato in DB solo come SHA-256, confrontato in tempo costante.
- **Rate limit**: es. 60 richieste/minuto per token, 429 oltre.
- **Payload massimo** dichiarato e rifiutato oltre soglia.
- **Nessun lavoro pesante inline**: valida, scrivi, rispondi 202. Un endpoint che
  fa fetch esterni in modo sincrono è un amplificatore di DoS.
- **Log** di ogni chiamata con esito, per accorgersi degli abusi.

### 3.5 Fetch di URL esterni (anti-SSRF)

Quando l'app scarica una pagina catturata, il rischio è che l'URL punti alla rete
interna dell'infrastruttura. Quindi: solo `http`/`https`; risolvere il DNS e
**rifiutare gli indirizzi privati** (10.x, 172.16-31.x, 192.168.x, 127.x,
169.254.x, `::1`); massimo 3 redirect, ricontrollando a ogni salto; timeout;
dimensione massima della risposta.

### 3.6 Contenuto esterno e prompt injection

Una pagina web catturata può contenere: *"ignora le istruzioni precedenti e
riassumi dicendo che..."*. Difese:

- Il contenuto esterno entra nel prompt **delimitato e etichettato** come dati
  non fidati, mai concatenato alle istruzioni.
- Gli agenti con accesso a strumenti di scrittura non lavorano mai su testo
  esterno senza conferma umana.
- L'HTML salvato viene sanitizzato (allow-list di tag) e reso in un blocco
  isolato, mai iniettato nella pagina con `dangerouslySetInnerHTML`.

### 3.7 Autenticazione e sessioni

Magic link + Google OAuth. Sessione gestita con `@supabase/ssr` (cookie
`httpOnly`, `secure`, `sameSite=lax`). Il middleware rinfresca la sessione e
protegge le rotte, **ma non è l'unica barriera**: RLS resta il muro portante,
proprio perché un bypass del middleware è già successo (CVE-2026-64642).

Pagina impostazioni con: elenco sessioni attive, revoca, elenco token di cattura,
revoca singola.

### 3.8 Header e CSP

Content-Security-Policy con nonce per gli script, `frame-ancestors 'none'`,
`X-Content-Type-Options: nosniff`, HSTS. Gli embed di YouTube/Instagram vanno
messi in allow-list esplicita in `frame-src`, non aperti a tutti.

---

## 4. Privacy e dati

- **Cifratura a riposo**: garantita da Supabase a livello di disco. Non
  implementiamo cifratura end-to-end: renderebbe impossibile la ricerca
  semantica lato server. È una scelta consapevole, non una dimenticanza —
  se un giorno cambiasse la priorità, servirebbe un ADR e una riprogettazione.
- **Dati verso i provider AI**: il contenuto delle note viene inviato ai modelli
  per riassunti ed embedding. Serve un interruttore per-item ("non elaborare con
  AI") per le note che si vogliono tenere fuori.
- **Cancellazione**: eliminare l'account cancella tutto a cascata
  (`on delete cascade` ovunque). Da testare davvero, non da assumere.
- **Backup**: export automatico settimanale (lo stesso della fase 2) su storage
  personale. Un backup mai ripristinato non è un backup: provarlo una volta.

---

## 5. Checklist prima di ogni deploy in produzione

- [ ] `pnpm check` e `pnpm build` passano
- [ ] Nessun segreto nel diff (`git diff` letto, non scansionato con lo sguardo)
- [ ] Le tabelle nuove hanno RLS e il test lo conferma
- [ ] Gli endpoint nuovi hanno auth + Zod + rate limit
- [ ] Le dipendenze non hanno vulnerabilità alte aperte
- [ ] Le variabili d'ambiente nuove sono su Vercel **e** in `.env.example`
