# Noteaker

Sistema operativo personale: cattura (articoli, reel, video, libri, corsi),
organizzazione, ricerca semantica e gestione della giornata (obiettivi →
abitudini → task).

**Stack:** Next.js 16.3 · React 19 · TypeScript · Tailwind v4 · shadcn/ui ·
BlockNote · Supabase (Postgres, RLS, pgvector, Edge Functions) · Vercel AI SDK 6.

## Da dove si comincia

1. [`docs/00-come-iniziare.md`](docs/00-come-iniziare.md) — prerequisiti, primo prompt, metodo di lavoro
2. [`CLAUDE.md`](CLAUDE.md) — le regole del progetto (Claude Code lo legge da solo)
3. [`docs/04-roadmap.md`](docs/04-roadmap.md) — le sei fasi e lo stato attuale

## Documentazione

| File | Contenuto |
|---|---|
| [`docs/01-architettura.md`](docs/01-architettura.md) | Ogni scelta di stack, spiegata e motivata |
| [`docs/02-modello-dati.md`](docs/02-modello-dati.md) | Schema Postgres, RLS, ricerca ibrida |
| [`docs/03-design-system.md`](docs/03-design-system.md) | Token, tipografia, layout, motion |
| [`docs/04-roadmap.md`](docs/04-roadmap.md) | Fasi e caselle da spuntare |
| [`docs/05-glossario.md`](docs/05-glossario.md) | Termini tecnici spiegati da zero |
| [`docs/06-sicurezza.md`](docs/06-sicurezza.md) | Modello di minaccia e checklist |
| [`docs/adr/`](docs/adr/) | Decisioni architetturali |

Stato: **Fase 0 chiusa.** In più, anticipate rispetto alla roadmap
(vedi [ADR 0003](docs/adr/0003-produttivita-prima-della-cattura.md)):
obiettivi, abitudini con streak, task con vista Kanban, Spaces con cartelle
annidate e note. Mancano il progetto Supabase cloud, il deploy su Vercel e
**tutta la Fase 1 (la cattura da Chrome, iPhone e Telegram)**.

## Sviluppo in locale

```bash
pnpm install
cp .env.example apps/web/.env.local   # Next legge l'env dalla cartella dell'app,
                                      # non dalla radice del monorepo
pnpm dev                     # http://localhost:3000

supabase start               # Postgres + Auth locali (serve Docker)
pnpm test                    # 35 test: RLS, isolamento fra utenti, trigger, abitudini
pnpm check && pnpm build     # devono passare prima di ogni push
pnpm smoke                   # chiede ogni pagina con una sessione vera e
                             # controlla che mostri davvero i dati (serve pnpm dev)
pnpm test:e2e                # Playwright: l'editor a blocchi in un browser vero
                             # (serve pnpm dev; la prima volta: playwright install chromium)
```

Le email in locale non arrivano davvero: le intercetta **Mailpit** su
http://127.0.0.1:54324. Supabase Studio è su http://127.0.0.1:54323.
