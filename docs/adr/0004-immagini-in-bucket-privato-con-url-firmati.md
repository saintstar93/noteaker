# ADR 0004 — Immagini delle note in un bucket privato, servite con URL firmati

- **Data:** 2026-08-21
- **Stato:** Accettato

## Contesto
L'editor a blocchi accetta immagini, anche trascinate dentro. Vanno messe da
qualche parte. Un'immagine dentro una nota è un dato personale quanto il testo
che le sta intorno: una foto di una lavagna, lo screenshot di un cruscotto,
la pagina di un libro.

## Decisione
Bucket Supabase **privato** `note-media`, percorsi nella forma
`<user_id>/<item_id>/<uuid>.<est>`, con policy RLS su `storage.objects` che
consentono lettura, scrittura e cancellazione **solo dentro la propria
cartella**. Nella nota si salva il **percorso**, non un URL; l'URL firmato
(valido un'ora) si genera al volo quando l'immagine va mostrata, tramite
`resolveFileUrl` di BlockNote.

Il bucket ha una allow-list di MIME type che **esclude `image/svg+xml`**.

## Alternative considerate
| Opzione | Perché no |
|---|---|
| Bucket pubblico con percorsi imprevedibili | "Difficile da indovinare" non è una protezione. Un URL pubblico finisce nella cronologia, nei log di un proxy, in un incolla su Telegram — e da lì è leggibile per sempre da chiunque. |
| Salvare l'URL firmato dentro la nota | Scade dopo un'ora: la nota si romperebbe da sola. È l'errore più comune con lo storage privato. |
| Proxy `/api/media/...` che scarica i byte dal nostro server | Funziona ed è più semplice da capire, ma fa passare ogni immagine per una funzione serverless: più latenza, più costo, e un limite di dimensione in mezzo. Gli URL firmati vanno diretti a Supabase. |
| Permettere gli SVG | Un SVG è un documento XML che può contenere `<script>`. Servito dal nostro dominio sarebbe XSS (docs/06 §3.6). Se un giorno servisse, va sanificato prima di accettarlo. |

## Conseguenze
- Il caricamento avviene **dal browser direttamente a Supabase**, senza passare
  dal nostro server: meno latenza e nessun limite di payload da gestire. È
  sicuro perché le policy accettano scritture solo nella cartella di chi carica.
- L'URL firmato dura un'ora. Una nota lasciata aperta più a lungo mostrerà le
  immagini rotte fino al ricaricamento. Se dovesse dare fastidio, si rigenera
  periodicamente.
- Se un giorno servisse l'export (fase 2, obbligatorio), i file vanno scaricati
  e messi nello zip: il percorso salvato nella nota basta per ritrovarli.
- Cancellando una nota **i file restano nello storage**. Serve una pulizia:
  oggi non c'è, è debito annotato in roadmap.
