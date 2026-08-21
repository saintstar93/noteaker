# ADR 0003 — Produttività e organizzazione prima della cattura

- **Data:** 2026-08-21
- **Stato:** Accettato

## Contesto
La roadmap metteva la **Fase 1 (cattura da Chrome, Shortcut iOS, Telegram)**
subito dopo le fondamenta, e rimandava l'albero delle cartelle alla Fase 2 e
goal/abitudini/task alla Fase 4. Aprendo l'app per la prima volta, Daniele ha
constatato che non c'era un posto dove mettere abitudini, task, task per
progetto, né una board Kanban, né sottocartelle dentro gli Space, e ha chiesto
esplicitamente di svilupparle. Il Kanban, in particolare, **non era in roadmap**.

## Decisione
Anticipiamo la produttività (goal, key result, abitudini, task, Kanban) e
l'albero delle collection, prima della cattura. Lo facciamo con dati **veri**
sul database — migrazione, RLS, scritture reali — non con altre schermate finte.

## Alternative considerate
| Opzione | Perché no |
|---|---|
| Rispettare l'ordine e fare prima la Fase 1 | La cattura è il pezzo più utile in assoluto, ma richiede estensione, Shortcut e bot: tre canali esterni da configurare, mentre l'app dentro resta vuota. Costruire dove c'è già il sito è più veloce che coordinare tre integrazioni. |
| Aggiungere schermate dimostrative | Lavoro da buttare. Il valore sta nel poterle usare davvero. |
| Rifiutare il Kanban perché fuori roadmap | La regola serve a non allargare lo scopo di nascosto, non a impedire una decisione presa consapevolmente. Registrarla qui è il modo giusto di rispettarla. |

## Conseguenze
- **La Fase 1 resta completamente scoperta.** Finché non c'è, l'Inbox si
  riempie solo con note create a mano: il canale che dovrebbe alimentarla non
  esiste ancora. È il debito più grosso aperto oggi.
- L'editor delle note è provvisorio (titolo + testo semplice su `body_text`).
  BlockNote arriva in Fase 2 e scriverà anche `body` in jsonb: il testo scritto
  adesso non si perde, perché `body_text` è la stessa colonna che userà la
  ricerca.
- Il Kanban entra con drag&drop HTML5 nativo, senza aggiungere dipendenze. Non
  gestisce il riordino manuale dentro la colonna: `position` esiste in tabella
  ma il drag imposta solo lo stato.
- Il drag non è usabile da tastiera. Ogni card ha una tendina di stato che fa la
  stessa cosa: è quella la via accessibile, il drag è una scorciatoia.
