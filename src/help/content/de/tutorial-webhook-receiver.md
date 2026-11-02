---
title: Tutorial – Einen Webhook-Empfänger bauen
summary: Einen kleinen Empfänger in Python oder TypeScript bauen, der die Webhook-Signatur von Axentra prüft, ihn mit einem Ping und einem echten Ereignis testen und die Zustellungen kontrollieren.
keywords: Webhook-Empfänger, Webhook empfangen, Signatur prüfen, Signaturprüfung, HMAC-SHA256, Axentra-Signature, Tutorial, Anleitung, Python, TypeScript, Node.js, Beispiel, Integration, Test-Ping, Duplikate, Deduplizierung
---

In diesem Tutorial baust du ein kleines Programm, das die Webhook-Anfragen von Axentra empfängt,
bei jeder prüft, ob sie echt ist, Duplikate ignoriert und das Ereignis ausgibt. Danach verbindest
du es mit einem Endpunkt, testest es mit einem Ping und einem echten Ereignis und lernst, die
Zustellungen zu lesen, wenn etwas schiefgeht. Das dauert etwa 30 Minuten. Der Empfänger ist
zweimal geschrieben, in Python und in TypeScript (Node.js); such dir eine Variante aus.

## Was du brauchst {#prerequisites}

- Ein Studio-Konto mit `webhooks:manage` (Product owner oder Product admin) und für Schritt 7
  `events:publish` in einem Testmandanten. Zu den Berechtigungen siehe [Webhooks](help:webhooks).
- Das Servermodul `events` und einen laufenden Worker (frag deine Betreiber).
- Python 3.10 oder neuer oder Node.js 22 oder neuer. Zusätzliche Bibliotheken sind nicht nötig.
- Eine Möglichkeit, deinen Empfänger über öffentliches HTTPS erreichbar zu machen (Schritt 1).

## Schritt 1: Eine öffentliche HTTPS-Adresse besorgen {#public-url}

