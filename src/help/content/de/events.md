---
title: Ereignisse
summary: Durchsuche das Ereignisprotokoll, verfolge Ereignisse live, während sie eintreten, verstehe die Verbindungsanzeige und veröffentliche ein Testereignis.
keywords: Ereignis, Event, Ereignisprotokoll, Event-Log, Domain-Event, live, Stream, SSE, Server-Sent Events, Echtzeit, veröffentlichen, Ereignistyp, Abonnent, Subscriber, Outbox, Last-Event-ID
---

Ein **Ereignis** ist eine kurze Nachricht, die sagt: „In deinem Produkt ist etwas passiert“, zum
Beispiel `invoice.created` oder `user.invited`. Jedes Ereignis hat einen **Typ**, den Zeitpunkt, zu
dem es **eingetreten** ist, den Mandanten, zu dem es gehört, wer es verursacht hat (den **Auslöser**)
und ein JSON-Objekt mit den Einzelheiten (die **Daten**). Andere Teile des Systems reagieren auf
Ereignisse: prozessinterne Abonnenten im Code deines Produkts und
[Webhook-Endpunkte](help:webhooks) in anderen Systemen. Auf der Seite **Ereignisse** kannst du
zurückblicken, was passiert ist (**Ereignisprotokoll**), und neue Ereignisse eintreffen sehen
(**Live**).

Ereignisse sind nicht dasselbe wie das [Audit-Protokoll](help:audit): Das Audit-Protokoll hält für die
Compliance fest, wer in Axentra was geändert hat, während Ereignisse Nachrichten sind, die dein Produkt
veröffentlicht, damit andere Systeme darauf reagieren.

> [!IMPORTANT]
> Ereignisse erfordern das Servermodul `events`. Für das Protokoll und die Live-Ansicht brauchst du
> `jobs:read` (die Berechtigung deckt Jobs und Ereignisse ab). **Ereignis veröffentlichen** erfordert
> `events:publish` in mindestens einem Mandanten (Owner, Admin und Member eines Mandanten haben sie);
> ohne diese Berechtigung ist der Button ausgeblendet.

## Ereignistypen {#event-types}

Ein Ereignistyp ist ein Name in Kleinbuchstaben, meist in der Form _Objekt.Aktion_: `invoice.created`,
`order.shipped`, `crm.contact:merged`. Er beginnt mit einem Kleinbuchstaben und darf Kleinbuchstaben,
Ziffern und `_ . : -` enthalten, bis zu 150 Zeichen. Typen, die mit `axentra.` beginnen, sind für
Axentra selbst reserviert (zum Beispiel `axentra.ping`, der Webhook-Test).

Axentra führt keine Liste „erlaubter“ Typen: Dein Produkt legt sie fest, indem es veröffentlicht.
Mehrere Seiten akzeptieren **Muster**, in denen `*` für beliebigen Text steht: `invoice.*` passt auf
`invoice.created` und `invoice.paid`, und `*` allein passt auf jeden Typ.

## Das Ereignisprotokoll durchsuchen {#event-log}

Öffne [Ereignisse](app:events). Der Tab **Ereignisprotokoll** listet Ereignisse, die neuesten zuerst,
mit **Typ**, **Mandant** (oder **Produktebene**), **Auslöser** und **Eingetreten**. Der Auslöser zeigt
die Art des Aufrufers (`user`, `api_key` oder `system`) und seine ID. Scrolle nach unten und lade mehr,
um weiter zurückzugehen.

### Nach Typ und Mandant filtern {#filter}

- **Typ**: ein exakter Typ (`invoice.created`) oder ein Präfix, das mit `*` endet (`invoice.*`,
  `crm.*`). Der Protokollfilter unterstützt `*` nur am Ende.
- **Mandant**: nur Ereignisse eines Mandanten.

Wähle **Filter anwenden**; **Filter zurücksetzen** entfernt sie. Die Filter bleiben in der
Seitenadresse erhalten.

### Ereignisdetails {#event-detail}

Wähle das Details-Symbol am Ende einer Zeile. Das Panel zeigt **Ereignis-ID**, **Typ**,
**Eingetreten**, **Mandant**, **Auslöser**, **Anfrage-ID** (um die API-Anfrage in den Serverlogs zu
finden), **Idempotenzschlüssel** (falls der Veröffentlichende einen angegeben hat) und die **Daten** als
JSON.

## Ereignisse live verfolgen {#live}

Öffne den Tab **Live**. Studio öffnet eine Verbindung zum Ereignis-Stream des Servers und zeigt
Ereignisse, die **ab jetzt veröffentlicht** werden, die neuesten oben. Ältere Ereignisse findest du im
**Ereignisprotokoll**.

