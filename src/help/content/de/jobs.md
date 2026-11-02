---
title: Jobs
summary: Verfolge Hintergrund-Jobs, verstehe ihre Status und Wiederholungen, reihe einen Job von Hand ein und führe einen Job erneut aus oder brich ihn ab.
keywords: Job, Hintergrund-Job, Hintergrundaufgabe, Aufgabe, Warteschlange, Queue, Worker, Wiederholung, erneut ausführen, abbrechen, Dead Letter, endgültig fehlgeschlagen, fehlgeschlagen, Versuche, Backoff, einreihen, Idempotenzschlüssel, Handler
---

Ein **Job** ist ein Stück Arbeit, das im Hintergrund läuft, statt während jemand auf das Laden einer
Seite wartet: einen Monatsbericht versenden, eine Datei importieren, einen Webhook zustellen. Dein
Produkt, ein Zeitplan oder Axentra selbst stellt Jobs in eine Warteschlange, und ein separater
**Worker**-Prozess übernimmt sie und führt den Code (den **Handler**) aus, der zur **Art** des Jobs
gehört. Die Seite **Jobs** zeigt, was wartet, was läuft, was funktioniert hat und was fehlgeschlagen
ist, und lässt Betreiber Jobs erneut ausführen oder abbrechen.

> [!IMPORTANT]
> Jobs erfordern das Servermodul `events`; ohne es erscheint **Jobs** nicht in der Seitenleiste. Zum
> Ansehen brauchst du die Berechtigung `jobs:read` (Product owner, Product admin, Support und Product
> viewer haben sie). **Job einreihen**, **Erneut ausführen** und **Job abbrechen** erfordern
> `jobs:manage`; ohne diese Berechtigung sind die Buttons ausgeblendet. Jobs laufen nur, solange
> mindestens ein Worker-Prozess (`axentra worker`) läuft. Das ist eine Betriebsaufgabe, siehe
> [Serverkonfiguration](help:server-configuration).

## Die Jobliste lesen {#jobs-list}

Öffne [Jobs](app:jobs). Die Liste zeigt die neuesten Jobs zuerst mit **Art**, **Status**,
**Versuche** (zum Beispiel `2 von 5`), **Mandant** (oder **Produktebene** für Jobs, die zu keinem
Mandanten gehören), **Erstellt** und **Aktualisiert**. Wähle eine Art aus, um die Details des Jobs zu
öffnen.

### Zähler im Überblick {#overview}

Die Karte **Überblick** zählt die Jobs pro Status. Wähle einen Zähler, um nur diese Jobs anzuzeigen.
Unter den Zählern siehst du, wie viele Jobs in den letzten 24 Stunden erfolgreich waren und
fehlgeschlagen sind (die Zahl der fehlgeschlagenen enthält **Endgültig fehlgeschlagen**), und wann der
**Älteste wartende Job** erstellt wurde. Wird diese Zeit immer älter, übernimmt kein Worker Jobs:
Prüfe, ob ein Worker läuft und ob er diese Art bearbeitet.

### Jobs filtern {#filter}

Filtere nach **Status**, nach exakter **Art** (zum Beispiel `reports.send`) und nach **Mandant** und
wähle dann **Filter anwenden**. **Filter zurücksetzen** entfernt sie. Die Filter sind Teil der
Seitenadresse, sodass du eine gefilterte Ansicht als Lesezeichen speichern oder teilen kannst.

### Änderungen live verfolgen {#live-updates}

