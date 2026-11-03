---
title: Zeitpläne
summary: Führe einen Job regelmäßig aus, in festem Abstand oder zu Cron-Zeiten in UTC, und aktiviere, deaktiviere, bearbeite oder lösche Zeitpläne.
keywords: Zeitplan, Cron, Crontab, wiederkehrender Job, regelmäßig, Timer, Intervall, Abstand, periodisch, UTC, Zeitzone, Sommerzeit, nächster Lauf, täglich, stündlich
---

Ein **Zeitplan** reiht einen [Job](help:jobs) immer wieder ein: alle 15 Minuten, jede Nacht um 02:00,
am ersten Tag jedes Monats. Du gibst dem Zeitplan eine Job-**Art** und **Nutzdaten**, und der Zeitplan
stellt zu jedem geplanten Zeitpunkt einen neuen Job dieser Art in die Warteschlange. Ein Worker führt
den Job dann wie jeden anderen aus. Nutze Zeitpläne für Berichte, Aufräumarbeiten, Synchronisierungen
und Erinnerungen.

> [!IMPORTANT]
> Zeitpläne erfordern das Servermodul `events`. Zum Ansehen brauchst du `jobs:read`; **Neuer
> Zeitplan**, Bearbeiten, Aktivieren, Deaktivieren und Löschen erfordern `jobs:manage` (ohne diese
> Berechtigung sind die Buttons und das Zeilenmenü ausgeblendet). Zeitpläne lösen nur aus, solange ein
> Worker-Prozess (`axentra worker`) läuft, weil der Worker zugleich als Scheduler arbeitet.

## Die Zeitplanliste lesen {#schedules-list}

Öffne [Zeitpläne](app:schedules) (auch erreichbar über **Zeitpläne** auf der Seite **Jobs**). Jede
Zeile zeigt:

- **Name** und die Job-Art, die der Zeitplan einreiht;
- **Zeitsteuerung**: einen Abstand wie _Alle 15 Minuten_ oder einen Cron-Ausdruck, gekennzeichnet mit
  _Cron, UTC_;
- **Zustand**: **Aktiv** oder **Deaktiviert**;
- **Nächster Lauf**: wann der Zeitplan das nächste Mal auslöst (bei deaktivierten Zeitplänen als
  **Deaktiviert** angezeigt);
- **Letzter Lauf**: der Zeitpunkt, der zuletzt ausgelöst hat. Gibt es dazu einen Job, verlinkt die
  Zeit auf diesen Job;
- **Mandant** oder **Produktebene**.

## Einen Zeitplan anlegen {#create}

1. Öffne [Zeitpläne](app:schedules) und wähle **Neuer Zeitplan**.
2. Gib einen **Namen** (1 bis 200 Zeichen) und die Job-**Art** ein, zum Beispiel `reports.send`.
3. Wähle unter **Zeitsteuerung** **Fester Abstand** oder **Cron-Ausdruck** (siehe unten).
4. Optional: Gib die **Nutzdaten** für den Job ein, wähle einen **Mandanten** und lege **Priorität**
   und **Max. Versuche** fest.
5. Lass **Aktiviert** eingeschaltet, wenn der Zeitplan sofort auslösen soll.
6. Wähle **Zeitplan anlegen**.

Der Server berechnet den **Nächsten Lauf** beim Speichern. Studio zeigt keine Vorschau künftiger
Laufzeiten.

## Die Zeitsteuerung wählen {#timing}

Ein Zeitplan verwendet genau eine der beiden Arten der Zeitsteuerung.

### Fester Abstand {#interval}

Gib unter **Alle** eine Zahl ein und wähle die **Einheit** (**Sekunden**, **Minuten**, **Stunden**
oder **Tage**). Der Abstand muss zwischen 10 Sekunden und 366 Tagen liegen.

Abstände werden ab Mitternacht UTC am 1. Januar 1970 gezählt, nicht ab dem Moment des Speicherns.
Alle Server berechnen daher dieselben Zeiten, und die Laufzeiten sind vorhersagbar:

