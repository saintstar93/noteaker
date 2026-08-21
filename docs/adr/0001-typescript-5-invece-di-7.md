# ADR 0001 — TypeScript 5.9 invece di 7.0

- **Data:** 2026-08-21
- **Stato:** Accettato

## Contesto
Alla Fase 0, `typescript@latest` su npm è la **7.0.2**: il compilatore
riscritto in Go, molto più veloce ma pubblicato da poco. Lo stack in
`CLAUDE.md` non fissa una versione di TypeScript, quindi la scelta va fatta
adesso, prima che il monorepo abbia dieci package.

## Decisione
Piniamo **`typescript@5.9.3`** in tutto il monorepo.

## Alternative considerate
| Opzione | Perché no |
|---|---|
| `typescript@7.0.2` | `next build` esegue il typecheck con la propria integrazione TS; se la 7 dovesse incespicare su Next 16.3, Biome o i tipi di Supabase, il debug costerebbe più del guadagno in velocità di compilazione. Su un prototipo la stabilità vale più dei secondi. |
| Nessun pin (`^5`) | Un aggiornamento minore silenzioso può rompere la CI in un momento a caso. Meglio aggiornare di proposito. |

## Conseguenze
Compiliamo più lentamente di quanto potremmo. In cambio, la toolchain è quella
su cui Next 16, Biome 2 e `@supabase/ssr` sono effettivamente testati.
L'aggiornamento alla 7 sarà un cambio di una riga in tre `package.json` più una
run di CI: se passa, si tiene. Da rivalutare quando Next dichiarerà il supporto
esplicito, o alla Fase 2.
