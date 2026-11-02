---
title: Nutzung und Kontingente
summary: Zähler definieren, die Nutzung jedes Mandanten verfolgen, Kontingent-Überschreibungen festlegen und Reservierungen nachschlagen.
keywords: Nutzung, Verbrauch, Messung, Zähler, Kontingent, Quota, Limit, Reservierung, hartes Limit, weiches Limit, Überschreitung, API-Aufrufe, Rücksetzzeitraum, Metering
---

Die Nutzungsmessung zählt, wie viel jeder Mandant von etwas verbraucht, das dein Produkt misst:
API-Aufrufe, gespeicherte Bytes, erzeugte Berichte. Du definierst **Zähler** in Studio; dein
Produkt erfasst über die API **Nutzungsereignisse** dafür. Axentra summiert die Ereignisse pro
Mandant und Zeitraum, vergleicht das Ergebnis mit dem **Limit** des Mandanten (aus einer
Kontingent-Überschreibung, dem Tarif oder dem Standardwert des Zählers) und lehnt Nutzung darüber
ab oder markiert sie. Produktverantwortliche definieren auf dieser Seite Zähler und beobachten den
Verbrauch; der Support beantwortet hier die Frage „Warum wurde meine Anfrage abgelehnt?“.

> [!IMPORTANT]
> Die Seite **Nutzung** braucht das Modul `usage` auf dem Server. Ohne das Modul erscheint
> **Nutzung** nicht in der Navigation. Zum Lesen brauchst du `usage:read`; um Zähler und
> Kontingent-Überschreibungen zu definieren, die Produktberechtigung `usage:manage`; um
> Reservierungen zu verbuchen oder freizugeben, `usage:record` im Mandanten. Siehe
> [Rollen und Berechtigungen](help:roles-permissions).

## Was die Seite zeigt {#overview}

Öffne [Nutzung](app:usage) (Gruppe **Nutzung & Abrechnung**). Die Seite hat drei Tabs:

| Tab                     | Zeigt                                                                              | Wer ihn sieht                                                  |
| ----------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Übersicht**           | Ein Tagesdiagramm eines Zählers über alle Mandanten und die **Summen pro Mandant** | `usage:read` auf Produktebene (Produktrollen, Plattformrollen) |
| **Zähler**              | Die Zählerdefinitionen                                                             | `usage:read` auf Produktebene                                  |
| **Nutzung pro Mandant** | Limits, Diagramm, Ereignisse und Reservierungen eines Mandanten                    | `usage:read` in mindestens einem Mandanten                     |

Wer nur eine Mandantenrolle hat (zum Beispiel die Mandantenrolle **Member**), sieht nur den Tab
**Nutzung pro Mandant**, und zwar nur für Mandanten, in denen er `usage:read` hat.

### Die Übersicht lesen {#overview-chart}

1. Wähle einen **Zähler** und einen **Zeitraum** (**Letzte 7 Tage**, **Letzte 30 Tage** oder
   **Letzte 90 Tage**).
2. **Tägliche Nutzung aller Mandanten** zeigt einen Balken pro UTC-Tag. **Datentabelle anzeigen**
   unter dem Diagramm listet jeden Tag als Tabelle auf, was auch mit Screenreadern funktioniert.
3. **Summen pro Mandant** listet jeden Mandanten mit Nutzung im Zeitraum, seinen **Wert** und die
   Anzahl der **Ereignisse**. Wähle einen Mandantennamen, um seinen Tab **Nutzung pro Mandant** zu
   öffnen.

Wie die Summe gebildet wird, hängt von der Aggregation des Zählers ab: **Summe** addiert die
Tageswerte, **Maximum** nimmt den höchsten Tageswert, **Letzter Wert** nimmt den Wert des letzten
Tages mit Nutzung. Alle Tage sind UTC-Tage; ein Tag kann daher nach deiner Ortszeit am Abend oder
am Morgen beginnen.

Das **Dashboard** des Produkts hat eine Karte **Nutzung in diesem Monat** mit den Summen pro
Zähler seit dem ersten Tag des aktuellen UTC-Monats.

## Einen Zähler anlegen {#create-meter}

Ein Zähler legt fest, _was_ gemessen wird. Er erfasst selbst nichts.

1. Öffne den Tab **Zähler** und wähle **Neuer Zähler**.
2. Gib einen **Schlüssel** ein, zum Beispiel `api_calls`. Dein Produkt sendet die Nutzung mit
   diesem Schlüssel.
