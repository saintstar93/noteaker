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

## 0. L'indirizzo a cui parlare

In locale, Noteaker gira sulla porta **3100** (non la 3000: là girava un altro
progetto, e due server sulla stessa porta rendono imprevedibile chi risponde).

| Da dove | Indirizzo |
|---|---|
| Dal Mac | `http://localhost:3100` |
| **Dall'iPhone**, stesso Wi-Fi | `http://192.168.1.122:3100` |

L'IP del Mac lo ricavi in ogni momento con:

```bash
ipconfig getifaddr en0
```

⚠️ **Cambia** quando il router riassegna gli indirizzi. Se un giorno lo Shortcut
smette di funzionare senza motivo, ricontrolla prima questo. Quando l'app sarà
su Vercel, l'indirizzo diventerà un dominio stabile e il problema sparisce.

---

## 1. Crea il token

Nell'app, **sidebar → Impostazioni** (`http://localhost:3100/impostazioni`) →
**Crea token**. Chiamalo `iPhone`.

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
| URL | `http://192.168.1.122:3100/api/capture` (in locale) |
| Metodo | `POST` |
| Intestazioni | `X-Noteaker-Token` → il token copiato prima |
| | `Content-Type` → `application/json` |
| Corpo richiesta | **JSON** |

Nel corpo JSON, due campi:

| Chiave | Tipo | Valore |
|---|---|---|
| `url` | Testo | **Input dello Shortcut** (la variabile magica) |
| `source` | Testo | `ios_shortcut` |

> Il telefono deve stare sullo **stesso Wi-Fi** del Mac, e `pnpm dev` deve
> essere acceso. Questo percorso è stato provato davvero: una chiamata dalla
> rete a quell'indirizzo arriva, riconosce il tipo di contenuto e finisce in
> Inbox.

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
| Nessuna risposta | Il telefono non raggiunge il Mac | Stesso Wi-Fi? `pnpm dev` acceso? L'IP è ancora quello (`ipconfig getifaddr en0`)? |
| Risponde ma è un'altra app | Un altro progetto occupa la stessa porta | Noteaker sta sulla **3100**; controlla con `lsof -nP -iTCP:3100 -sTCP:LISTEN` |

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
