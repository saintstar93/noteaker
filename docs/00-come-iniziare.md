# 00 — Come iniziare (leggi questo per primo)

Guida operativa per Daniele. Gli altri documenti servono a Claude Code; questo
serve a te.

---

## 1. Cosa c'è in questa cartella adesso

Solo documentazione: nessuna riga di codice. È voluto. Il documento che conta è
`CLAUDE.md`, che Claude Code legge **automaticamente all'inizio di ogni
sessione**, senza che tu debba dirgli niente. Gli altri file in `docs/` li apre
solo quando servono, così non spreca contesto.

```
CLAUDE.md              le regole del progetto (letto sempre)
docs/00-come-iniziare  questo file
docs/01-architettura   perché ogni pezzo dello stack è stato scelto
docs/02-modello-dati   lo schema del database, con lo SQL
docs/03-design-system  colori, tipografia, layout, componenti
docs/04-roadmap        le sei fasi, con le caselle da spuntare
docs/05-glossario      ogni termine tecnico spiegato da zero
docs/06-sicurezza      le regole che non si violano
docs/adr/              le decisioni prese strada facendo
```

## 2. Prima di aprire Claude Code

Sul Mac ti servono, una volta sola:

```bash
# Node 22+ e pnpm
brew install node pnpm
# Docker Desktop, serve per far girare Supabase in locale
brew install --cask docker
# CLI di Supabase
brew install supabase/tap/supabase
# git, se non c'è già
git --version
```

E questi account (tutti gratis per iniziare): **GitHub**, **Supabase**,
**Vercel**, una chiave API **Anthropic** e una **OpenAI** (quest'ultima solo per
gli embedding, spende pochi centesimi).

Poi inizializza il repo:

```bash
cd /Users/danielepiani/Progetti/noteaker
git init && git add . && git commit -m "docs: contesto iniziale del progetto"
```

## 3. Il primo prompt da dare a Claude Code

Apri il terminale nella cartella e lancia `claude`. Poi incolla esattamente
questo:

> Leggi CLAUDE.md e docs/04-roadmap.md. Siamo alla Fase 0.
> Prima di scrivere codice: spiegami in dieci righe cosa costruiremo in questa
> fase e in che ordine, e dimmi quali informazioni ti servono da me (chiavi,
> account, decisioni). Poi fermati e aspetta il mio ok.
> Quando ti dico di procedere, lavora una casella alla volta: prima spieghi
> cosa stai per fare e perché, poi lo fai, poi mi dici come verificare che
> funzioni.

Il punto importante è quel **"poi fermati"**. Il momento in cui i progetti con
gli assistenti vanno a rotoli è quando li si lascia correre per venti minuti
senza guardare. Fase 0 è anche il tuo addestramento: vale la pena andare piano.

## 3-bis. Entrare nell'app in locale

`http://localhost:3100` → **Entra come Daniele**. Nessuna email.

Quel pulsante compare solo quando l'app parla col Supabase sul tuo Mac, e
l'utente dietro (`daniele@noteaker.local`) lo crea `supabase/seed.sql` a ogni
`supabase db reset`. In produzione il pulsante non esiste e quell'utente non c'è.

Se preferisci provare il flusso vero col magic link: le email in locale non
partono, le intercetta **Mailpit** su http://127.0.0.1:54324.

## 4. Come lavorare, in pratica

**Una sessione = una casella della roadmap.** Quando una casella è finita, fai
committare, poi apri una sessione nuova (`/clear`). Le sessioni lunghe accumulano
contesto inutile e l'assistente inizia a dimenticare le regole.

**Usa la modalità piano** (in Claude Code si attiva con `Shift+Tab` due volte)
per le cose grosse: ti mostra cosa intende fare senza toccare i file. Approvi, e
solo allora scrive.

**Chiedi sempre "perché".** È letteralmente scritto nelle regole del progetto,
ma la regola funziona solo se la eserciti. Se una spiegazione non ti convince,
dillo: "non ho capito cosa fa questa parte, rispiegamela con un esempio".

**Non accettare codice che non capisci** nelle parti strutturali (schema del
database, autenticazione, endpoint). Nel CSS puoi essere più rilassato.

**Committa spesso**, con messaggi in italiano che dicono cosa e perché. Un
commit ogni casella completata è la frequenza giusta: se qualcosa si rompe,
torni indietro di dieci minuti, non di due giorni.

**Quando l'assistente si incarta** (due o tre tentativi falliti sulla stessa
cosa): fermalo, fatti spiegare cosa non torna, e ripartite da un'ipotesi diversa.
Insistere sullo stesso approccio è il modo più efficiente di bruciare tempo.

## 5. Le tre cose che possono far fallire il progetto

1. **Costruire troppo prima di usare.** Se dopo tre settimane non hai ancora
   salvato una nota vera dentro l'app, qualcosa è andato storto nell'ordine di
   lavoro. La Fase 1 esiste apposta: appena la cattura funziona, **inizia a
   usarla ogni giorno**, anche se il resto è brutto.
2. **Allargare lo scopo.** Ogni idea nuova va in "Idee parcheggiate" in fondo
   alla roadmap, non nel lavoro di oggi.
3. **Saltare la sicurezza perché "tanto sono solo io".** Le due regole che
   costano cinque minuti e salvano tutto: RLS su ogni tabella nuova, e nessuna
   chiave segreta con il prefisso `NEXT_PUBLIC_`.

## 6. Cosa aspettarsi come tempi

Con sessioni serali e qualche weekend, e considerando che stai anche imparando:

| Fase | Cosa ottieni | Ordine di grandezza |
|---|---|---|
| 0 | App online, login funzionante | 1 settimana |
| 1 | Cattura da Chrome, iPhone, Telegram + Inbox | 1-2 settimane |
| 2 | Editor, cartelle, ricerca, export | 2-3 settimane |
| 3 | Riassunti, tag automatici, ricerca semantica | 2 settimane |
| 4 | Obiettivi, abitudini, task, Today, Calendar, import Notion | 2-3 settimane |
| 5 | Review, agente del mattino | 1-2 settimane |

Sono stime, non promesse. La fase che di solito sfora è la 2, perché l'editor è
sempre più lavoro di quanto sembri.
