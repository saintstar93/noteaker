# 03 — Design system

Riferimento visivo: il concept "Task Flow" (dark, card colorate, angoli molto
arrotondati, tipografia grande e bold, griglia bento). **Stessa anima, ripensata
per il desktop**: il concept è pensato per tre schermi da 390px, noi abbiamo
1440px e dobbiamo riempirli senza gonfiare tutto.

---

## 1. I tre principi che decidono i dubbi

1. **Il colore è informazione, non decorazione.** Ogni colore delle card
   corrisponde a uno **Space** o a un **kind** di contenuto. Se un colore non
   significa niente, non si usa. È ciò che rende la griglia leggibile a colpo
   d'occhio invece che un mosaico casuale.
2. **Il buio è lo sfondo, il colore è il contenuto.** Superfici quasi nere,
   nessun bordo grigio decorativo: la gerarchia si costruisce con lo stacco tra
   le superfici e con le card piene.
3. **La densità cresce col vetro.** Su mobile: una colonna, tipografia enorme,
   poche cose. Su desktop: sidebar + lista + dettaglio, testo più piccolo, più
   righe visibili. Non si scala la stessa UI: si cambia il layout.

---

## 2. Token (vivono in `app/globals.css`, dentro `@theme` di Tailwind v4)

```css
@theme {
  /* superfici — dal più profondo al più in rilievo */
  --color-bg:            #0A0A0B;   /* fondo dell'app */
  --color-surface:       #141416;   /* pannelli, sidebar */
  --color-surface-2:     #1C1C20;   /* card neutre, input */
  --color-surface-3:     #26262B;   /* hover, stati attivi */
  --color-border:        #2A2A30;   /* usato con parsimonia */

  /* testo */
  --color-fg:            #F5F5F4;
  --color-fg-muted:      #A1A1A6;
  --color-fg-subtle:     #6B6B72;
  --color-on-accent:     #0A0A0B;   /* testo sopra le card colorate: sempre scuro */

  /* accenti — sono i colori degli Space e dei kind */
  --color-yellow:        #F2D857;
  --color-purple:        #7C5CFC;
  --color-green:         #3ECF8E;
  --color-red:           #F4553D;
  --color-blue:          #3B82F6;
  --color-teal:          #14B8A6;

  /* stato */
  --color-success:       #3ECF8E;
  --color-warning:       #F2D857;
  --color-danger:        #F4553D;

  /* raggi — generosi, è la firma del concept */
  --radius-sm:  10px;
  --radius-md:  16px;
  --radius-lg:  24px;   /* card */
  --radius-xl:  32px;   /* pannelli grandi */
  --radius-full: 9999px;

  /* tipografia */
  --font-sans:    'Inter Variable', system-ui, sans-serif;
  --font-display: 'Inter Variable', system-ui, sans-serif; /* pesi 700-800 */
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;
}
```

**Tema chiaro:** non nella v1. I token sono però già in variabili CSS, quindi
aggiungerlo un giorno significa scrivere un secondo blocco, non riscrivere l'app.
Non hardcodare **mai** un colore nel componente.

---

## 3. Tipografia

| Ruolo | Dimensione (desktop) | Peso | Uso |
|---|---|---|---|
| Display | 48–56px, tracking -2% | 800 | Titolo della schermata Today, come "Daily Work Priorities" nel concept |
| H1 | 32px | 700 | Titolo di una nota |
| H2 | 24px | 700 | Sezioni |
| Body | 15px, line-height 1.6 | 400 | Testo delle note |
| Body-sm | 13px | 400/500 | Metadati, liste, sidebar |
| Label | 11px, tracking +6%, maiuscolo | 600 | Etichette delle card ("Tasks", "Notes") |

Il display grande e bold è la cosa che rende riconoscibile il concept: **una sola
volta per schermata**, in cima. Se compare due volte, l'effetto si spegne.

Su mobile: display 34px, body 16px (sotto i 16px iOS zooma sugli input).

---

## 4. Layout

### Desktop (≥1024px) — tre colonne

