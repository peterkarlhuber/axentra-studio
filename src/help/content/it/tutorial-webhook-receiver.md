---
title: Tutorial - Creare un ricevitore di webhook
summary: Crea un piccolo ricevitore in Python o TypeScript che verifica la firma dei webhook di Axentra, provalo con un ping e un evento reale e controlla le consegne.
keywords: ricevitore di webhook, receiver, verificare la firma, firma webhook, HMAC-SHA256, Axentra-Signature, tutorial, Python, TypeScript, Node.js, esempio, integrazione, ping di test, deduplicare, duplicati
---

In questo tutorial crei un piccolo programma che riceve le richieste webhook di Axentra, verifica
che ciascuna sia autentica, ignora i duplicati e stampa l'evento. Poi lo colleghi a un endpoint, lo
provi con un ping e con un evento reale e impari a leggere le consegne quando qualcosa va storto.
Richiede circa 30 minuti. Il ricevitore è scritto due volte, in Python e in TypeScript (Node.js);
scegline uno.

## Cosa ti serve {#prerequisites}

- Un account Studio con `webhooks:manage` (proprietario o amministratore del prodotto) e, per il
  passo 7, `events:publish` in un tenant di test. Vedi [Webhook](help:webhooks) per le
  autorizzazioni.
- Il modulo del server `events` e un worker in esecuzione (chiedi ai tuoi operatori).
- Python 3.10 o successivo, oppure Node.js 22 o successivo. Non servono librerie aggiuntive.
- Un modo per rendere il tuo ricevitore raggiungibile tramite HTTPS pubblico (passo 1).

## Passo 1: ottenere un indirizzo HTTPS pubblico {#public-url}