Schalte **Live-Aktualisierung** ein, um dem Job-Stream des Servers zu folgen. Studio aktualisiert dann
Liste und Zähler (höchstens einmal pro Sekunde), sobald sich ein Job ändert. Die Anzeige neben dem
Schalter zeigt den Verbindungszustand; siehe [Verbindungsstatus](help:events#connection-status). Ohne
Live-Aktualisierung ändert sich die Liste nur, wenn du sie neu lädst.

## Job-Status {#statuses}

```diagram
job-lifecycle
```

| Status                       | Bedeutung                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Wartend**                  | Wartet auf einen Worker. Ein Job mit Verzögerung oder einer, der auf seine nächste Wiederholung wartet, ist ebenfalls wartend.           |
| **Läuft**                    | Ein Worker hat den Job übernommen und hält eine zeitlich begrenzte Reservierung darauf.                                                  |
| **Erfolgreich**              | Der Handler ist fertig. Sein Rückgabewert wird als **Ergebnis** gespeichert.                                                             |
| **Fehlgeschlagen**           | Der Handler hat einen dauerhaften Fehler gemeldet (er hat `PermanentJobError` ausgelöst). Es gibt keine weiteren automatischen Versuche. |
| **Endgültig fehlgeschlagen** | Alle Versuche sind aufgebraucht. Der Job wird als „Dead Letter“ aufbewahrt, damit du ihn untersuchen und erneut ausführen kannst.        |
| **Abgebrochen**              | Vor dem Start abgebrochen, oder der Handler hat nach einer Abbruchanforderung gestoppt.                                                  |

**Fehlgeschlagen** und **Endgültig fehlgeschlagen** sind beide endgültig, aber aus unterschiedlichen
Gründen: **Fehlgeschlagen** heißt, der Handler hat entschieden, dass eine Wiederholung nicht helfen
kann; **Endgültig fehlgeschlagen** heißt, jeder Versuch endete mit einem Fehler.

## Versuche, Wiederholungen und Backoff {#retries}

Jedes Mal, wenn ein Worker einen Job übernimmt, steigt dessen Versuchszähler um eins. Endet ein
Versuch mit einem gewöhnlichen Fehler, geht der Job zurück auf **Wartend** und wartet vor dem nächsten
Versuch. Die Wartezeit wächst exponentiell: Nach Versuch _n_ liegt sie zwischen der Hälfte und dem
Ganzen von `2 × 2^(n−1)` Sekunden (2, 4, 8, 16 … Sekunden mit den Standardeinstellungen, nie mehr
als eine Stunde). Dieser „Backoff“ gibt einem vorübergehenden Problem, etwa einem ausgelasteten
externen Dienst, Zeit, sich zu erholen. Der Zufallsanteil verhindert, dass viele fehlgeschlagene Jobs
im selben Moment wiederholt werden.

Schlägt der letzte erlaubte Versuch fehl, wird der Job **Endgültig fehlgeschlagen**. Standard sind
**5** Versuche; mit den Standardeinstellungen ist ein Job, der immer fehlschlägt, also nach etwa einer
halben Minute endgültig fehlgeschlagen. **Max. Versuche** kannst du zwischen 1 und 100 festlegen,
wenn du einen Job einreihst oder einen Zeitplan anlegst.

Ein abgestürzter Worker erneuert seine Reservierung nicht mehr. Nach Ablauf der Reservierung
(standardmäßig 60 Sekunden) stellt ein anderer Worker den Job zurück in die Warteschlange. Der
verlorene Lauf zählt als Versuch.

> [!WARNING]
> Jobs laufen **mindestens einmal**, nicht genau einmal. Ein Job kann zweimal laufen, zum Beispiel
> nach einem Worker-Absturz oder wenn das Ergebnis nicht gespeichert werden konnte. Handler müssen
> idempotent sein: Zweimal ausgeführt müssen sie dieselbe Wirkung haben wie einmal.

## Die Details eines Jobs öffnen {#job-detail}

Wähle in der Liste die Art eines Jobs. Die Detailseite zeigt:

- **Details**: **Job-ID**, **Art**, **Status**, **Mandant**, **Versuche**, **Priorität**,
  **Idempotenzschlüssel**, den **Zeitplan**, der den Job erstellt hat (als Link), den **Worker**, der
  ihn ausführt oder ausgeführt hat, ob **Abbruch angefordert** gesetzt ist, und **Erstellt von** (die
  ID eines Benutzers oder API-Schlüssels oder `schedule:<id>` bei geplanten Jobs).
- **Zeitverlauf**: **Erstellt**, **Ausführen ab** (der früheste Startzeitpunkt, einschließlich
  Verzögerungen und Backoff), **Gestartet**, **Reserviert bis**, **Beendet** und **Aktualisiert**.
- **Letzter Fehler**: die Fehlermeldung des letzten fehlgeschlagenen Versuchs, höchstens 2000
  Zeichen. Der Server entfernt Tokens, API-Schlüssel und Verbindungszeichenfolgen, bevor er die
  Meldung speichert.
- **Nutzdaten** und **Ergebnis** als JSON. Werte unter Schlüsseln wie `password`, `secret`, `token`
  oder `api_key` werden als `[redacted]` angezeigt.

Solange ein Job **Wartend** ist oder **Läuft**, aktualisiert sich die Seite alle 3 Sekunden selbst.

## Einen Job einreihen {#enqueue}

Normalerweise reihst du Jobs nicht von Hand ein: Das erledigen der Code deines Produkts und
Zeitpläne. In Studio ist das Einreihen nützlich, um einen einmaligen Lauf zu starten oder einen
Handler zu testen.

1. Öffne [Jobs](app:jobs) und wähle **Job einreihen**.
2. Gib die **Art** ein, zum Beispiel `reports.send`. Die Art muss zu einem Handler passen, den ein Worker
   ausführt.
3. Optional: Gib die **Nutzdaten** als JSON-Objekt ein (die Eingabe für den Handler), wähle einen
   **Mandanten** und lege **Priorität**, **Verzögerung (Sekunden)** und **Max. Versuche** fest.
4. Wähle **Einreihen**. Studio öffnet die Detailseite des neuen Jobs.

| Einstellung                | Was sie bewirkt                                                                                         | Erlaubte Werte / Standard                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Art**                    | Wählt den Handler, der den Job ausführt.                                                                | Beginnt mit einem Kleinbuchstaben, dann Kleinbuchstaben, Ziffern und `_ . : -`, höchstens 100 Zeichen. `axentra.` ist reserviert. Pflichtfeld. |
| **Nutzdaten**              | Eingabe für den Handler.                                                                                | JSON-Objekt, höchstens 64 KB. Standard `{}`.                                                                                                   |
| **Mandant**                | Führt den Job im Kontext eines Mandanten aus; der Handler erreicht dann nur die Daten dieses Mandanten. | Ein Mandant des Produkts oder **Produktebene**.                                                                                                |
| **Priorität**              | Höhere Werte werden zuerst übernommen, wenn mehrere Jobs fällig sind.                                   | −100 bis 100. Standard 0.                                                                                                                      |
| **Verzögerung (Sekunden)** | Der Job startet nicht, bevor so viele Sekunden vergangen sind.                                          | 0 bis ein Jahr. Standard 0.                                                                                                                    |
| **Max. Versuche**          | Wie oft der Job versucht wird, bevor er **Endgültig fehlgeschlagen** ist.                               | 1 bis 100. Leer: Standard des Servers (5).                                                                                                     |
| **Idempotenzschlüssel**    | Schützt davor, denselben Job zweimal zu erstellen.                                                      | 1 bis 200 druckbare Zeichen. Studio trägt einen zufälligen Schlüssel ein.                                                                      |

> [!CAUTION]
> Leg keine Geheimnisse (Passwörter, API-Schlüssel) in Nutzdaten ab. Nutzdaten werden so gespeichert,
> wie sie übergeben werden, und sind für alle mit `jobs:read` lesbar (gängige Feldnamen für
> Geheimnisse werden nur in der Anzeige verborgen). Übergib IDs und lass den Handler das Geheimnis
> lesen.

### Idempotenzschlüssel {#idempotency-key}

Studio erzeugt bei jedem Öffnen des Dialogs einen neuen Schlüssel. Sendest du zweimal ab (ein
Doppelklick oder eine Wiederholung nach einer Zeitüberschreitung), liefert der Server den beim ersten
Absenden erstellten Job statt eines zweiten. Der Schlüssel ist pro Produkt, Mandant und Art
eindeutig, solange der Job existiert.

Wurde derselbe Schlüssel bereits mit anderen Nutzdaten oder einer anderen Priorität verwendet oder von
einem anderen Aufrufer, der keine Jobs lesen kann, lehnt der Server die Anfrage ab. Studio zeigt dann
**Bereits für eine andere Anfrage verwendet** und bietet **Neuen Schlüssel verwenden** an.

## Einen fehlgeschlagenen Job erneut ausführen {#retry}

1. Öffne den Job oder das Aktionsmenü seiner Zeile in der Liste.
2. Wähle **Erneut ausführen** und bestätige.

Der Job geht zurück auf **Wartend**, und sein Versuchszähler wird auf 0 zurückgesetzt, sodass er
wieder seine volle Anzahl an Versuchen erhält. **Erneut ausführen** wird nur für **Fehlgeschlagen**
und **Endgültig fehlgeschlagen** angeboten. Behebe zuerst die Ursache (siehe **Letzter Fehler**),
sonst schlägt der Job erneut fehl.

## Einen Job abbrechen {#cancel}

1. Öffne den Job oder das Aktionsmenü seiner Zeile.
2. Wähle **Job abbrechen** und bestätige.

Was passiert, hängt vom Status ab:

- Ein **wartender** Job wird sofort abgebrochen und läuft nie.
- Bei einem **laufenden** Job wird der Abbruch _angefordert_. Die Liste zeigt **Abbruch angefordert**.
  Der Handler bemerkt die Anforderung bei seiner nächsten Prüfung (Handler prüfen zwischen
  Arbeitsschritten) und stoppt; der Job endet dann als **Abgebrochen**. Ist der Handler vorher mit
  seiner Arbeit fertig, endet der Job als **Erfolgreich**, weil die Arbeit erledigt wurde.

Bereits beendete Jobs lassen sich nicht abbrechen.

## Für Entwickler und Betreiber {#developers}

### Handler und Worker {#workers}

Handler werden in Python mit `ax.jobs.register("reports.send", handler)` registriert und von
`axentra worker` ausgeführt. Ein Worker übernimmt nur Arten, für die er einen Handler hat. Ein Job,
dessen Art kein laufender Worker bearbeitet, bleibt unbegrenzt **Wartend**; er schlägt nicht fehl.
Handler können:

- einen JSON-Wert zurückgeben, der zum **Ergebnis** wird (größer als 64 KB: durch einen Hinweis auf
  die Kürzung ersetzt);
- `PermanentJobError` auslösen, um sofort als **Fehlgeschlagen** zu enden;
- `RetryJob(delay_seconds=…)` auslösen, um nach einer selbst gewählten Verzögerung erneut zu laufen;
- während langer Arbeit `ctx.heartbeat()` aufrufen, um die Reservierung zu erneuern, und
  `ctx.cancel_requested()`, um einen Abbruch zu bemerken.

Jobliste und Statistiken gibt es auch über die API: `GET /v1/products/{product_id}/jobs`,
`/jobs/stats` und den SSE-Stream `/jobs/stream`. Siehe [API-Grundlagen](help:api-basics).

### Wer welche Art einreihen darf {#kind-permissions}

Wer `jobs:manage` hat, darf jede Art einreihen, die nicht mit `axentra.` beginnt. Über die API dürfen
Mandantenmitglieder, die nur `events:publish` haben, eine Art nur dann einreihen, wenn das Produkt
diese Art ausdrücklich für sie freigegeben hat; andernfalls antwortet der Server mit „not permitted“.
Studio bietet **Job einreihen** nur Personen mit `jobs:manage` an.

### Integrierte Job-Arten {#system-kinds}

Axentra nutzt die Warteschlange für eigene Arbeit, daher siehst du diese Arten in der Liste:

| Art                       | Zweck                                                                       |
| ------------------------- | --------------------------------------------------------------------------- |
| `axentra.event.dispatch`  | Verteilt ein veröffentlichtes Ereignis an Abonnenten und Webhook-Endpunkte. |
| `axentra.event.handle`    | Führt einen prozessinternen Abonnenten für ein Ereignis aus.                |
| `axentra.webhook.deliver` | Sendet eine Webhook-Zustellung; siehe [Webhooks](help:webhooks#retries).    |

`axentra.`-Arten kannst du nicht selbst einreihen, aber wie andere Jobs erneut ausführen und
abbrechen.

### Aufbewahrung {#retention}

Abgeschlossene Jobs (**Erfolgreich**, **Fehlgeschlagen**, **Endgültig fehlgeschlagen**,
**Abgebrochen**) werden standardmäßig nach 30 Tagen gelöscht (`observability.job_retention_days`).
Wartende und laufende Jobs werden nie bereinigt.

## Gut zu wissen {#good-to-know}

- Es gibt keine garantierte Reihenfolge. Höhere Priorität zuerst, dann früherer Startzeitpunkt, aber
  Wiederholungen und parallele Worker bringen die Reihenfolge durcheinander.
- Jeder Job wird pro Versuch genau einem Worker übergeben.
- Jedes Einreihen, erneute Ausführen und Abbrechen wird im [Audit-Protokoll](help:audit) erfasst
  (`events.job.enqueue`, `events.job.retry`, `events.job.cancel`).
- Die Bereitschaftsprüfung des Servers berücksichtigt keine Worker. Beobachte stattdessen den
  **Ältesten wartenden Job**.

## Fehlerbehebung {#troubleshooting}

**Jobs bleiben Wartend und starten nie.** Es läuft kein Worker, oder keiner der laufenden Worker hat
einen Handler für diese Art. Prüfe den Zeitpunkt des **Ältesten wartenden Jobs**, bitte deine
Betreiber, `axentra worker` zu starten (mit `--load` für die Handler deines Produkts), und prüfe die
Schreibweise der Art. Prüfe auch **Ausführen ab**: Ein verzögerter Job oder einer, der auf eine
Wiederholung wartet, wartet absichtlich.

**Ein Job ist Endgültig fehlgeschlagen.** Alle Versuche sind fehlgeschlagen. Lies auf der Detailseite
**Letzter Fehler**, behebe die Ursache (zum Beispiel einen fehlenden Datensatz oder einen nicht
erreichbaren Dienst) und wähle **Erneut ausführen**.

**Ein Job ist nach einem Versuch Fehlgeschlagen.** Der Handler hat einen dauerhaften Fehler gemeldet,
daher hat Axentra nicht wiederholt. Lies **Letzter Fehler**. Führe den Job erst erneut aus, wenn die
Ursache behoben ist.

**„Bitte prüfe deine Eingaben“ beim Einreihen.** Der Server hat einen Wert abgelehnt; die Meldung unter
dem Titel nennt ihn, zum Beispiel `kind must be 1-100 characters…`, `payload is larger than 64000
bytes`, `priority must be between -100 and 100` oder `job kinds starting with 'axentra.' are
reserved`. Korrigiere das Feld und sende erneut ab.

**„Nicht erlaubt“ beim Einreihen.** Du brauchst `jobs:manage`. Eine Meldung wie `job kind … is not
open to tenant callers` bedeutet, dass nur Betreiber diese Art einreihen können.

**„Bereits für eine andere Anfrage verwendet“.** Der Idempotenzschlüssel gehört zu einer anderen
Job-Anfrage. Wähle **Neuen Schlüssel verwenden**, um einen neuen Job zu erstellen, oder wiederhole die
ursprüngliche Anfrage unverändert.

**„Konflikt“ bei Erneut ausführen oder Abbrechen.** Der Status des Jobs hat sich zwischenzeitlich
geändert (er wurde zum Beispiel fertig, während du bestätigt hast). Lade die Seite neu; **Erneut
ausführen** funktioniert nur bei **Fehlgeschlagen** und **Endgültig fehlgeschlagen**, **Job
abbrechen** nur bei **Wartend** und **Läuft**.

**Abbruch angefordert, aber der Job läuft weiter.** Der Handler stoppt erst, wenn er auf einen Abbruch
prüft. Handler, die nie prüfen, laufen bis zum Ende und gelten dann als **Erfolgreich**. Hängt der
Worker, wird der Job nach Ablauf seiner Reservierung wieder eingereiht.

**Ein Job ist zweimal gelaufen.** Das ist bei mindestens einmaliger Ausführung zu erwarten. Mache den
Handler idempotent, zum Beispiel indem er prüft, ob die Arbeit schon erledigt wurde.
