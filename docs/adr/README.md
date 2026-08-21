# ADR — Architecture Decision Records

Un ADR è **mezza pagina** che registra una decisione strutturale: cosa abbiamo
scelto, perché, cosa abbiamo scartato e cosa ci costerà. Serve al Daniele di tra
sei mesi, che aprirà il codice e si chiederà "ma perché è fatto così?".

## Quando si scrive un ADR

- Si aggiunge o si sostituisce una tecnologia (libreria, servizio, provider)
- Si sceglie tra due modi non equivalenti di modellare i dati
- Si prende una decisione di sicurezza o di privacy
- Si accetta consapevolmente un compromesso o un debito tecnico

Non si scrive un ADR per: rinominare una cartella, scegliere il nome di una
variabile, aggiungere un componente.

## Regole

- Numerazione progressiva: `0001-titolo-in-kebab-case.md`
- Un ADR non si modifica dopo essere stato accettato. Se la decisione cambia, si
  scrive un ADR nuovo con stato `Sostituisce 0007` e si aggiorna il vecchio con
  `Sostituito da 0012`.
- In italiano, breve, senza retorica.

## Template

```markdown
# ADR 000X — <titolo>

- **Data:** AAAA-MM-GG
- **Stato:** Proposto | Accettato | Sostituito da 000Y

## Contesto
Qual è il problema, e perché va deciso adesso. 3-5 righe.

## Decisione
Cosa facciamo. Una frase netta, al presente.

## Alternative considerate
| Opzione | Perché no |
|---|---|
| ... | ... |

## Conseguenze
Cosa diventa più facile, cosa più difficile, cosa dovremo rifare se questa
decisione si rivelasse sbagliata.
```

## Indice

| # | Titolo | Stato |
|---|---|---|
| [0001](0001-typescript-5-invece-di-7.md) | TypeScript 5.9 invece di 7.0 | Accettato |
| [0002](0002-shell-con-dati-demo-in-fase-0.md) | Il guscio dell'app funziona con dati finti in Fase 0 | Superato dai fatti: i dati finti sono stati rimossi il 21/08/2026 |
| [0003](0003-produttivita-prima-della-cattura.md) | Produttività e organizzazione prima della cattura | Accettato |

Le scelte iniziali di stack non hanno un ADR: sono già motivate, con le
alternative scartate, in `01-architettura.md`.