3. Optional: **Name**, **Einheit** (wird neben Werten angezeigt, zum Beispiel `calls`) und
   **Beschreibung**.
4. Wähle die **Aggregation** und den **Rücksetzzeitraum** (siehe Tabelle unten).
5. Optional: ein **Standardlimit** und seine **Durchsetzung**.
6. Wähle **Zähler anlegen**.

> [!WARNING]
> **Schlüssel**, **Aggregation** und **Rücksetzzeitraum** lassen sich nach dem Anlegen nicht mehr
> ändern. Hast du dich vertan, lege einen neuen Zähler mit einem anderen Schlüssel an.

### Einstellungen eines Zählers {#meter-settings}

| Einstellung          | Was sie bewirkt                                                                                                                                                                       | Erlaubte Werte / Standard                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Schlüssel**        | Kennung, die die API-Aufrufe deines Produkts und die Tarifberechtigungen (`limit.<key>`) verwenden                                                                                    | Kleinbuchstaben, Ziffern, `_` und `.`, beginnt mit einem Buchstaben, höchstens 63 Zeichen |
| **Name**             | Anzeigename                                                                                                                                                                           | Höchstens 200 Zeichen; optional                                                           |
| **Einheit**          | Wird hinter Werten angezeigt                                                                                                                                                          | Freier Text; optional                                                                     |
| **Aggregation**      | Wie Ereignisse eines Zeitraums zusammengefasst werden: **Summe** addiert Mengen, **Maximum** behält die höchste, **Letzter Wert** den Wert des Ereignisses mit dem jüngsten Zeitpunkt | `sum` (Standard), `max`, `last`                                                           |
| **Rücksetzzeitraum** | Wann der Zähler neu beginnt: **Kein Zurücksetzen**, **Täglich (UTC)**, **Monatlich (UTC)**, **Abrechnungszeitraum**                                                                   | Standard **Monatlich (UTC)**                                                              |
| **Standardlimit**    | Limit für Mandanten ohne Überschreibung und ohne Tariflimit; leer bedeutet unbegrenzt                                                                                                 | Zahl ab 0; leer                                                                           |
| **Durchsetzung**     | **Hartes Limit** lehnt Nutzung über dem Limit ab; **Weiches Limit** erfasst sie und meldet die Überschreitung                                                                         | Standard **Hartes Limit**                                                                 |

Wähle die Aggregation danach, was du misst: Ereignisse, die sich aufsummieren (Aufrufe,
Nachrichten), verwenden **Summe**; ein Stand, den du abtastest (Speicher in Bytes, aktive Plätze),
verwendet **Maximum** oder **Letzter Wert**.

### Rücksetzzeiträume und der Abrechnungszeitraum {#reset-period}

**Abrechnungszeitraum** folgt dem Zyklus des Abonnements des Mandanten: Der Zeitraum beginnt an
dem Tag, an dem das Abonnement begonnen hat (zum Beispiel am 15.), und läuft einen Monat oder ein
Jahr, je nach Preisintervall. Ein Starttag wie der 31. wird in kürzeren Monaten auf den letzten
Tag verschoben. Ist das Modul `billing` nicht aktiviert oder hat der Mandant kein Abonnement im
Status **Testphase**, **Aktiv** oder **Überfällig**, ist der Zeitraum der Kalendermonat (UTC).
Siehe [Tarife und Abonnements](help:plans-subscriptions).

### Feste Zeiträume, keine gleitenden Fenster {#fixed-periods}

Limits gelten pro Zeitraum, und Zeiträume haben feste Grenzen: Mitternacht UTC bei täglichen
Zählern, der Monatserste (UTC) bei monatlichen Zählern. Ein Mandant kann sein ganzes Tageslimit
um 23:50 UTC und das ganze Limit erneut um 00:10 UTC verbrauchen. Stündliche oder gleitende
Kontingentfenster gibt es nicht. Brauchst du ein engeres Fenster, verwende einen Zähler mit
`day` und einem kleineren Limit oder einen zusätzlichen Zähler.

Kontingente sind nicht dasselbe wie die Ratenbegrenzung des Servers (Anfragen pro Minute pro
Schlüssel oder IP). Diese Begrenzung konfiguriert der Betreiber, und sie ist standardmäßig
ausgeschaltet; siehe [Serverkonfiguration](help:server-configuration).

## Einen Zähler bearbeiten, deaktivieren oder löschen {#edit-meter}