- _Alle 15 Minuten_ löst zu :00, :15, :30 und :45 jeder Stunde (UTC) aus.
- _Im Abstand von 1 Tag_ löst um 00:00 UTC aus.
- _Alle 7 Tage_ löst donnerstags um 00:00 UTC aus (der 1. Januar 1970 war ein Donnerstag).

Brauchst du eine bestimmte Tageszeit oder einen bestimmten Wochentag, verwende stattdessen einen
Cron-Ausdruck.

### Cron-Ausdruck {#cron-syntax}

Ein Cron-Ausdruck hat genau **5 Felder**, getrennt durch Leerzeichen:

```text
┌──────── minute        0-59
│ ┌────── hour          0-23
│ │ ┌──── day of month  1-31
│ │ │ ┌── month         1-12
│ │ │ │ ┌ day of week   0-7 (0 and 7 are Sunday)
* * * * *
```

(Von oben nach unten: Minute, Stunde, Tag des Monats, Monat, Wochentag; 0 und 7 sind Sonntag.)
Jedes Feld akzeptiert:

| Syntax  | Bedeutung                                                | Beispiel                                    |
| ------- | -------------------------------------------------------- | ------------------------------------------- |
| `*`     | jeder Wert                                               | `*` im Stundenfeld: jede Stunde             |
| `n`     | ein Wert                                                 | `30` im Minutenfeld                         |
| `a-b`   | ein Bereich                                              | `1-5` im Wochentagsfeld: Montag bis Freitag |
| `a,b,c` | eine Liste (Elemente dürfen Bereiche oder Schritte sein) | `0,30` im Minutenfeld                       |
| `*/n`   | jeder _n_-te Wert ab dem Anfang                          | `*/10` im Minutenfeld: 0, 10, 20 …          |
| `a-b/n` | jeder _n_-te Wert innerhalb eines Bereichs               | `8-18/2` im Stundenfeld: 8, 10 … 18         |
| `a/n`   | jeder _n_-te Wert von _a_ bis zum Ende                   | `5/15` im Minutenfeld: 5, 20, 35, 50        |

**Nicht unterstützt:** Monats- oder Wochentagsnamen (`JAN`, `MON`), `L`, `W`, `#`, `?`, ein
Sekundenfeld und Makros wie `@daily` oder `@hourly`. Ein Ausdruck darf höchstens 200 Zeichen lang sein.

Sind **sowohl** Tag des Monats als auch Wochentag eingeschränkt (keines von beiden ist `*`), passt ein
Tag, wenn **eines von beiden** passt. `0 0 1 * 1` löst daher am 1. jedes Monats _und_ an jedem Montag
aus.

Ein Ausdruck, der nie zutrifft, etwa `0 0 31 2 *` (31. Februar), wird beim Speichern abgelehnt.

Studio prüft die Syntax schon während der Eingabe nach denselben Regeln wie der Server und zeigt
Meldungen wie _Ein Cron-Ausdruck hat 5 durch Leerzeichen getrennte Felder; dieser hat 6._ Die Buttons
unter **Häufige Ausdrücke** setzen fertige Ausdrücke ein:

| Button                | Ausdruck      |
| --------------------- | ------------- |
| **Alle 5 Minuten**    | `*/5 * * * *` |
| **Stündlich**         | `0 * * * *`   |
| **Täglich um 00:00**  | `0 0 * * *`   |
| **Werktags um 09:00** | `0 9 * * 1-5` |
| **Montags um 06:00**  | `0 6 * * 1`   |
| **Am 1. des Monats**  | `0 0 1 * *`   |

### Zeitzone: immer UTC {#timezone}

Alle Zeitplanzeiten sind in **UTC**. Es gibt keine Einstellung für die Zeitzone und keine automatische
Umstellung auf Sommerzeit. Rechne lokale Zeiten selbst um: 09:00 Uhr in Berlin ist im Winter (UTC+1)
`0 8 * * *` und im Sommer (UTC+2) `0 7 * * *`. Kommt es das ganze Jahr über auf die genaue lokale
Stunde an, passe den Zeitplan bei der Zeitumstellung an oder lass den Handler die lokale Zeit prüfen.