Axentra sendet Webhooks nur an öffentliche `https://`-URLs. Es lehnt `localhost`, private
Netzwerkadressen und reines `http://` ab (es sei denn, deine Betreiber haben das für einen
Entwicklungsserver erlaubt, siehe [URL-Regeln](help:webhooks#url-rules)). Um einen Empfänger auf
deinem eigenen Rechner zu testen, verwende einen Tunneldienst (zum Beispiel ngrok oder Cloudflare
Tunnel), der eine öffentliche HTTPS-Adresse an `http://localhost:8000` weiterleitet. Du erhältst
eine Adresse wie `https://example-tunnel.example.com`.

In Produktion betreibst du den Empfänger hinter deinem normalen HTTPS-Webserver oder Load
Balancer.

## Schritt 2: Den Endpunkt anlegen und das Geheimnis kopieren {#create-endpoint}

1. Öffne [Webhooks](app:webhooks) und wähle **Neuer Endpunkt**.
2. **URL**: deine öffentliche Adresse plus ein Pfad, zum Beispiel `https://example-tunnel.example.com/hooks/axentra`.
3. **Beschreibung**: `Tutorial receiver`.
4. **Ereignistypen**: Füge `tutorial.*` hinzu, damit der Empfänger nur die Ereignisse aus Schritt 7
   erhält.
5. **Mandantenfilter**: Wähle deinen Testmandanten.
6. Wähle **Endpunkt anlegen**.
7. Kopiere das **Signaturgeheimnis** (es beginnt mit `whsec_`). Du kannst es nicht noch einmal
   sehen. Setze den Haken bei **Ich habe das Geheimnis sicher gespeichert** und wähle **Fertig**.

Stelle das Geheimnis dem Empfänger als Umgebungsvariable bereit, nie im Quellcode:

```bash
export AXENTRA_WEBHOOK_SECRET='whsec_…'   # the value you copied
```

## Schritt 3: Die Signatur verstehen {#verify-signature}

Jede Anfrage trägt einen Header wie diesen:

```http
Axentra-Signature: t=1767225600,v1=9c1e…
```

- `t` ist der Sendezeitpunkt in Unix-Sekunden.
- `v1` ist ein hexadezimal codierter HMAC-SHA256. Während einer Erneuerung des Geheimnisses mit
  Übergangsfrist enthält der Header **zwei** `v1`-Werte (zuerst das neue, dann das bisherige
  Geheimnis): Akzeptiere die Anfrage, wenn **irgendeiner** davon passt.

So prüfst du eine Anfrage:

1. Lies den **unveränderten** Anfrage-Body als Bytes. Parse und serialisiere das JSON nicht vorher
   neu: Jede Änderung an Leerzeichen oder Schlüsselreihenfolge macht die Signatur ungültig.
2. Teile den Header an den Kommas und jeden Teil am ersten `=`. Nimm `t` und alle `v1`-Werte. Fehlt
   `t` oder fehlen alle `v1`, lehne die Anfrage ab.
3. Lehne die Anfrage ab, wenn `t` mehr als 300 Sekunden von deiner aktuellen Zeit abweicht. So kann
   niemand eine alte, mitgeschnittene Anfrage erneut einspielen.
4. Berechne `HMAC-SHA256(key = the secret, message = t + "." + raw body)`, hexadezimal in
   Kleinbuchstaben. Der Schlüssel ist die vollständige Geheimnis-Zeichenkette **einschließlich**
   des Präfixes `whsec_`, als UTF-8-Bytes. Die Nachricht besteht aus den Ziffern von `t`, einem
   Punkt und den Body-Bytes.
5. Vergleiche dein Ergebnis mit jedem `v1`-Wert über einen Vergleich in **konstanter Zeit**, damit
   Angreifer die Signatur nicht aus Antwortzeiten erraten können.

Axentra stellt **mindestens einmal** zu; dasselbe Ereignis kann also mehrfach ankommen. Sieh nach
der Signaturprüfung auf `Axentra-Event-Id` (identisch mit dem `id` im Body): Hast du diese ID schon
verarbeitet, antworte mit `200` und tu nichts. Antworte innerhalb von 10 Sekunden; eine langsamere
Antwort wertet Axentra als Fehler und versucht es erneut. Dauert die Verarbeitung lange, speichere
das Ereignis und antworte zuerst.

> [!TIP]
> Ist dein Empfänger in Python geschrieben und kann er das Paket `axentra` installieren, erledigt
> dessen Hilfsfunktion `axentra.events.verify_signature(secret, header, body)` die Schritte 2 bis
> 5 für dich.

## Schritt 4: Den Empfänger in Python schreiben {#python}

Speichere das als `receiver.py`. Es verwendet nur die Standardbibliothek und lauscht auf Port 8000.

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

Starte ihn:

```bash
python3 receiver.py
```

## Schritt 5: Oder in TypeScript schreiben {#typescript}

Speichere das als `receiver.ts`. Es verwendet nur eingebaute Module von Node.js (`node:http`,
`node:crypto`). `timingSafeEqual` ist der Vergleich in konstanter Zeit; er setzt voraus, dass beide
Werte gleich lang sind, daher die Längenprüfung.

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

Starte ihn mit Node.js 22 oder neuer (oder kompiliere ihn vorher mit `tsc`):

```bash
node --experimental-strip-types receiver.ts
```

> [!NOTE]
> Beide Beispiele merken sich verarbeitete Ereignis-IDs im Arbeitsspeicher, der bei einem Neustart
> verloren geht. Ein echter Empfänger speichert sie in einer Datenbanktabelle mit eindeutigem Index
> auf der Ereignis-ID, in derselben Transaktion wie die Arbeit, die das Ereignis auslöst.

## Schritt 6: Lokal testen, dann mit einem Ping {#test}

Prüfe den Empfänger zuerst auf deinem eigenen Rechner mit einer selbst signierten Anfrage (ersetze
das Geheimnis durch deines):

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

Die Antwort ist `200` mit `ok`; ein erneutes Senden liefert `duplicate, ignored`. Änderst du ein
Zeichen von `SIG`, erhältst du `401`.

Jetzt lässt du Axentra den Empfänger aufrufen:

1. Öffne deinen Endpunkt unter [Webhooks](app:webhooks) und wähle **Test-Ping senden**.
2. Studio zeigt **Test-Ping zugestellt (HTTP 200)** und öffnet die Zustellung. Dein Empfänger gibt
   eine Zeile aus, die mit `axentra.ping` beginnt.

Der Ping wird einmal gesendet, ohne Wiederholungen. Seine `id` ist die Zustellungs-ID; jeder Ping
ist für deine Deduplizierung also neu.

## Schritt 7: Ein echtes Ereignis senden {#real-event}

1. Öffne [Ereignisse](app:events) und wähle **Ereignis veröffentlichen**.
2. Wähle deinen Test-**Mandant**, gib als **Typ** `tutorial.hello` und als **Daten**
   `{"message": "Hello, receiver"}` ein.
3. Wähle **Veröffentlichen**.

Innerhalb weniger Sekunden gibt der Empfänger `tutorial.hello evt_… tenant=… data=…` aus. Im Tab
**Zustellungen** des Endpunkts ist die Zustellung **Zugestellt** mit **Antwort** `200`.

## Schritt 8: Einen Fehler beobachten und erneut zustellen {#check-deliveries}

1. Stoppe den Empfänger.
2. Veröffentliche ein weiteres Ereignis `tutorial.hello`.
3. Öffne den Tab **Zustellungen** des Endpunkts und wähle **Aktualisieren**. Die Zustellung zeigt
   **Fehlgeschlagen, wird wiederholt**; ihre Details zeigen **Letzter Fehler** und **Nächster
   Versuch**.
4. Starte den Empfänger wieder. Ein späterer automatischer Versuch gelingt, oder die Zustellung ist
   **Endgültig fehlgeschlagen**, wenn alle Versuche aufgebraucht sind (mit den Standardeinstellungen
   etwa zwei bis fünf Minuten).
5. Öffne bei einer endgültig fehlgeschlagenen Zustellung die Details und wähle **Erneut zustellen**.
   Die Zustellung erhält den Status **Ausstehend** und dann **Zugestellt**.

So liest du die Details einer Zustellung:

| Du siehst                                                   | Wahrscheinliche Ursache                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Antwort** `401`, Body `invalid signature`                 | Falsches Geheimnis, Body vor der Prüfung verändert oder die Uhr des Empfängers geht falsch. |
| **Antwort** `404` oder `405`                                | Falscher Pfad, oder der Empfänger akzeptiert kein `POST`.                                   |
| **Antwort** `301`/`302`                                     | Eine Weiterleitung; Axentra folgt ihr nicht. Verwende die endgültige URL.                   |
| Kein Antwortcode, **Letzter Fehler** mit Zeitüberschreitung | Der Empfänger hat länger als 10 Sekunden gebraucht.                                         |
| Kein Antwortcode, `unresolvable: …`                         | Den Hostnamen gibt es nicht (zum Beispiel ein abgelaufener Tunnel).                         |
| **Endgültig fehlgeschlagen**, `refused: …`                  | Die URL löst zu einer privaten oder lokalen Adresse auf.                                    |

## Schritt 9: Das Geheimnis ohne Ausfall erneuern {#rotate}

1. Wähle auf der Seite des Endpunkts **Geheimnis erneuern**, wähle als **Übergangsfrist**
   **24 Stunden** und bestätige.
2. Kopiere das neue Geheimnis. Der Empfänger funktioniert weiter: Jede Anfrage trägt jetzt eine
   Signatur mit dem neuen und eine mit dem alten Geheimnis, und der Empfänger akzeptiert beide.
3. Trage das neue Geheimnis in `AXENTRA_WEBHOOK_SECRET` ein und starte den Empfänger neu.
4. Wähle **Test-Ping senden** zur Bestätigung. Nach der Übergangsfrist signiert nur noch das neue
   Geheimnis die Anfragen.

## Fehlerbehebung {#troubleshooting}

**Jede Anfrage erhält 401, selbst der lokale curl-Test.** Prüfe, ob `AXENTRA_WEBHOOK_SECRET` das
vollständige Geheimnis einschließlich `whsec_` enthält, ohne Anführungszeichen oder abschließenden
Zeilenumbruch.

**Der lokale Test funktioniert, der Ping von Axentra erhält 401.** Der Empfänger verwendet ein
anderes Geheimnis als der Endpunkt (zum Beispiel eines von vor einer Erneuerung), ein Framework hat
den Body verändert, bevor du ihn gelesen hast (verwende den unveränderten Body, nicht das geparste
JSON), oder die Uhr des Empfängers weicht um mehr als 5 Minuten ab: Synchronisiere sie per NTP.

**„webhook urls must not point to local hosts“ beim Anlegen des Endpunkts.** Du hast `localhost`
oder eine private Adresse eingegeben. Verwende die öffentliche HTTPS-Adresse des Tunnels.

**Der Ping funktioniert, aber veröffentlichte Ereignisse kommen nicht an.** Prüfe die
**Ereignistypen** des Endpunkts (`tutorial.*` passt auf `tutorial.hello`), den **Mandantenfilter**
(er muss der Mandant sein, in dem du veröffentlicht hast) und ob der Endpunkt **Aktiviert** ist.
Steht das Ereignis im Ereignisprotokoll, erscheint aber keine Zustellung, läuft kein Worker.

**Der Empfänger gibt nach einem Neustart dasselbe Ereignis zweimal aus.** Die Liste der
verarbeiteten IDs im Arbeitsspeicher ist verloren gegangen. Speichere verarbeitete IDs dauerhaft,
wie im Hinweis in Schritt 5 beschrieben.