Im Aktionsmenü der Zeile (**Aktionen für Zähler …**):

- **Bearbeiten** ändert **Name**, **Einheit**, **Beschreibung**, **Standardlimit** und
  **Durchsetzung**.
- **Deaktivieren** stoppt neue Nutzung für den Zähler: Erfassungen für einen inaktiven Zähler
  werden abgelehnt. Inaktive Zähler erscheinen nicht mehr unter **Nutzung im Zeitraum** eines
  Mandanten. **Aktivieren** macht das rückgängig.
- **Zähler löschen** entfernt einen Zähler, für den nie Nutzung erfasst wurde. Du bestätigst durch
  Eingabe des Schlüssels. Ein Zähler mit erfasster Nutzung lässt sich nicht löschen; deaktiviere
  ihn stattdessen.

## Nutzung und Limits eines Mandanten prüfen {#tenant-usage}

1. Öffne den Tab **Nutzung pro Mandant** und wähle den Mandanten (oder wähle einen Mandanten unter
   **Summen pro Mandant**).
2. **Nutzung im Zeitraum** zeigt für jeden aktiven Zähler eine Karte mit:
   - dem Wert im aktuellen Zeitraum und bei begrenzten Zählern einem Balken mit
     „_genutzt_ von _Limit_ genutzt (_n_ %), einschließlich Reservierungen“;
   - der Herkunft des Limits (siehe unten) und **Hartes Limit** oder **Weiches Limit**;
   - **Über dem Limit**, wenn Nutzung mit weichem Limit das Limit überschritten hat;
   - **Zeitraum**, **Ereignisse**, **Reserviert** (falls vorhanden) und **Verbleibend**.
3. Um einen früheren Zeitraum anzusehen, wähle ein Datum unter **Zeitraum mit dem Datum**. Lass das
   Feld für den aktuellen Zeitraum leer.

Darunter folgen **Tägliche Nutzung** (ein Diagramm pro Zähler, gleiche Zeiträume wie in der
Übersicht), **Nutzungsereignisse** (neueste zuerst, Filter nach **Zähler**) und
**Reservierungen**.

### Woher das wirksame Limit kommt {#limit-source}

Der erste Treffer gilt:

| Kennzeichen                  | Quelle                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mandanten-Überschreibung** | Eine Kontingent-Überschreibung, die auf dieser Seite für diesen Mandanten festgelegt wurde                                                  |
| **Aus dem Tarif**            | Die Berechtigung `limit.<meter key>` des Tarifs des Mandanten oder eine Berechtigungs-Überschreibung auf der Abrechnungsseite des Mandanten |
| **Standard des Zählers**     | Das **Standardlimit** des Zählers                                                                                                           |
| **Kein Limit**               | Nichts davon: unbegrenzt                                                                                                                    |

Ein Tariflimit gilt nur, solange das Abonnement im Status **Testphase**, **Aktiv** oder
**Überfällig** ist. Tariflimits verwenden die **Durchsetzung** des Zählers; nur eine
Kontingent-Überschreibung legt eine eigene fest.

> [!NOTE]
> Es gibt zwei Arten von Mandanten-Überschreibungen. Eine **Kontingent-Überschreibung** (diese
> Seite) ersetzt das Limit eines Zählers einschließlich seiner Durchsetzung und gilt immer
> vorrangig. Eine **Berechtigungs-Überschreibung** auf der Abrechnungsseite des Mandanten ersetzt
> eine Tarifberechtigung und erscheint als **Aus dem Tarif**. Verwende pro Zähler nur einen
> Mechanismus, damit es leicht nachvollziehbar bleibt.

## Eine Kontingent-Überschreibung festlegen oder entfernen {#quota-override}

Erfordert die Produktberechtigung `usage:manage`.

1. Wähle unter **Nutzung im Zeitraum** auf der Karte des Zählers **Überschreibung festlegen**.
2. Gib ein **Limit** ein. Lass es leer für eine unbegrenzte Überschreibung (der Mandant hat dann
   kein Limit, selbst wenn sein Tarif eines hat).
3. Wähle die **Durchsetzung** und **Überschreibung speichern**.

Das Kennzeichen wechselt zu **Mandanten-Überschreibung**. **Überschreibung entfernen** (nur auf
Karten mit einer Mandanten-Überschreibung sichtbar) lässt wieder das Tariflimit oder den Standard
des Zählers gelten. Überschreibungen wirken ab der nächsten erfassten Nutzung; bereits erfasste
Nutzung bleibt bestehen. Kontingentänderungen werden im Audit-Protokoll festgehalten.

