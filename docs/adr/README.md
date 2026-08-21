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
| — | *(nessun ADR ancora scritto — le scelte iniziali sono in `01-architettura.md`)* | — |