Axentra invia webhook solo a URL `https://` pubblici. Rifiuta `localhost`, gli indirizzi di reti
private e il semplice `http://` (a meno che i tuoi operatori non li abbiano abilitati per un server
di sviluppo, vedi [regole per gli URL](help:webhooks#url-rules)). Per provare un ricevitore sul tuo
computer, usa un servizio di tunnel (per esempio ngrok o Cloudflare Tunnel) che inoltra un
indirizzo HTTPS pubblico a `http://localhost:8000`. Ottieni un indirizzo come
`https://example-tunnel.example.com`.

In produzione, esegui il ricevitore dietro il tuo normale web server HTTPS o load balancer.

## Passo 2: creare l'endpoint e copiare il segreto {#create-endpoint}

1. Apri [Webhook](app:webhooks) e scegli **Nuovo endpoint**.
2. **URL**: il tuo indirizzo pubblico più un percorso, per esempio `https://example-tunnel.example.com/hooks/axentra`.
3. **Descrizione**: `Tutorial receiver`.
4. **Tipi di evento**: aggiungi `tutorial.*`, così il ricevitore riceve solo gli eventi che invii
   nel passo 7.
5. **Filtro tenant**: scegli il tuo tenant di test.
6. Scegli **Crea endpoint**.
7. Copia il **Segreto di firma** (inizia con `whsec_`). Non potrai vederlo di nuovo. Seleziona
   **Ho conservato il segreto in modo sicuro** e scegli **Fatto**.

Rendi disponibile il segreto al ricevitore come variabile d'ambiente, mai nel codice sorgente:

```bash
export AXENTRA_WEBHOOK_SECRET='whsec_…'   # the value you copied
```

## Passo 3: capire la firma {#verify-signature}

Ogni richiesta contiene un header come questo:

```http
Axentra-Signature: t=1767225600,v1=9c1e…
```

- `t` è l'ora dell'invio, in secondi Unix.
- `v1` è un HMAC-SHA256 codificato in esadecimale. Durante una rotazione del segreto con periodo
  di tolleranza, l'header contiene **due** valori `v1` (prima il nuovo segreto, poi quello
  precedente): accetta la richiesta se **uno qualsiasi** di essi corrisponde.

Per verificare una richiesta:

1. Leggi il corpo **grezzo** della richiesta come byte. Non analizzare e riserializzare prima il
   JSON: qualsiasi modifica di spaziatura o di ordine delle chiavi invalida la firma.
2. Dividi l'header in corrispondenza delle virgole, poi ogni parte al primo `=`. Prendi `t` e tutti
   i valori `v1`. Se manca `t` o mancano tutti i `v1`, rifiuta la richiesta.
3. Rifiuta la richiesta se `t` si discosta di più di 300 secondi dall'ora attuale. Così nessuno può
   riprodurre una vecchia richiesta registrata.
4. Calcola `HMAC-SHA256(key = the secret, message = t + "." + raw body)`, codificato in esadecimale
   minuscolo. La chiave è la stringa completa del segreto, **compreso** il prefisso `whsec_`, come
   byte UTF-8. Il messaggio è composto dalle cifre di `t`, un punto e i byte del corpo.
5. Confronta il tuo risultato con ogni valore `v1` usando un confronto **a tempo costante**, così
   un attaccante non può indovinare la firma dai tempi di risposta.

Axentra consegna **almeno una volta**, quindi lo stesso evento può arrivare più volte. Dopo la
verifica della firma, guarda `Axentra-Event-Id` (uguale all'`id` del corpo): se hai già elaborato
questo id, rispondi `200` e non fare nulla. Rispondi entro 10 secondi; Axentra considera una
risposta più lenta come un errore e riprova. Se l'elaborazione richiede tempo, salva l'evento e
rispondi subito.

> [!TIP]
> Se il tuo ricevitore è scritto in Python e può installare il pacchetto `axentra`, la sua funzione
> `axentra.events.verify_signature(secret, header, body)` esegue per te i passi da 2 a 5.

## Passo 4: scrivere il ricevitore in Python {#python}

Salva questo codice come `receiver.py`. Usa solo la libreria standard e resta in ascolto sulla
porta 8000.

```python
import hashlib
import hmac
import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ["AXENTRA_WEBHOOK_SECRET"]  # the complete value, including "whsec_"
TOLERANCE_SECONDS = 300
seen_event_ids: set[str] = set()  # use a database table in production


def verify_signature(secret: str, header: str, body: bytes) -> bool:
    timestamp = None
    signatures = []
    for part in header.split(","):
        key, _, value = part.strip().partition("=")
        if key == "t" and value.isdigit():
            timestamp = int(value)
        elif key == "v1":
            signatures.append(value)
    if timestamp is None or not signatures:
        return False
    if abs(time.time() - timestamp) > TOLERANCE_SECONDS:
        return False
    message = f"{timestamp}.".encode() + body
    expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, signature) for signature in signatures)


class Receiver(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        if not verify_signature(SECRET, self.headers.get("Axentra-Signature", ""), body):
            self.reply(401, "invalid signature")
            return
        event_id = self.headers.get("Axentra-Event-Id", "")
        if event_id in seen_event_ids:
            self.reply(200, "duplicate, ignored")
            return
        event = json.loads(body)
        print(f"{event['type']} {event['id']} tenant={event['tenant_id']} data={event['data']}")
        seen_event_ids.add(event_id)
        self.reply(200, "ok")

    def reply(self, status: int, text: str) -> None:
        data = text.encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/plain")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 8000), Receiver).serve_forever()
```

Avvialo:

```bash
python3 receiver.py
```

## Passo 5: oppure scriverlo in TypeScript {#typescript}

Salva questo codice come `receiver.ts`. Usa solo moduli integrati di Node.js (`node:http`,
`node:crypto`). `timingSafeEqual` è il confronto a tempo costante; richiede che entrambi i valori
abbiano la stessa lunghezza, da qui il controllo della lunghezza.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer, type ServerResponse } from 'node:http';

const SECRET = process.env.AXENTRA_WEBHOOK_SECRET ?? ''; // the complete value, including "whsec_"
const TOLERANCE_SECONDS = 300;
const seenEventIds = new Set<string>(); // use a database table in production

export function verifySignature(secret: string, header: string, body: Buffer): boolean {
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const [key = '', ...rest] = part.trim().split('=');
    const value = rest.join('=');
    if (key === 't' && /^\d+$/.test(value)) timestamp = Number(value);
    else if (key === 'v1') signatures.push(value);
  }
  if (timestamp === null || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(
    createHmac('sha256', secret).update(`${timestamp}.`).update(body).digest('hex'),
  );
  return signatures.some((signature) => {
    const candidate = Buffer.from(signature);
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

function reply(res: ServerResponse, status: number, text: string) {
  res.writeHead(status, { 'Content-Type': 'text/plain' }).end(text);
}

createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks); // the raw bytes, exactly as received
    const header = req.headers['axentra-signature'];
    if (
      req.method !== 'POST' ||
      typeof header !== 'string' ||
      !verifySignature(SECRET, header, body)
    ) {
      reply(res, 401, 'invalid signature');
      return;
    }
    const eventId = String(req.headers['axentra-event-id'] ?? '');
    if (seenEventIds.has(eventId)) {
      reply(res, 200, 'duplicate, ignored');
      return;
    }
    const event = JSON.parse(body.toString('utf8')) as {
      id: string;
      type: string;
      tenant_id: string | null;
      data: Record<string, unknown>;
    };
    console.log(
      `${event.type} ${event.id} tenant=${event.tenant_id} data=${JSON.stringify(event.data)}`,
    );
    seenEventIds.add(eventId);
    reply(res, 200, 'ok');
  });
}).listen(8000);
```

Avvialo con Node.js 22 o successivo (oppure compilalo prima con `tsc`):

```bash
node --experimental-strip-types receiver.ts
```

> [!NOTE]
> Entrambi gli esempi ricordano gli id degli eventi elaborati in memoria, che va persa al riavvio.
> In un ricevitore reale, salvali in una tabella del database con un indice univoco sull'id
> dell'evento, nella stessa transazione del lavoro che l'evento attiva.

## Passo 6: provare in locale, poi con un ping {#test}

Per prima cosa controlla il ricevitore sul tuo computer con una richiesta firmata da te (sostituisci
il segreto con il tuo):

```bash
SECRET='whsec_…'
BODY='{"id":"evt_local_1","type":"tutorial.hello","tenant_id":null,"data":{}}'
T=$(date +%s)
SIG=$(printf '%s' "$T.$BODY" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.*= //')
curl -i -X POST http://localhost:8000/hooks/axentra \
  -H 'Content-Type: application/json' \
  -H 'Axentra-Event-Id: evt_local_1' \
  -H "Axentra-Signature: t=$T,v1=$SIG" \
  --data "$BODY"
```

La risposta è `200` con `ok`; se la invii di nuovo ottieni `duplicate, ignored`. Se cambi un
carattere di `SIG` ottieni `401`.

Ora lascia che sia Axentra a chiamarlo:

1. Apri il tuo endpoint in [Webhook](app:webhooks) e scegli **Invia ping di test**.
2. Studio mostra **Ping di test consegnato (HTTP 200)** e apre la consegna. Il tuo ricevitore stampa
   una riga che inizia con `axentra.ping`.

Il ping viene inviato una sola volta, senza nuovi tentativi. Il suo `id` è l'id della consegna,
quindi ogni ping risulta nuovo per la tua deduplicazione.

## Passo 7: inviare un evento reale {#real-event}

1. Apri [Eventi](app:events) e scegli **Pubblica evento**.
2. Scegli il tuo **Tenant** di test, inserisci il **Tipo** `tutorial.hello` e i **Dati**
   `{"message": "Hello, receiver"}`.
3. Scegli **Pubblica**.

Entro pochi secondi il ricevitore stampa `tutorial.hello evt_… tenant=… data=…`. Nella scheda
**Consegne** dell'endpoint, la consegna risulta **Consegnata** con **Risposta** `200`.

## Passo 8: osservare un errore e consegnare di nuovo {#check-deliveries}

1. Arresta il ricevitore.
2. Pubblica un altro evento `tutorial.hello`.
3. Apri la scheda **Consegne** dell'endpoint e scegli **Aggiorna**. La consegna mostra **Non
   riuscita, nuovo tentativo**; i suoi dettagli mostrano l'**Ultimo errore** e il **Prossimo
   tentativo**.
4. Avvia di nuovo il ricevitore. Un tentativo automatico successivo va a buon fine oppure, se tutti
   i tentativi sono stati usati (circa 2-4¼ ore con le impostazioni predefinite; il secondo
   tentativo arriva 1-2 minuti dopo il primo), la consegna risulta **Esaurita**.
5. Per una consegna esaurita, apri i suoi dettagli e scegli **Consegna di nuovo**. Passa a **In
   attesa** e poi a **Consegnata**.

Come leggere i dettagli della consegna:

| Cosa vedi                                                   | Causa probabile                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Risposta** `401`, corpo `invalid signature`               | Segreto errato, corpo modificato prima della verifica, oppure l'orologio del ricevitore è sfasato. |
| **Risposta** `404` o `405`                                  | Percorso errato, oppure il ricevitore non accetta `POST`.                                          |
| **Risposta** `301`/`302`                                    | Un reindirizzamento; Axentra non li segue. Usa l'URL finale.                                       |
| Nessun codice di risposta, **Ultimo errore** con un timeout | Il ricevitore ha impiegato più di 10 secondi.                                                      |
| Nessun codice di risposta, `unresolvable: …`                | Il nome host non esiste (per esempio un tunnel scaduto).                                           |
| **Esaurita**, `refused: …`                                  | L'URL viene risolto in un indirizzo privato o locale.                                              |

## Passo 9: ruotare il segreto senza interruzioni {#rotate}

1. Nella pagina dell'endpoint, scegli **Ruota segreto**, seleziona come **Periodo di tolleranza**
   **24 ore** e conferma.
2. Copia il nuovo segreto. Il ricevitore continua a funzionare: ogni richiesta ora contiene una
   firma con il nuovo segreto e una con il vecchio, e il ricevitore accetta entrambe.
3. Inserisci il nuovo segreto in `AXENTRA_WEBHOOK_SECRET` e riavvia il ricevitore.
4. Scegli **Invia ping di test** per confermare. Dopo il periodo di tolleranza, solo il nuovo
   segreto firma le richieste.

## Risoluzione dei problemi {#troubleshooting}

**Ogni richiesta riceve 401, anche il test locale con curl.** Controlla che `AXENTRA_WEBHOOK_SECRET`
contenga il segreto completo, compreso `whsec_`, senza virgolette né a capo finale.

**Il test locale funziona, il ping di Axentra riceve 401.** Il ricevitore usa un segreto diverso da
quello dell'endpoint (per esempio quello precedente a una rotazione), un framework ha modificato il
corpo prima che tu lo leggessi (usa il corpo grezzo, non il JSON analizzato), oppure l'orologio del
ricevitore è sfasato di più di 5 minuti: sincronizzalo con NTP.

**“webhook urls must not point to local hosts” durante la creazione dell'endpoint.** Hai inserito
`localhost` o un indirizzo privato. Usa l'indirizzo HTTPS pubblico del tunnel.

**Il ping funziona, ma gli eventi pubblicati non arrivano.** Controlla i **Tipi di evento**
dell'endpoint (`tutorial.*` corrisponde a `tutorial.hello`), il **Filtro tenant** (deve essere il
tenant in cui hai pubblicato) e che l'endpoint sia **Attivato**. Se l'evento è nel registro eventi
ma non compare alcuna consegna, nessun worker è in esecuzione.

**Il ricevitore stampa lo stesso evento due volte dopo un riavvio.** L'elenco in memoria degli id
elaborati è andato perso. Salva gli id elaborati in modo persistente, come descritto nella nota del
passo 5.