## Harte und weiche Limits {#enforcement}

- **Hartes Limit**: Eine Anfrage, die das Limit überschreiten würde, wird mit HTTP `429` und dem
  Fehlercode `quota_exceeded` abgelehnt, einschließlich Zähler, Limit, genutzter, reservierter und
  angefragter Menge sowie dem Ende des Zeitraums. Bei Zählern mit **Summe** lautet die Prüfung
  _genutzt + reserviert + angefragt > Limit_; bei Zählern mit **Maximum** und **Letzter Wert**
  _angefragt > Limit_.
- **Weiches Limit**: Nutzung wird immer erfasst. Die Antwort und Studio melden **Über dem Limit**,
  damit dein Produkt warnen oder die Überschreitung abrechnen kann.

Ein hartes Limit wird durch gleichzeitige Anfragen nie überschritten: Axentra serialisiert die
Schreibvorgänge für einen Mandanten, Zähler und Zeitraum.

## Nutzung erfassen (API) {#record-usage}

Studio erfasst keine Nutzung. Dein Produkt ruft die API mit einem Schlüssel auf, der
`usage:record` hat (siehe [API-Schlüssel](help:api-keys)):

```http
POST /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/usage/events
Authorization: Bearer axk_EXAMPLE_secret
Idempotency-Key: req-7f3a9c
Content-Type: application/json

{"meter": "api_calls", "quantity": 1}
```

- Der Header `Idempotency-Key` ist Pflicht (1 bis 200 druckbare ASCII-Zeichen). Wiederholst du
  denselben Schlüssel mit demselben Body, kommt das ursprüngliche Ereignis zurück (`200`,
  `replayed: true`) und zählt nur einmal. Derselbe Schlüssel mit einem anderen Body wird mit `409`
  abgelehnt.
- `quantity`: eine Zahl von 0 bis 10^15 mit höchstens 6 Nachkommastellen.
- `occurred_at` (optional): höchstens 5 Minuten in der Zukunft und 400 Tage in der Vergangenheit.
  Rückdatierte Ereignisse zählen in dem Zeitraum, zu dem sie gehören, auch wenn er schon beendet
  ist.
- `properties` (optional): ein JSON-Objekt von höchstens 4 KB, angezeigt unter
  **Nutzungsereignisse**.
- `"enforce": false` erfasst ohne Prüfung des harten Limits; das erfordert die
  Produktberechtigung `usage:manage`, die an Mandanten gebundene Schlüssel nie haben.

Das Tutorial [Tarife und Nutzung von Anfang bis Ende](help:tutorial-plan-usage) führt durch ein
vollständiges Beispiel.

## Reservierungen {#reservations}

Für lang laufende Arbeit kann ein Produkt vor dem Start eine Menge **reservieren** (API:
`POST …/usage/reservations` mit `meter`, `quantity` und `ttl_seconds` von 1 bis 86 400, Standard
300). Eine aktive Reservierung zählt gegen das Limit, sodass parallele Jobs es zusammen nicht
überschreiten können. Ist die Arbeit erledigt, **verbucht** das Produkt die tatsächliche Menge,
was ein Nutzungsereignis erfasst, oder **gibt** die Reservierung **frei**. Reservierungen gibt es
nur für Zähler mit **Summe**.

Die API hat keine Liste der Reservierungen; Studio schlägt eine daher über ihre ID nach:

1. Füge unter **Reservierungen** die **Reservierungs-ID** ein und wähle **Suchen**.
2. Studio zeigt **Status**, Zähler, **Reservierte Menge**, **Läuft ab** und nach dem Verbuchen die
   **Verbuchte Menge** und das **Nutzungsereignis**.
3. Mit `usage:record` im Mandanten kannst du eine **Aktiv**-Reservierung hier abschließen:
   - **Verbuchen** erfasst die **Tatsächliche Menge** (leer lassen, um die reservierte Menge zu
     verbuchen). Ein Verbuchen wird nie wegen des Limits abgelehnt, weil die Arbeit schon erledigt
     ist.
   - **Freigeben** gibt die Menge zurück, ohne Nutzung zu erfassen.

