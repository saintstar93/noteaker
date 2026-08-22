# ADR 0007 — Il pomodoro si basa sull'orario di fine, non su un contatore

- **Data:** 2026-08-22
- **Stato:** Accettato

## Contesto
Serviva un timer per la tecnica del pomodoro, personalizzabile e utilizzabile
sia da desktop sia da iPhone. Il modo ovvio — un contatore che scala di un
secondo alla volta con `setInterval` — sull'iPhone non funziona: appena blocchi
lo schermo o cambi app, il browser **congela i timer del JavaScript**. Al
ritorno avresti perso minuti senza accorgertene.

## Decisione
Si salva **l'orario in cui la fase deve finire** (`fineIl`, un timestamp) e si
calcola quanto manca a ogni disegno. `setInterval` serve solo a ridisegnare,
non a tenere il tempo: a decidere è l'orologio.

Dove sta cosa:

| Cosa | Dove | Perché |
|---|---|---|
| Impostazioni (durate, cicli, suono) | **database** | devono valere su Mac e iPhone: in `localStorage` avresti due configurazioni diverse |
| Stato del timer in corso | **`localStorage`** | è di questo dispositivo e di questo momento; sincronizzarlo darebbe due timer che si contendono la stessa sessione |
| Sessioni concluse | **database** | servono a sapere quanto hai lavorato su una task e a contare i cicli |

## Alternative considerate
| Opzione | Perché no |
|---|---|
| Contatore con `setInterval` | Si desincronizza appena la pagina va in background. È il bug classico dei timer nel browser. |
| Stato del timer sincronizzato in database | Due dispositivi con lo stesso pomodoro attivo si sovrascriverebbero a vicenda, e servirebbe realtime per una cosa che non lo merita. |
| Notifiche push a fine fase | Servono permessi, un service worker e (su iOS) l'app installata in home. Rimandato alla PWA della fase 2. |

## Conseguenze
- Il timer sopravvive a ricaricamenti, schermo bloccato e cambio di app.
- **Non** suona se la scheda è chiusa: il suono parte solo quando la pagina
  torna in primo piano ed esegue il codice. È il limite da superare con le
  notifiche, quando ci sarà la PWA.
- Il suono è generato con la Web Audio API, senza file da scaricare. Se il
  browser lo blocca (succede finché non c'è stata un'interazione) fallisce in
  silenzio: il suono è un di più, il conteggio no.