1. Optional: Gib unter **Typen** ein oder mehrere Muster ein, durch Kommas getrennt (zum Beispiel
   `invoice.*, user.created`), und wähle **Übernehmen**. Lass das Feld leer, um alle Typen zu sehen.
   Das Übernehmen eines Filters leert die Liste und verbindet neu.
2. Sieh zu, wie Ereignisse eintreffen. Wähle bei einem Eintrag **Daten anzeigen**, um das vollständige
   Ereignis und seine Stream-Position zu sehen.

Die Live-Ansicht behält die letzten 200 Ereignisse; ältere fallen aus der Liste, bleiben aber im
Protokoll.

### Verbindungsstatus {#connection-status}

Die Anzeige über der Liste (und neben **Live-Aktualisierung** auf der Seite
[Jobs](help:jobs#live-updates)) sagt dir, ob du wirklich Aktualisierungen erhältst:

| Anzeige                               | Bedeutung                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Verbindung wird aufgebaut …**       | Studio öffnet die Verbindung.                                                                                                                                          |
| **Live**                              | Die Verbindung ist offen; neue Ereignisse erscheinen innerhalb von etwa einer Sekunde.                                                                                 |
| **Live, pausiert**                    | Verbunden, aber die Anzeige ist pausiert (siehe unten).                                                                                                                |
| **Verbindung wird wiederhergestellt** | Die Verbindung ist abgebrochen, oder der Server hat sie beendet. Studio versucht es automatisch erneut und zeigt, wann (_nächster Versuch in … s_).                    |
| **Getrennt**                          | Studio hat aufgehört, es zu versuchen, zum Beispiel weil sich deine Sitzung oder Berechtigung geändert hat. Der Grund wird daneben angezeigt; wähle **Neu verbinden**. |
| **Nicht verbunden**                   | Du hast **Trennen** gewählt.                                                                                                                                           |

Der Server beendet jeden Stream nach einer Stunde und prüft alle 15 Sekunden deine Sitzung und
Berechtigung (Standardeinstellungen). Nach einem regulären Ende oder einem Netzwerkproblem verbindet
Studio sich neu und **setzt dort fort, wo es aufgehört hat**, sodass dazwischen kein Ereignis verloren
geht. Wurde dein Zugriff entzogen, schließt der Stream mit _Der Zugriff auf den Stream ist nicht mehr
gegeben (Sitzung oder Berechtigung geändert)._

### Pausieren, fortsetzen und leeren {#pause}

- **Pausieren** friert die Liste ein, damit du sie lesen kannst. Die Verbindung bleibt offen, und neue
  Ereignisse werden gesammelt. **Fortsetzen** zeigt sie an (der Button zählt sie, zum Beispiel
  **Fortsetzen (3 neue Ereignisse)**).
- **Trennen** schließt die Verbindung. **Verbinden** öffnet sie wieder und setzt nach dem letzten
  empfangenen Ereignis fort, sodass auch zwischenzeitlich veröffentlichte Ereignisse erscheinen.
- **Leeren** leert die Liste auf deinem Bildschirm. Es werden keine Ereignisse gelöscht.

## Ein Testereignis veröffentlichen {#publish}

Ein Ereignis von Hand zu veröffentlichen ist nützlich, um einen Webhook-Endpunkt oder einen
Abonnenten zu testen.

1. Wähle **Ereignis veröffentlichen**.
2. Wähle den **Mandanten**. Hier veröffentlichte Ereignisse gehören immer zu einem Mandanten.
3. Gib den **Typ** ein, zum Beispiel `invoice.created`.
4. Gib die **Daten** als JSON-Objekt ein, zum Beispiel `{"invoice_id": "inv_123"}`.
5. Wähle **Veröffentlichen**.

Das Ereignis erscheint im Protokoll und wird an jeden aktivierten Webhook-Endpunkt mit passenden
Ereignistypen sowie an die Abonnenten deines Produkts zugestellt. Es ist ein echtes Ereignis:
Empfänger können es nicht von einem unterscheiden, das dein Produkt veröffentlicht hat. Verwende also
Testdaten und einen Mandanten, der zum Testen gedacht ist.

| Einstellung | Was sie bewirkt                                                             | Erlaubte Werte / Standard                                    |
| ----------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Mandant** | Der Mandant, zu dem das Ereignis gehört. Du brauchst dort `events:publish`. | Pflichtfeld.                                                 |
| **Typ**     | Der Ereignistyp, nach dem Empfänger filtern.                                | Siehe [Ereignistypen](help:events#event-types). Pflichtfeld. |
| **Daten**   | Einzelheiten des Ereignisses.                                               | JSON-Objekt, höchstens 64 KB. Standard `{}`.                 |

Studio sendet mit jedem Veröffentlichungsdialog einen Idempotenzschlüssel, sodass ein Doppelklick nur
einmal veröffentlicht.

## Für Entwickler {#developers}

- **Transaktionale Outbox.** Produktcode veröffentlicht mit `ax.events.publish_in_tx(...)` innerhalb
  seiner eigenen Datenbanktransaktion. Das Ereignis existiert genau dann, wenn die Transaktion
  committet wird, sodass für eine zurückgerollte Änderung kein Ereignis gesendet wird.
- **Die Zustellung an Abonnenten und Webhooks** läuft über [Jobs](help:jobs#system-kinds)
  (`axentra.event.dispatch`, `axentra.event.handle`, `axentra.webhook.deliver`), jeweils mindestens
  einmal. Zwischen Ereignissen gibt es keine Reihenfolgegarantie.
- **API.** `GET /v1/products/{product_id}/events?type=&tenant_id=` listet Ereignisse,
  `GET /events/{event_id}` liefert eines, und `POST /tenants/{tenant_id}/events` veröffentlicht (mit
  einem optionalen Header `Idempotency-Key`).
- **Streams (SSE).** `GET /events/stream?types=invoice.*,user.created` und `GET /jobs/stream` senden
  Nachrichten mit `id:` (der Stream-Position), `event:` (dem Ereignistyp bzw. `job.<status>` im
  Job-Stream) und JSON-`data:`. Sende die letzte `id` als `Last-Event-ID` zurück, um fortzusetzen;
  `Last-Event-ID: 0` spielt alles erneut ab, was noch aufbewahrt ist. Mit `?tenant_id=` wird die
  Berechtigung in diesem Mandanten geprüft, sodass mandantengebundene API-Schlüssel den Stream ihres
  Mandanten empfangen können. Der Job-Stream zeigt den jeweils letzten Zustand jedes geänderten Jobs,
  Zwischenzustände können also übersprungen werden.
- **Aufbewahrung.** Ereignisse werden nach der Aufbewahrungsfrist für Jobs (standardmäßig 30 Tage)
  gelöscht, sobald keine Zustellung mehr aussteht.

## Gut zu wissen {#good-to-know}

- Die Live-Ansicht zeigt nur Ereignisse, die eintreffen, während sie geöffnet ist. Was vorher passiert
  ist, siehst du im **Ereignisprotokoll**.
- Die Typvorschläge im Webhook-Formular stammen aus den neuesten Ereignissen in diesem Protokoll, weil
  es keinen zentralen Katalog der Typen gibt.

## Fehlerbehebung {#troubleshooting}

**Das Protokoll ist leer.** Dein Produkt hat noch keine Ereignisse veröffentlicht, oder die Filter
schließen sie aus. Wähle **Filter zurücksetzen**. Veröffentliche ein Testereignis, um die Einrichtung
zu prüfen.

**„Gib einen genauen Typ oder ein Präfix mit `*` am Ende ein“.** Der Protokollfilter akzeptiert
`invoice.created` oder `invoice.*`, aber kein `*` in der Mitte. Für die Live-Ansicht und für Webhooks
sind Muster wie `*.created` erlaubt.

**Die Anzeige bleibt auf Verbindung wird wiederhergestellt.** Studio kann den Stream des Servers nicht
erreichen. Prüfe dein Netzwerk und den Serverstatus. Auch Proxys, die Antworten puffern, können Streams
stören; informiere deine Betreiber.

**Getrennt mit „Der Zugriff auf den Stream ist nicht mehr gegeben“.** Deine Sitzung ist abgelaufen oder
deine Rolle hat sich geändert. Melde dich bei Bedarf erneut an und wähle dann **Neu verbinden**.

**„Nicht erlaubt“ beim Öffnen von Ereignisse.** Du brauchst in diesem Produkt `jobs:read`. Bitte einen
Product owner oder Product admin um eine Rolle, die diese Berechtigung enthält, siehe
[Rollen und Berechtigungen](help:roles-permissions).

**„Typen, die mit „axentra.“ beginnen, sind für Axentra reserviert.“** Wähle einen Typ mit eigenem
Präfix, zum Beispiel `invoice.created`.

**„Bereits für eine andere Anfrage verwendet“ beim Veröffentlichen.** Ein früherer Versuch aus
demselben Dialog hat andere Werte verwendet. Studio hat bereits einen neuen Schlüssel erzeugt: Wähle
erneut **Veröffentlichen**.

**Ein veröffentlichtes Ereignis hat einen Webhook nicht erreicht.** Prüfe, ob der Endpunkt aktiviert
ist, ob einer seiner Ereignistypen passt und ob sein Mandantenfilter (falls gesetzt) dem Mandanten des
Ereignisses entspricht. Sieh dir dann die [Zustellungen](help:webhooks#deliveries) des Endpunkts an.
Gibt es überhaupt keine Zustellung, läuft möglicherweise kein Worker, der das Ereignis verteilt.