| Status          | Bedeutung                                                             |
| --------------- | --------------------------------------------------------------------- |
| **Aktiv**       | Zählt gegen das Limit, bis sie abläuft                                |
| **Verbucht**    | Nutzung wurde erfasst                                                 |
| **Freigegeben** | Zurückgegeben; keine Nutzung erfasst                                  |
| **Abgelaufen**  | Vor **Läuft ab** nicht verbucht; zählt ab diesem Zeitpunkt nicht mehr |

## Gut zu wissen {#good-to-know}

- Nutzungsereignisse lassen sich weder ändern noch löschen, und Mengen können nicht negativ sein;
  erfasste Nutzung lässt sich also nicht abziehen. Um einem Mandanten nach einem Fehler mehr
  Spielraum zu geben, lege für den Rest des Zeitraums eine
  [Kontingent-Überschreibung](help:usage#quota-override) fest.
- Einzelne Nutzungsereignisse werden wegen ihrer Menge nicht auditiert; Änderungen an Zählern und
  Kontingenten schon.
- Die Daten eines Mandanten sind isoliert: Eine fremde Mandanten-ID liefert „nicht gefunden“.
- Studio zeigt Mengen mit bis zu 6 Nachkommastellen, formatiert für deine Sprache.
- Zeitreihen umfassen höchstens 400 Tage.
- Weitere Grenzen stehen unter [Bekannte Einschränkungen](help:limitations).

## Fehlerbehebung {#troubleshooting}

| Was du siehst                                               | Warum                                                                               | Was du tun kannst                                                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Kein Zugriff auf die Nutzung**                            | Deiner Rolle fehlt `usage:read` für dieses Produkt oder diesen Mandanten            | Bitte einen Produktadministrator um eine Rolle mit `usage:read`                                                                                                    |
| Nur der Tab **Nutzung pro Mandant**                         | Du hast `usage:read` nur über eine Mandantenrolle                                   | Erwartet; die Übersicht braucht eine Produktrolle                                                                                                                  |
| **Noch keine Zähler**                                       | Kein Zähler definiert                                                               | Lege unter **Zähler** einen an (erfordert `usage:manage`)                                                                                                          |
| **Konflikt** beim Löschen eines Zählers                     | Für den Zähler wurde Nutzung erfasst                                                | **Deaktiviere** ihn stattdessen                                                                                                                                    |
| **Konflikt** „ein Zähler mit diesem Schlüssel existiert“    | Schlüssel sind pro Produkt eindeutig, auch bei inaktiven Zählern                    | Wähle einen anderen Schlüssel oder aktiviere den alten Zähler                                                                                                      |
| **Zwischenzeitlich geändert**                               | Jemand anderes hat den Zähler bearbeitet                                            | Lade neu und wiederhole deine Änderung                                                                                                                             |
| Dein Produkt erhält `429 quota_exceeded`                    | Ein hartes Limit würde überschritten                                                | Prüfe die Herkunft des Limits auf der Karte; erhöhe das Tariflimit, lege eine Kontingent-Überschreibung fest oder warte auf das Ende des Zeitraums (`Retry-After`) |
| Dein Produkt erhält `409` „the meter is inactive“           | Der Zähler wurde deaktiviert                                                        | **Aktiviere** ihn unter **Zähler**                                                                                                                                 |
| Dein Produkt erhält `409` für einen Idempotenzschlüssel     | Der Schlüssel wurde mit einem anderen Body wiederverwendet                          | Verwende pro eigenständigem Nutzungsereignis einen neuen Schlüssel                                                                                                 |
| **Bitte prüfe deine Eingaben** beim Erfassen                | Menge, `occurred_at` oder `properties` außerhalb der Grenzen oben                   | Korrigiere den Wert; sende `occurred_at` mit Zeitzone                                                                                                              |
| Verbuchen wird abgelehnt: „the reservation is expired“      | Die TTL ist vor dem Verbuchen abgelaufen                                            | Erfasse die Nutzung als normales Ereignis; wähle ein längeres `ttl_seconds`                                                                                        |
| Nutzung erscheint am falschen Tag                           | Tage sind UTC-Tage                                                                  | Vergleiche mit UTC-Zeiten                                                                                                                                          |
| Zähler mit **Abrechnungszeitraum** wird am 1. zurückgesetzt | Der Mandant hat kein berechtigendes Abonnement, oder die Abrechnung ist deaktiviert | Schließe für den Mandanten ein Abonnement ab (siehe [Tarife und Abonnements](help:plans-subscriptions#subscribe))                                                  |
