# Shortcut iOS — "Salva su Noteaker"

Guida operativa per Daniele. Dieci minuti una volta sola, poi salvi qualsiasi
cosa dall'iPhone col menu Condividi.

---

## Perché uno Shortcut e non l'app

Su iPhone una PWA **non può** comparire nel menu "Condividi": WebKit non
implementa la Web Share Target API, il bug è aperto dal 2019 e a oggi non è
risolto. Chi promette il contrario si sbaglia.

Gli **Shortcut**, invece, nello share sheet ci stanno. Ricevono l'URL condiviso
e possono fare una chiamata HTTP. Risultato identico per te, venti righe di
configurazione invece di un'app nativa da mantenere.

---

## 1. Crea il token

Nell'app, **Impostazioni → Cattura → Crea token**. Chiamalo `iPhone`.

Il token si vede **una volta sola**: copialo subito. In database c'è solo la
sua impronta, quindi nemmeno l'app può rileggertelo. Se lo perdi, ne crei un
altro e revochi il vecchio.

Ha questa forma: `ntk_` seguito da 64 caratteri.

---

## 2. Crea lo Shortcut

Apri **Comandi Rapidi** (Shortcuts) → **+** in alto a destra.

### a. Rendilo disponibile nel menu Condividi

Tocca il nome dello Shortcut in alto → **Dettagli** → attiva **Mostra nel foglio
di condivisione**. In "Tipi di input accettati" lascia **URL** e **Testo**.

### b. Aggiungi l'azione di rete

Cerca e aggiungi **Ottieni contenuto da URL**, poi configurala così:

| Campo | Valore |
|---|---|
| URL | `https://TUO-DOMINIO/api/capture` |
| Metodo | `POST` |
| Intestazioni | `X-Noteaker-Token` → il token copiato prima |
| | `Content-Type` → `application/json` |
| Corpo richiesta | **JSON** |

Nel corpo JSON, due campi:

| Chiave | Tipo | Valore |
|---|---|---|
| `url` | Testo | **Input dello Shortcut** (la variabile magica) |
| `source` | Testo | `ios_shortcut` |

> Finché lavori in locale, l'indirizzo è quello del Mac sulla rete di casa
> (`http://192.168.x.x:3000/api/capture`) e il telefono deve stare sullo stesso
> Wi-Fi. Quando l'app sarà su Vercel, diventa il dominio vero.

### c. Dagli un nome

`Salva su Noteaker`. Il nome è quello che vedrai nel menu Condividi.

---

## 3. Provalo

Apri Safari su una pagina qualsiasi → **Condividi** → scorri in fondo →
**Salva su Noteaker**.

Poi apri Noteaker: la pagina è in **Inbox**. In **Impostazioni → Ultime
chiamate** vedi la riga con il codice `202`, che vuol dire "ricevuto, lo
elaboro dopo".

### Se qualcosa non va

| Codice | Cosa vuol dire | Cosa fare |
|---|---|---|
| `401` | Token sbagliato, assente o revocato | Ricontrolla l'intestazione `X-Noteaker-Token`; se hai revocato il token, creane uno nuovo |
| `400` | Il corpo non ha né `url` né `text` | Controlla che la variabile "Input dello Shortcut" sia davvero dentro il campo `url` |
| `413` | Contenuto troppo grande | Stai mandando un testo enorme: manda l'URL |
| `429` | Più di 60 catture in un minuto | Aspetta un minuto; se non sei stato tu, **revoca il token** |
| Nessuna risposta | Il telefono non raggiunge il Mac | Stesso Wi-Fi? Il `pnpm dev` è acceso? |

---

## 4. Variante: salvare un pensiero invece di un link

Duplica lo Shortcut, chiamalo `Pensiero su Noteaker`, e nel corpo JSON usa
`text` al posto di `url`. Aggiungi in cima l'azione **Chiedi input** e passa
quella variabile a `text`.

È il modo più veloce in assoluto per catturare un'idea: due tocchi dalla
schermata di blocco, se metti lo Shortcut nei widget.

---

## Sicurezza, in breve

Il token è una password: chi ce l'ha può scrivere nella tua Inbox (non leggere:
l'endpoint accetta solo scritture). Per questo:

- **uno per fonte** — se l'iPhone si perde, revochi solo quello;
- lo si vede una volta sola e in database c'è solo l'impronta;
- l'endpoint accetta al massimo **60 richieste al minuto** per token;
- ogni chiamata è registrata: se vedi codici strani in "Ultime chiamate",
  revoca e ricrea.