```
┌────────────┬──────────────────────────┬──────────────────────┐
│ SIDEBAR    │ COLONNA CENTRALE         │ PANNELLO DESTRO      │
│ 240px      │ flessibile               │ 320-380px, chiudibile│
│            │                          │                      │
│ Today      │ contenuto della sezione  │ contesto:            │
│ Inbox (3)  │ (griglia bento in Today, │ • backlink           │
│ Cerca      │  lista in Library,       │ • tag e metadati     │
│ ─────      │  editor in una nota)     │ • riassunto AI       │
│ Spaces     │                          │ • highlight          │
│  ● Business│                          │                      │
│  ● Fitness │                          │                      │
│  ● Corsi   │                          │                      │
│ ─────      │                          │                      │
│ Goals      │                          │                      │
│ Habits     │                          │                      │
└────────────┴──────────────────────────┴──────────────────────┘
```

Larghezza massima del testo in lettura: **68 caratteri**. Il pannello destro
esiste proprio per non far diventare l'editor largo 1100px.

### Mobile (<768px)
Una colonna, tab bar in basso a 4 voci: **Today · Library · Cerca · Cattura**.
Il pannello destro diventa un bottom sheet.

### La griglia bento di Today
Grid a 12 colonne con `grid-auto-rows: 96px` e card che occupano span diversi
(2×1, 2×2, 4×2). Riproduce il ritmo del concept senza layout fatti a mano.

---

## 5. Componenti chiave

**Card colorata.** Il mattone del sistema. Fondo pieno del colore dello Space,
testo scuro (`--color-on-accent`), `--radius-lg`, padding 20px, nessuna ombra
(le ombre sul nero non si vedono: il rilievo lo dà il colore). Hover: `scale
1.01` + leggero schiarimento. Mai più di **4 colori diversi visibili
contemporaneamente** in una schermata: sopra quella soglia diventa rumore.

**Item row (lista).** Barra colorata verticale a sinistra (4px, colore dello
Space) + titolo + riga di metadati con le icone della fonte, come le righe
"Tasks" del concept. È il componente più usato dell'app: deve essere veloce da
scorrere e alto ~56px, non 90.

**Command palette (⌘K).** Il vero centro di navigazione: cerca, crea, apre,
smista, esegue azioni. Su desktop deve essere possibile usare l'intera app senza
mouse. È anche il posto dove vive la ricerca ibrida.

**Capture bar (⌘N).** Un campo singolo: incolli un URL o scrivi un pensiero, si
chiude. Nessun form con dieci campi al momento della cattura.

**Suggestion chip.** Quando l'AI propone destinazione e tag: chip con bordo
tratteggiato e due tasti (conferma / cambia). Deve essere ovvio a colpo d'occhio
cosa è stato deciso dall'AI e cosa da te.

**Stato vuoto.** Ogni lista vuota ha un'illustrazione minima, una frase e
**un'azione**. Mai un contenitore vuoto e basta.

---

## 6. Motion (Motion / ex Framer Motion)

| Movimento | Durata | Curva |
|---|---|---|
| Hover, colori | 120 ms | `ease-out` |
| Entrata di card e pannelli | 220 ms | `[0.32, 0.72, 0, 1]` |
| Transizioni di layout (bento, riordino) | 320 ms | spring `stiffness 300, damping 30` |
| Bottom sheet, modali | 260 ms | `ease-out` |

Tre regole: **niente animazioni su ciò che si usa cento volte al giorno** (le
righe di lista non rimbalzano); rispettare sempre `prefers-reduced-motion`;
un'animazione che ritarda un'informazione è un bug, non un tocco di classe.

---

## 7. Accessibilità (non negoziabile, e fa bene anche a chi ci vede benissimo)

- Contrasto minimo **4.5:1** per il testo. Il testo scuro sulle card gialla e
  verde passa; **testo bianco su viola o rosso no** → sulle card colorate il
  testo è sempre `--color-on-accent`.
- Ogni interazione ha uno **stato focus visibile** (ring 2px, offset 2px). Non
  rimuovere mai l'outline senza sostituirlo.
- Target touch ≥ **44×44px** su mobile.
- Il colore non è mai l'**unico** portatore di informazione: accanto al colore
  dello Space c'è sempre il nome o un'icona.
- shadcn/ui + Radix danno gratis semantica, ruoli ARIA e navigazione da tastiera:
  è metà del motivo per cui li usiamo. Non riscrivere a mano un dropdown.
