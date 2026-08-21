# ADR 0002 — Il guscio dell'app funziona con dati finti in Fase 0

- **Data:** 2026-08-21
- **Stato:** Accettato

## Contesto
La Fase 0 è finita quando "ti logghi in produzione e vedi una schermata vuota
ma tua". Ma il login richiede un progetto Supabase, che richiede account e
chiavi. Nel frattempo l'app dovrebbe restare invisibile — e un prototipo che
non si può guardare non serve a decidere niente sul design.

## Decisione
Se le variabili `NEXT_PUBLIC_SUPABASE_*` mancano, l'app **parte lo stesso**: il
middleware non reindirizza al login e le schermate mostrano dati dimostrativi
presi da `apps/web/src/lib/demo.ts`. Appena le variabili ci sono, il
comportamento normale (sessione + redirect) si riattiva da solo.

## Alternative considerate
| Opzione | Perché no |
|---|---|
| Crashare all'avvio senza env | Onesto, ma blocca ogni lavoro sul design finché non c'è un account cloud. |
| Un finto client Supabase in memoria | Molto più codice, e un secondo comportamento da mantenere allineato al vero. |

## Conseguenze
C'è un percorso di codice che esiste solo perché il progetto non è ancora
configurato. È isolato in `isSupabaseConfigured` (`apps/web/src/lib/env.ts`) e
nel file `demo.ts`; nessun componente importa i dati finti direttamente, li
riceve come props. **Va rimosso nella Fase 1**, quando l'Inbox legge da
`items` per davvero: un fallback dimostrativo lasciato in giro diventa prima o
poi un bug che nasconde un errore di connessione.
