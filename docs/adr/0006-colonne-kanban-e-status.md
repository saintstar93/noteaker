# ADR 0006 — Le colonne del Kanban sono dell'utente, ma `status` resta

- **Data:** 2026-08-22
- **Stato:** Accettato

## Contesto
Daniele ha chiesto di poter decidere lui le colonne della board. Le colonne
erano i tre valori fissi di `tasks.status` (`todo`, `doing`, `done`), su cui
però si appoggiano la schermata Today ("cosa resta da chiudere"), il trigger
che scrive `completed_at`, e — in prospettiva — le statistiche delle review.

## Decisione
Le colonne vivono in una tabella `task_columns` dell'utente, e `tasks` ha una
`column_id`. **`status` non viene rimosso**: resta la verità su "fatto / non
fatto". Una colonna può essere marcata `is_done` ("arrivare qui vuol dire aver
finito"), e un trigger allinea `status` quando una task ci entra o ne esce.

Lo stesso trigger assegna la **prima colonna** a una task creata senza
indicarne una.

## Alternative considerate
| Opzione | Perché no |
|---|---|
| Sostituire `status` con `column_id` | Today, `completed_at` e le review dovrebbero interrogare una tabella di colonne definite dall'utente per sapere cosa è concluso. Una domanda semplice ("è fatta?") diventerebbe una join che dipende da come l'utente ha chiamato le colonne oggi. |
| Tenere entrambi e allinearli dall'app | Due fonti di verità che divergono alla prima scrittura che non passa dall'interfaccia — la cattura da fuori, una query a mano, una Edge Function. |
| Colonne fisse e basta | È esattamente ciò che era stato chiesto di cambiare. |

## Conseguenze
- **Il trigger è la sola cosa che scrive `status` quando cambia la colonna.**
  L'interfaccia non lo tocca: lo mostra e basta.
- L'ordine dei trigger conta. `tasks_a_sync_status_*` deve scattare **prima**
  di `tasks_completed_at`, altrimenti il secondo leggerebbe lo stato vecchio.
  In Postgres i trigger `before` di pari livello scattano in ordine alfabetico
  di nome: da qui la `a` nel nome, che è brutta di proposito.
- Eliminare una colonna **sposta** le sue task nella prima rimasta, non le
  cancella. Perdere delle task perché si è riorganizzata la board sarebbe
  inaccettabile.
- Una board non può restare senza colonne: l'ultima non si elimina.
