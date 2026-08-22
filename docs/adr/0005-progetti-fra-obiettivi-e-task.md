# ADR 0005 — Il progetto sta fra l'obiettivo e la task

- **Data:** 2026-08-22
- **Stato:** Accettato

## Contesto
Daniele ha chiesto che le task siano organizzate **per progetto**, con il
progetto selezionabile o no. Il modello aveva già `goals`, e le task potevano
essere collegate a un obiettivo. Serviva decidere se il "progetto" fosse
semplicemente un altro nome per l'obiettivo, un'etichetta parallela, o un
livello a sé.

## Decisione
Un progetto è un'entità propria, e la catena diventa
**Goal → Project → Task**, con **entrambi** i collegamenti facoltativi.

Un obiettivo è trimestrale e misurabile ("fatturare 50k"): ha key result e
serve alle review. Un progetto è un corpo di lavoro con un inizio e una fine
("rifare il sito"): ha task e una percentuale di avanzamento. Un progetto
*può* servire un obiettivo; una task *può* stare in un progetto.

## Alternative considerate
| Opzione | Perché no |
|---|---|
| Rinominare `goals` in `projects` | Si perderebbero i key result e la semantica trimestrale, che servono alle review della fase 5. |
| Progetto e obiettivo come due etichette parallele sulla task | Due tendine che fanno quasi la stessa cosa: non sapresti mai quale usare, e i raggruppamenti si contraddirebbero. |
| Solo progetti, niente obiettivi | Toglie il "perché" dalla catena. La motivazione di un obiettivo (`why`) è la cosa che si rilegge quando si ha voglia di mollare. |

## Conseguenze
- `tasks` ha ora **due** riferimenti facoltativi, `goal_id` e `project_id`. È
  una ridondanza voluta: una task può servire direttamente un obiettivo senza
  passare da un progetto. Se si rivelasse confusa, si toglie `goal_id` dalle
  task e lo si deriva dal progetto.
- La vista a lista raggruppa per **progetto**, non più per obiettivo. Le task
  senza progetto finiscono in un gruppo "Senza progetto": non spariscono.
- Eliminare un progetto **non** cancella le sue task (`on delete set null`).