Die Spalten **Nächster Lauf** und **Letzter Lauf** werden, wie überall in Studio, in deiner eigenen
Zeitzone angezeigt.

## Was ein Zeitplan einreiht {#what-it-enqueues}

Zu jedem Zeitpunkt reiht der Zeitplan einen Job ein mit:

- **Art**, **Nutzdaten**, **Priorität**, **Max. Versuche** und **Mandant** des Zeitplans;
- einem Verweis zurück auf den Zeitplan (die Jobdetails zeigen ihn unter **Zeitplan**);
- **Erstellt von** `schedule:<schedule id>`;
- einem Idempotenzschlüssel aus der ID des Zeitplans und dem Zeitpunkt.

Jeder Zeitpunkt löst **höchstens einmal** aus, auch wenn mehrere Worker laufen. Der Job selbst läuft
dann mindestens einmal, mit den üblichen [Wiederholungen](help:jobs#retries). Ein Zeitplan wartet
nicht, bis der vorherige Job fertig ist: Dauert ein Job länger als der Abstand, startet der nächste
trotzdem.

## Verpasste Läufe und der nächste Lauf {#missed-runs}

Lief kein Worker, als Zeitpunkte fällig waren (zum Beispiel während einer Wartung), werden die
verpassten Zeitpunkte **zusammengefasst**: Der Zeitplan löst einmal für den überfälligen Zeitpunkt
aus und macht dann mit dem nächsten Zeitpunkt nach der aktuellen Zeit weiter. Er holt nicht jeden
verpassten Lauf nach.

Der **Nächste Lauf** wird ab der aktuellen Zeit neu berechnet, sobald du die Zeitsteuerung änderst
oder den Zeitplan aktivierst. Änderst du nur Name, Nutzdaten, Priorität oder Versuche, bleibt der
nächste Lauf erhalten.

**Gesperrter Mandant oder archiviertes Produkt.** Solange der Mandant eines Zeitplans gesperrt
oder sein Produkt archiviert ist, werden fällige Termine übersprungen: Es wird kein Job eingereiht,
**Letzter Lauf** ändert sich nicht, und der Zeitplan geht zum nächsten Termin weiter. Das
Audit-Protokoll verzeichnet einmal `events.schedule.skip` für den ersten übersprungenen Termin. Ein
bereits eingereihter Job wird ebenfalls nicht ausgeführt; er endet als **Fehlgeschlagen** mit
`skipped: …` (siehe [Job-Status](help:jobs#statuses)). Der Zeitplan selbst bleibt erhalten und löst nach
der Reaktivierung des Mandanten mit dem nächsten Termin wieder aus.

## Einen Zeitplan bearbeiten {#edit}

1. Öffne das Aktionsmenü der Zeile und wähle **Bearbeiten**.
2. Ändere die Werte und wähle **Änderungen speichern**.

Studio sendet nur die Felder, die du geändert hast. Der **Mandant** lässt sich nach dem Anlegen nicht
ändern; lösche den Zeitplan stattdessen und lege einen neuen an. Bereits eingereihte Jobs behalten ihre
alten Nutzdaten.

## Einen Zeitplan aktivieren oder deaktivieren {#enable-disable}

Öffne das Aktionsmenü der Zeile und wähle **Deaktivieren** oder **Aktivieren**. Ein deaktivierter
Zeitplan behält alle Einstellungen, löst aber nicht aus. Aktivierst du ihn wieder, macht er mit dem
nächsten Zeitpunkt nach jetzt weiter; Zeitpunkte, die er im deaktivierten Zustand verpasst hat, werden
nicht ausgeführt.

## Einen Zeitplan löschen {#delete}

Öffne das Aktionsmenü der Zeile, wähle **Zeitplan löschen** und bestätige. Der Zeitplan löst nicht mehr
aus. Bereits eingereihte Jobs bleiben bestehen und laufen trotzdem. Das Löschen lässt sich nicht
rückgängig machen; um einen Zeitplan vorübergehend anzuhalten, deaktiviere ihn stattdessen.

## Einstellungen {#settings}

| Einstellung       | Was sie bewirkt                                                              | Erlaubte Werte / Standard                                                  |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Name**          | Wird in der Liste und in Meldungen angezeigt.                                | 1 bis 200 Zeichen. Pflichtfeld.                                            |
| **Art**           | Einzureihende Job-Art; ein Worker braucht dafür einen Handler.               | Wie bei [Jobs](help:jobs#enqueue); `axentra.` ist reserviert. Pflichtfeld. |
| **Zeitsteuerung** | **Fester Abstand** oder **Cron-Ausdruck**.                                   | Abstand 10 s bis 366 Tage; Cron: 5 Felder, UTC.                            |
| **Nutzdaten**     | Eingabe jedes eingereihten Jobs.                                             | JSON-Objekt, höchstens 64 KB. Standard `{}`.                               |
| **Mandant**       | Reiht die Jobs in diesem Mandanten ein.                                      | Ein Mandant oder **Produktebene**. Nur beim Anlegen.                       |
| **Priorität**     | Priorität der eingereihten Jobs.                                             | −100 bis 100. Standard 0.                                                  |
| **Max. Versuche** | Versuche jedes eingereihten Jobs, bevor er **Endgültig fehlgeschlagen** ist. | 1 bis 100. Standard 5.                                                     |
| **Aktiviert**     | Ob der Zeitplan auslöst.                                                     | Standardmäßig an.                                                          |

## Für Entwickler {#developers}

Zeitpläne gibt es auch über die API: `GET/POST /v1/products/{product_id}/schedules` und
`GET/PATCH/DELETE /schedules/{id}` (mit `If-Match` für Aktualisierungen und Löschungen). Es arbeitet
immer nur ein Worker als Scheduler; er prüft standardmäßig alle 5 Sekunden auf fällige Zeitpläne
(`events.scheduler_interval_seconds`), daher kann ein Job einige Sekunden nach seinem Zeitpunkt
eingereiht werden.

## Fehlerbehebung {#troubleshooting}

**Der Zeitplan löst nicht aus.** Prüfe, ob er **Aktiv** ist und ob der **Nächste Lauf** in der
Vergangenheit liegt. Ist das so, läuft kein Worker; bitte deine Betreiber, einen zu starten. Werden
Jobs eingereiht, bleiben aber **Wartend**, bearbeitet kein Worker die Art; siehe
[Jobs](help:jobs#troubleshooting).

**Er löst zur falschen Stunde aus.** Cron-Zeiten sind UTC. Rechne deine lokale Zeit um,
einschließlich Sommerzeit (siehe [Zeitzone](help:schedules#timezone)).

**„The cron expression never matches“.** Die Felder beschreiben ein Datum, das es nicht gibt, etwa den 30. Februar. Ändere Tag oder Monat.

**„Bitte prüfe deine Eingaben“ mit einer Cron-Meldung.** Der Server nennt das Feld, zum Beispiel
`cron hour: values must be within 0-23` oder `cron day of week: invalid value 'MON'`. Verwende Zahlen
statt Namen und entferne Makros.

**„interval_seconds must be between 10 and 31622400“.** Der Abstand ist kürzer als 10 Sekunden oder
länger als 366 Tage.

**„Zwischenzeitlich geändert“ beim Speichern, Aktivieren oder Löschen.** Jemand anderes hat den
Zeitplan geändert, nachdem du ihn geladen hast. Schließe den Dialog, warte, bis sich die Liste
aktualisiert (oder lade die Seite neu), und wiederhole deine Änderung an der aktuellen Version.

**Der Zeitplan lief nach einem Ausfall einmal, nicht für jeden verpassten Zeitpunkt.** Das ist so
gewollt: Verpasste Zeitpunkte werden zu einem Lauf zusammengefasst.
