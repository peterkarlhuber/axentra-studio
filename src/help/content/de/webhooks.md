---
title: Webhooks
summary: Sende Ereignisse als signierte HTTP-Anfragen an andere Systeme, verwalte das Signaturgeheimnis und prüfe, wiederhole und stelle Zustellungen erneut zu.
keywords: Webhook, Endpunkt, Callback, Rückruf, HTTP POST, Signaturgeheimnis, Signatur, HMAC, whsec, Geheimnis erneuern, Zustellung, erneut zustellen, Wiederholung, Test-Ping, Empfänger, Integration
---

Ein **Webhook** lässt ein anderes System von [Ereignissen](help:events) in deinem Produkt erfahren,
ohne dass es danach fragen muss. Du registrierst einen **Endpunkt**, also eine URL im anderen System,
und wählst, welche Ereignistypen er erhalten soll. Sobald ein passendes Ereignis veröffentlicht wird,
sendet Axentra eine HTTP-`POST`-Anfrage mit dem Ereignis als JSON an diese URL. Jede Anfrage ist mit
einem Geheimnis **signiert**, das nur Axentra und der Empfänger kennen, sodass der Empfänger prüfen
kann, ob die Anfrage echt ist. Jeder Versuch wird als **Zustellung** erfasst, die du dir ansehen und
erneut senden kannst.

> [!IMPORTANT]
> Webhooks erfordern das Servermodul `events`. Endpunkte und Zustellungen ansehen erfordert
> `webhooks:read` (Product owner, Product admin, Support und Product viewer). Anlegen, Bearbeiten,
> Testen, Geheimnis erneuern, erneutes Zustellen und Löschen erfordern `webhooks:manage` (Product owner
> und Product admin); ohne diese Berechtigung sind die Buttons ausgeblendet und **Einstellungen** ist
> schreibgeschützt. Damit Zustellungen gesendet werden, muss ein Worker-Prozess laufen.

## Wie die Zustellung funktioniert {#how-it-works}

```diagram
webhook-delivery
```

1. Dein Produkt veröffentlicht ein Ereignis, zum Beispiel `invoice.created` im Mandanten `acme`.
2. Ein Worker sucht **aktivierte** Endpunkte, deren **Ereignistypen** zum Typ passen und deren
   **Mandantenfilter** leer ist oder dem Mandanten des Ereignisses entspricht. Für jeden Treffer legt
   er eine Zustellung mit dem Status **Ausstehend** an.
3. Der Worker sendet die signierte Anfrage. Eine `2xx`-Antwort setzt die Zustellung auf **Zugestellt**.
4. Jede andere Antwort, eine Zeitüberschreitung oder ein Verbindungsfehler setzt sie auf
   **Fehlgeschlagen, wird wiederholt**: Die Zustellung wird nach einer wachsenden Wartezeit erneut gesendet. Nach
   dem letzten Versuch ist sie **Endgültig fehlgeschlagen**.
5. Eine Zustellung, die nicht ausstehend ist, kannst du **Erneut zustellen**, zum Beispiel nachdem du
   den Empfänger repariert hast.

Zustellungen erfolgen **mindestens einmal**: Ein Empfänger kann dasselbe Ereignis zweimal erhalten
(zum Beispiel wenn seine `200`-Antwort verloren ging). Empfänger sollten sich die Ereignis-ID merken
und Duplikate ignorieren. Zwischen Ereignissen gibt es keine garantierte Reihenfolge.

## Einen Endpunkt anlegen {#create}

1. Öffne [Webhooks](app:webhooks) und wähle **Neuer Endpunkt**.
2. Gib die **URL** ein, die die Anfragen erhalten soll.
3. Optional: eine **Beschreibung** (bis zu 1000 Zeichen), zum Beispiel wem der Empfänger gehört.
4. Füge die **Ereignistypen** hinzu: Tippe einen Typ oder ein Muster ein und drücke Enter oder wähle
   **Typ hinzufügen**. Studio schlägt Typen vor, die es in jüngsten Ereignissen gesehen hat, sowie
   **\* (alle Typen)**.
5. Optional: Wähle einen **Mandantenfilter** und schalte **Aktiviert** aus, wenn der Empfänger noch
   nicht bereit ist.
6. Wähle **Endpunkt anlegen**.
7. Kopiere das angezeigte **Signaturgeheimnis**, hinterlege es für den Empfänger, hake **Ich habe das
   Geheimnis sicher gespeichert** an und wähle **Fertig**. Siehe
   [Das Signaturgeheimnis speichern](help:webhooks#signing-secret).

Studio öffnet dann die Seite des Endpunkts.

### URL-Regeln {#url-rules}

Damit Webhooks nicht genutzt werden können, um interne Systeme zu erreichen, prüft der Server jede URL
beim Speichern und erneut vor jeder Zustellung:

- Die URL muss mit `https://` beginnen. Einfaches `http://` akzeptieren nur Server außerhalb der
  Produktion, deren Betreiber `events.webhook_allow_http` aktiviert haben.
- Die URL darf weder Benutzername noch Passwort (`https://user:pass@…`) noch ein Fragment (`#…`) enthalten.
- `localhost` und Hostnamen, die auf `.local`, `.localhost` oder `.internal` enden, werden abgelehnt.
- Der Hostname wird aufgelöst, und **jede** Adresse, auf die er zeigt, muss öffentlich sein. Private
  Netze (etwa `10.x`, `192.168.x`), Loopback-, Link-Local- und andere Sonderadressen werden abgelehnt,
  sofern die Betreiber nicht `events.webhook_allow_private_targets` setzen (gedacht für die
  Entwicklung, in der Produktion nur mit einer zusätzlichen Übersteuerung).
- Höchstens 2000 Zeichen.

Weiterleitungen werden nicht verfolgt: Eine `301`- oder `302`-Antwort gilt als Fehlschlag. Verwende
die endgültige URL.

### Ereignistypen wählen {#event-types}

Jeder Endpunkt hat 1 bis 50 Ereignistyp-Muster. Verwende exakte Typen (`invoice.created`), Muster mit
`*` (`invoice.*`, `*.deleted`) oder `*` für alle Typen. Muster bestehen aus Kleinbuchstaben, Ziffern,
`_ . : -` und `*`. Ereignisse mit reservierten Typen (`axentra.…`) werden nie an Endpunkte gesendet,
außer dem Test-Ping.

### Mandantenfilter {#tenant-filter}

Ohne Mandantenfilter erhält der Endpunkt passende Ereignisse **aller Mandanten** sowie Ereignisse auf
Produktebene. Mit Filter erhält er nur die Ereignisse dieses Mandanten. Der Mandantenfilter lässt sich
später nicht ändern; lege stattdessen einen neuen Endpunkt an.

## Das Signaturgeheimnis speichern {#signing-secret}

Wenn du einen Endpunkt anlegst (und wenn du sein Geheimnis erneuerst), erzeugt Axentra ein
Signaturgeheimnis, das mit `whsec_` beginnt. Es wird **nur einmal** angezeigt. Axentra speichert es
verschlüsselt und zeigt es nie wieder an.

> [!CAUTION]
> Hinterlege das Geheimnis sofort im Geheimnisspeicher deines Empfängers. Wer es kennt, kann Anfragen
> senden, die dein Empfänger als echt akzeptiert. Verlierst du es oder wird es bekannt,
> [erneuere das Geheimnis](help:webhooks#rotate-secret).

Der Empfänger prüft mit dem Geheimnis den Header `Axentra-Signature` jeder Anfrage. Das
[Tutorial zum Webhook-Empfänger](help:tutorial-webhook-receiver#verify-signature) zeigt den genauen
Algorithmus mit Python- und TypeScript-Code.

## Einen Test-Ping senden {#test}

Wähle auf der Seite des Endpunkts **Test-Ping senden**. Axentra sendet sofort eine signierte Anfrage
mit dem Typ `axentra.ping` und wartet auf die Antwort. Studio meldet **Test-Ping zugestellt (HTTP 200)** oder **Test-Ping fehlgeschlagen** mit dem Statuscode oder Fehler und öffnet die erfasste
Zustellung.

Ein Test-Ping wird einmal gesendet, ohne Wiederholungen, und auch an einen deaktivierten Endpunkt,
sodass du einen Empfänger testen kannst, bevor du ihn aktivierst. Sein Body enthält
`"type": "axentra.ping"`, `"data": {"endpoint_id": "…"}` und die Zustellungs-ID als `id`.

## Zustellungen prüfen {#deliveries}

Der Tab **Zustellungen** eines Endpunkts listet seine Zustellungen, die neuesten zuerst: **Ereignis**
(Typ und Zustellungs-ID), **Status**, **Antwort** (der HTTP-Statuscode), **Versuche**, **Dauer** und
**Erstellt**. Filtere nach **Status**; **Aktualisieren** lädt den neuesten Stand.

### Zustellungsstatus {#delivery-statuses}

| Status                              | Bedeutung                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Ausstehend**                      | Wartet auf das Senden, wird gerade gesendet oder wurde durch **Erneut zustellen** wieder eingereiht.                     |
| **Zugestellt**                      | Der Empfänger hat mit einem `2xx`-Status geantwortet.                                                                    |
| **Fehlgeschlagen, wird wiederholt** | Der letzte Versuch ist fehlgeschlagen; ein weiterer Versuch ist geplant (**Nächster Versuch**).                          |
| **Endgültig fehlgeschlagen**        | Keine automatischen Versuche mehr: Alle wurden verbraucht, die URL wurde abgelehnt, oder der Endpunkt wurde deaktiviert. |

### Zustellungsdetails {#delivery-detail}

Wähle das Details-Symbol am Ende einer Zeile. Das Panel zeigt **Zustellungs-ID**, **Status**,
**Antwort**, **Versuche**, **Dauer**, die **Ereignis-ID**, den **Job**, der sie sendet (ein Link zum
[Job](help:jobs#job-detail)), **Erstellt**, **Zugestellt** und **Nächster Versuch** sowie:

- **Letzter Fehler**: zum Beispiel `HTTP 500`, eine Zeitüberschreitung, `unresolvable: …` oder
  `refused: …`;
- **Antworttext**: die ersten 4096 Bytes (Standard) dessen, was der Empfänger geantwortet hat. Gibt
  dein Empfänger einen kurzen Fehlertext zurück, lassen sich Probleme hier leichter diagnostizieren.

## Wiederholungen {#retries}

Fehlgeschlagene Zustellungen werden automatisch über die Job-Warteschlange wiederholt, mit den
Standardeinstellungen bis zu **8 Versuche** (`events.webhook_max_attempts`). Die Wartezeit vor Versuch
_n + 1_ liegt zwischen der Hälfte und dem Ganzen von `2 × 2^(n−1)` Sekunden (2, 4, 8 … 128 Sekunden),
sodass mit den Standardeinstellungen alle Versuche innerhalb von etwa zwei bis fünf Minuten verbraucht
sind. Jeder Versuch wartet höchstens 10 Sekunden auf die Verbindung und auf jedes Lesen der Antwort.

Ein Empfänger, der länger ausfällt, verliert keine Ereignisse, aber seine Zustellungen enden als
**Endgültig fehlgeschlagen**: Stelle sie erneut zu, sobald er wieder erreichbar ist. Axentra
deaktiviert dauerhaft fehlschlagende Endpunkte nicht und hat kein Ratenlimit pro Endpunkt.

Zwei Fälle beenden eine Zustellung ohne weitere Versuche: eine URL, die der Server ablehnt (siehe
[URL-Regeln](help:webhooks#url-rules)), und ein Endpunkt, der deaktiviert wurde, während die Zustellung
wartete. Ein Hostname, der sich nicht auflösen lässt, wird erneut versucht.

## Erneut zustellen {#redeliver}

1. Öffne die Details der Zustellung.
2. Wähle **Erneut zustellen**.

Die Zustellung wird **Ausstehend** und mit einem frischen Satz an Versuchen erneut gesendet. Der Zähler
**Versuche** zählt weiter. **Erneut zustellen** wird nicht angeboten, solange die Zustellung
**Ausstehend** ist. Der Empfänger erhält dieselbe Ereignis-ID erneut, sodass ein deduplizierender
Empfänger bereits verarbeitete Ereignisse ignoriert.

## Das Signaturgeheimnis erneuern {#rotate-secret}

Erneuere das Geheimnis, wenn es bekannt geworden sein könnte, wenn jemand ausscheidet, der es kannte,
oder regelmäßig als gute Praxis.

1. Wähle auf der Seite des Endpunkts **Geheimnis erneuern**.
2. Wähle eine **Übergangsfrist**: **Keine (altes Geheimnis sofort ungültig)**, **1 Stunde**,
   **24 Stunden** oder **7 Tage**.
3. Wähle **Geheimnis erneuern** und kopiere und speichere dann das neue Geheimnis wie beim Anlegen.

Während der Übergangsfrist trägt jede Anfrage **zwei** Signaturen: eine mit dem neuen und eine mit dem
bisherigen Geheimnis. Ein Empfänger, der noch das alte Geheimnis hat, funktioniert weiter, während du
ihn umstellst. Die Seite des Endpunkts zeigt **Bisheriges Geheimnis noch gültig**, bis die Frist endet.

> [!TIP]
> So erneuerst du ohne fehlgeschlagene Zustellungen: Wähle eine Übergangsfrist, hinterlege das neue
> Geheimnis beim Empfänger und prüfe, ob Zustellungen weiterhin gelingen, bevor die Frist endet. Mit
> **Keine** lehnt der Empfänger jede Anfrage ab, bis er das neue Geheimnis hat.

## Einen Endpunkt bearbeiten oder deaktivieren {#edit}

Öffne den Tab **Einstellungen** des Endpunkts, ändere **URL**, **Beschreibung**, **Ereignistypen**
oder **Aktiviert** und wähle **Änderungen speichern**. **Änderungen verwerfen** stellt die
gespeicherten Werte wieder her.

Schaltest du **Aktiviert** aus, werden keine neuen Zustellungen mehr gesendet. Zustellungen, die noch
auf einen Versuch warteten, enden als **Endgültig fehlgeschlagen** mit dem Fehler `endpoint disabled`;
stelle sie erneut zu, nachdem du den Endpunkt wieder aktiviert hast. Ereignisse, die veröffentlicht
wurden, während der Endpunkt deaktiviert war, werden nicht nachträglich zugestellt.

## Einen Endpunkt löschen {#delete}

Wähle **Endpunkt löschen** und bestätige. Der Endpunkt erhält nichts mehr, und sein Zustellverlauf wird
mitgelöscht. Das lässt sich nicht rückgängig machen. Um einen Endpunkt zu pausieren, deaktiviere ihn
stattdessen.

## Anfrageformat {#request-format}

```http
POST /hooks/axentra HTTP/1.1
Host: example.com
Content-Type: application/json
User-Agent: Axentra-Webhooks/1
Axentra-Event: invoice.created
Axentra-Event-Id: evt_01EXAMPLE
Axentra-Delivery: dlv_01EXAMPLE
Axentra-Signature: t=1767225600,v1=9c1e…(64 hex characters)

{"data":{"invoice_id":"inv_123"},"id":"evt_01EXAMPLE","occurred_at":"2026-01-01T00:00:00+00:00","product_id":"prd_01EXAMPLE","tenant_id":"ten_01EXAMPLE","type":"invoice.created"}
```

| Feld                      | Inhalt                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `id`                      | Ereignis-ID, identisch mit dem Header `Axentra-Event-Id`. Verwende sie zum Deduplizieren. |
| `type`                    | Ereignistyp.                                                                              |
| `product_id`, `tenant_id` | Wo das Ereignis eingetreten ist; `tenant_id` ist bei Ereignissen auf Produktebene `null`. |
| `occurred_at`             | Wann das Ereignis eingetreten ist (ISO 8601, UTC).                                        |
| `data`                    | Das Datenobjekt des Ereignisses.                                                          |

`Axentra-Delivery` identifiziert die Zustellung und ist für alle Versuche und erneuten Zustellungen
gleich. Prüfe die Signatur über die **rohen** Bytes des Bodys; parse und serialisiere das JSON nicht
vorher neu.

## Einstellungen {#settings}

| Einstellung                     | Was sie bewirkt                                           | Erlaubte Werte / Standard                                               |
| ------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| **URL**                         | Wohin Anfragen gesendet werden.                           | `https://`-URL, öffentlicher Host, höchstens 2000 Zeichen. Pflichtfeld. |
| **Beschreibung**                | Notiz für Menschen.                                       | Bis zu 1000 Zeichen.                                                    |
| **Ereignistypen**               | Welche Ereignisse gesendet werden.                        | 1 bis 50 Typen oder Muster mit `*`. Pflichtfeld.                        |
| **Mandantenfilter**             | Beschränkt den Endpunkt auf einen Mandanten.              | Ein Mandant oder **Alle Mandanten**. Nur beim Anlegen.                  |
| **Aktiviert**                   | Ob neue Zustellungen gesendet werden.                     | Standardmäßig an.                                                       |
| **Übergangsfrist** (Erneuerung) | Wie lange das bisherige Geheimnis noch Anfragen signiert. | Keine, 1 Stunde, 24 Stunden, 7 Tage (API: bis zu 7 Tage in Sekunden).   |

Serverseitige Standardwerte (Betreiber können sie in `[events]` ändern): 8 Versuche, 10 Sekunden
Zeitlimit, 4096 Bytes gespeicherter Antworttext.

## Gut zu wissen {#good-to-know}

- Endpunkte, Zustellungen, Tests und Erneuerungen gibt es auch über die API unter
  `/v1/products/{product_id}/webhooks`; siehe [API-Grundlagen](help:api-basics).
- Anlegen, Ändern, Löschen, Testen, Erneuern und erneutes Zustellen werden im
  [Audit-Protokoll](help:audit) erfasst.
- Zugestellte und endgültig fehlgeschlagene Zustellungen werden nach der Aufbewahrungsfrist
  (standardmäßig 30 Tage) gelöscht.

## Fehlerbehebung {#troubleshooting}

**„webhook urls must use https“.** Verwende eine `https://`-URL. `http://` funktioniert nur auf
Entwicklungsservern, die es erlauben.

**„webhook urls must not point to local hosts“ oder „… private, loopback or link-local addresses“.**
Die URL zeigt auf deinen eigenen Rechner oder ein internes Netz. Verwende eine öffentliche
HTTPS-Adresse, während der Entwicklung zum Beispiel über einen Tunnel-Dienst (siehe das
[Tutorial](help:tutorial-webhook-receiver#public-url)).

**„event_types needs 1-50 type patterns“.** Füge mindestens einen Ereignistyp hinzu oder `*` für alle.

**Test-Ping fehlgeschlagen mit HTTP 401 oder 403.** Der Empfänger hat die Signatur abgelehnt. Prüfe,
ob er das aktuelle Geheimnis (den vollständigen Wert einschließlich `whsec_`), den rohen Anfrage-Body
und eine korrekte Uhr verwendet (Zeitstempel, die älter als etwa 5 Minuten sind, werden abgelehnt).

**Test-Ping fehlgeschlagen mit HTTP 404 oder 405.** Der Pfad ist falsch, oder der Empfänger nimmt kein
`POST` an.

**Test-Ping fehlgeschlagen ohne Statuscode.** Der Empfänger war nicht erreichbar: Lies **Letzter
Fehler**. `unresolvable` bedeutet, dass der Hostname im DNS nicht existiert; eine Zeitüberschreitung
bedeutet, dass der Empfänger nicht innerhalb von 10 Sekunden geantwortet hat. Antworte schnell und
erledige langsame Arbeit nach der Antwort.

**Zustellungen sind Endgültig fehlgeschlagen mit „refused: …“.** Der Host löst jetzt auf eine private
Adresse auf. Korrigiere den DNS-Eintrag oder die URL und stelle dann erneut zu.

**Zustellungen sind Endgültig fehlgeschlagen mit „endpoint disabled“.** Der Endpunkt wurde
deaktiviert, während sie warteten. Aktiviere ihn und stelle erneut zu.

**Für ein Ereignis erscheinen keine Zustellungen.** Prüfe, ob der Endpunkt aktiviert ist, ob ein
Ereignistyp-Muster passt, und prüfe den Mandantenfilter. Ereignisse, die veröffentlicht wurden, bevor
der Endpunkt existierte, werden nicht zugestellt. Steht das Ereignis im
[Ereignisprotokoll](help:events#event-log), aber nichts passiert, läuft möglicherweise kein Worker.

**„Konflikt“ bei Erneut zustellen.** Die Zustellung ist bereits eingereiht oder wird gerade gesendet.
Warte und wähle **Aktualisieren**.

**„Zwischenzeitlich geändert“ beim Speichern oder Löschen.** Jemand anderes hat den Endpunkt geändert.
Lade die Seite neu und wiederhole deine Änderung.

**Der Empfänger hat ein Ereignis zweimal verarbeitet.** Bei mindestens einmaliger Zustellung zu
erwarten. Dedupliziere anhand von `Axentra-Event-Id`.
