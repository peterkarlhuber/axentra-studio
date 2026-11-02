---
title: Datenübersicht
summary: Sieh, welche Datensatz-Sammlungen und Dateien ein Produkt speichert, wie viel Speicher jeder Mandant belegt und welche Speicher- und Aufbewahrungseinstellungen der Server anwendet.
keywords: Daten, Speicher, Sammlungen, Collections, Statistik, Kontingent, Quota, Speicherverbrauch, Belegung, Aufbewahrung, Backup, Sicherung, Inhaltstyp-Richtlinie, gesperrte Dateitypen, Speicher-Backend, S3, lokaler Speicher
---

Die **Datenübersicht** zeigt für das aktuelle Produkt, was gespeichert ist und nach welchen Regeln:
die Datensatz-Sammlungen, in die Mandanten schreiben, den Dateispeicher, den jeder Mandant im
Vergleich zu seinem Kontingent belegt, die Speicherkonfiguration des Servers und die
Aufbewahrungsfristen, die der Server meldet. Die Seite ist schreibgeschützt und ändert nichts.
Kontingente änderst du auf der Seite [Dateien](help:files#quota), die Inhaltstyp-Richtlinie auf dem
Tab **Dateien** des Produkts (siehe [Die Inhaltstyp-Richtlinie festlegen](#content-type-policy)).

Produktverantwortliche beantworten damit Fragen wie „Welcher Mandant ist nah an seinem
Speicherkontingent?“, „Welche Sammlungen gibt es?“ und „Wie lange bewahrt der Server
Audit-Ereignisse auf?“.

> [!IMPORTANT]
> Die Seite erfordert das Servermodul `data` (Datensätze). Die Karte **Dateispeicher** erfordert
> zusätzlich das Modul `storage`. Die Statistiken erfordern die Berechtigung `collections:read`, die
> die Produktrollen **Product owner**, **Product admin**, **Support** und **Product viewer** gewähren,
> ebenso die Plattformrollen. Die Karten **Speicherkonfiguration** und **Aufbewahrung** erfordern
> `platform:settings` oder `product:manage`. Siehe [Rollen und Berechtigungen](help:roles-permissions).

## Die Datenübersicht öffnen {#open}

1. Wähle ein Produkt aus.
2. Öffne in der Seitenleiste **Daten & Speicher** und wähle **Datenübersicht**
   ([Seite öffnen](app:dataOverview)).

Kennzeichnet die Seitenleiste den Eintrag mit **Aus**, ist das Modul `data` auf dem Server nicht
aktiviert. Module aktiviert ein Betreiber in der [Serverkonfiguration](help:server-configuration).

## Was die Seite zeigt {#what-you-see}

| Karte                     | Inhalt                                                                                          | Angezeigt, wenn                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Datensatz-Sammlungen**  | Anzahl der Sammlungen und Datensätze, dann eine Zeile pro Sammlung                              | Du `collections:read` hast                                                              |
| **Dateispeicher**         | Vom gesamten Produkt belegte Bytes und Dateien, die Standardkontingente, eine Zeile pro Mandant | Du `collections:read` hast und das Modul `storage` aktiviert ist                        |
| **Speicherkonfiguration** | Backend, maximale Dateigröße, erlaubte und gesperrte Typen                                      | Du `platform:settings` oder `product:manage` hast und das Modul `storage` aktiviert ist |
| **Aufbewahrung**          | Wie lange der Server Audit-Ereignisse und abgeschlossene Jobs aufbewahrt                        | Du `platform:settings` oder `product:manage` hast                                       |

Ohne `collections:read` zeigt die Seite **Produktstatistiken nicht verfügbar**. Mandantenmitglieder
(Rollen **Owner**, **Admin**, **Member**, **Viewer** eines Mandanten) haben diese Berechtigung nicht;
sie würde Daten anderer Mandanten offenlegen. Mandantenmitglieder arbeiten mit den Daten ihres eigenen Mandanten unter
[Datensätze](help:records) und [Dateien](help:files).

## Datensatz-Sammlungen {#collections}

Eine _Sammlung_ ist eine benannte Gruppe von JSON-Datensätzen, etwa `orders` oder `contacts`.
Sammlungen werden nicht gesondert angelegt oder konfiguriert: Eine Sammlung existiert, sobald ein
Datensatz in sie geschrieben wird, und verschwindet, wenn ihr letzter Datensatz gelöscht wird. Siehe
[Datensätze](help:records#collections).

Die Tabelle listet jede Sammlung des Produkts über alle Mandanten hinweg:

| Spalte              | Bedeutung                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Sammlung**        | Name der Sammlung. Wähle ihn aus, um die Sammlung auf der Seite **Datensätze** zu öffnen. |
| **Datensätze**      | Anzahl der Datensätze in dieser Sammlung, summiert über alle Mandanten.                   |
| **Mandanten**       | Anzahl der Mandanten, die mindestens einen Datensatz in dieser Sammlung haben.            |
| **Letzte Änderung** | Zeitpunkt des letzten Anlegens oder Aktualisierens in dieser Sammlung.                    |

Ist die Tabelle leer (**Noch keine Sammlungen**), wurde in diesem Produkt noch kein Datensatz
geschrieben.

## Speicher pro Mandant {#storage-per-tenant}

Die Karte **Dateispeicher** beginnt mit vier Werten: **Belegter Speicher** und **Dateien** für das
gesamte Produkt (nur aktive Dateien) sowie **Standard-Speicherkontingent** und
**Standard-Dateikontingent**, die für jeden Mandanten ohne eigenes Kontingent gelten.

Die Tabelle **Speicherverbrauch pro Mandant** hat eine Zeile pro Mandant (50 pro Seite, **Mehr laden**
für den Rest):

| Spalte                                       | Bedeutung                                                                                                                                                                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mandant**                                  | Wähle den Namen aus, um die Dateien des Mandanten zu öffnen.                                                                                                                                                                           |
| **Speicher** / **Dateien**                   | Bytes und Anzahl der aktiven Dateien des Mandanten.                                                                                                                                                                                    |
| **Speicherkontingent** / **Dateikontingent** | Die wirksame Grenze und wie viel davon belegt ist. **Unbegrenzt** bedeutet, dass keine Grenze gilt. Das Kennzeichen **Mandant** markiert ein für diesen Mandanten festgelegtes Kontingent; ohne es übernimmt der Mandant den Standard. |

### Wie das wirksame Kontingent bestimmt wird {#quotas}

Jede der beiden Grenzen (Bytes und Dateien) wird getrennt ermittelt, in dieser Reihenfolge:

1. Das eigene Kontingent des Mandanten, festgelegt mit **Kontingent bearbeiten** auf der Seite
   [Dateien](help:files#quota).
2. Der Standard des Produkts: `quota_bytes` / `quota_files` im Abschnitt `storage` der
   Produkteinstellungen (Produktseite, Tab **Einstellungen**, Feld **Einstellungen (JSON)**).
3. Der Standard der Installation: `storage.default_quota_bytes` / `storage.default_quota_files` in
   der Serverkonfiguration.
4. Andernfalls: unbegrenzt.

```json
{ "storage": { "quota_bytes": 10737418240, "quota_files": 10000 } }
```

Das Beispiel legt einen Produktstandard von 10 GiB (in Bytes) und 10.000 Dateien fest.

> [!NOTE]
> Gezählt werden _aktive_ Dateien. Eine Datei, deren Ablaufzeit überschritten ist, verschwindet
> sofort, ihre Bytes zählen aber weiter, bis die Bereinigung des Servers gelaufen ist (ein Betreiber
> plant `axentra storage purge` ein, zum Beispiel alle 15 Minuten).

## Speicherkonfiguration {#storage-configuration}

Diese Karte zeigt die wirksamen Einstellungen des Servers. Diese gehören zur Serverkonfiguration und
lassen sich in Studio nicht ändern.

| Einstellung             | Was sie bewirkt                                                                                                                                                             | Standard |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Backend**             | Wo Dateiinhalte gespeichert werden: `local` (ein Verzeichnis auf dem Server) oder `s3` (Amazon S3 oder ein S3-kompatibler Dienst).                                          | `local`  |
| **Maximale Dateigröße** | Harte Grenze pro Datei, geprüft während des Upload-Streams.                                                                                                                 | 50 MiB   |
| **Erlaubte Typen**      | Positivliste von Inhaltstypen (`image/png`, `image/*`). **Alle Typen außer gesperrten** bedeutet, dass die Liste leer ist.                                                  | leer     |
| **Gesperrte Typen**     | Was in diesem Produkt mit ausführbaren Dateien, HTML, SVG und Skripten geschieht und ob das **Für dieses Produkt festgelegt** oder **Von der Installation übernommen** ist. | ablehnen |

Ein Wechsel des Backends verschiebt keine vorhandenen Dateien. Für Entwickler und Betreiber sind alle
Schlüssel des Abschnitts `[storage]` unter [Serverkonfiguration](help:server-configuration)
beschrieben.

## Die Inhaltstyp-Richtlinie festlegen {#content-type-policy}

Manche Dateitypen können Code ausführen, wenn jemand sie öffnet: ausführbare Dateien, HTML, XHTML,
SVG, JavaScript, Shell- und PHP-Skripte. Axentra _sperrt_ sie. Die Inhaltstyp-Richtlinie legt pro
Produkt fest, was mit einem gesperrten Upload geschieht: Er wird entweder abgelehnt oder als _inerter
Anhang_ gespeichert, also als opakes `application/octet-stream`, das nur heruntergeladen, nie
angezeigt wird.

1. Öffne das Produkt: **Produkte**, dann den Namen des Produkts.
2. Wähle den Tab **Dateien**. (Der Tab ist ausgeblendet, wenn das Modul `storage` nicht aktiviert ist.)
3. Wähle unter **Inhaltstyp-Richtlinie für Dateien** das Verhalten und die Listen (siehe Tabelle).
4. Wähle **Änderungen speichern**.

| Einstellung                                 | Was sie bewirkt                                                                                                                                                                                                                                                                                                          | Erlaubte Werte / Standard                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Gesperrte Dateitypen**                    | **Hochladen ablehnen** (wer hochlädt, erhält einen Fehler) oder **Als inerten Anhang speichern**. **Standard der Installation** folgt der Servereinstellung `storage.store_blocked_as_inert`.                                                                                                                            | Standard: Standard der Installation                                   |
| **Als inerte Anhänge angenommene Endungen** | Gesperrte Endungen, die auch dann als inerte Anhänge aufbewahrt werden, wenn Uploads sonst abgelehnt werden. Entscheidend ist die Endung des Dateinamens, auch wenn der Inhalt das Gesperrte ist (ein `#!`-Skript namens `run.sh` wird bei gelistetem `sh` aufbewahrt; derselbe Inhalt namens `run.txt` wird abgelehnt). | Durch Kommas getrennt, ohne Punkt: `html, sh`. Höchstens 100 Einträge |
| **Zusätzlich gesperrte Endungen**           | Endungen, die zusätzlich zur integrierten Liste gesperrt werden.                                                                                                                                                                                                                                                         | `py, rb`. Höchstens 100 Einträge                                      |
| **Zusätzlich gesperrte Inhaltstypen**       | Inhaltstypen, die zusätzlich zur integrierten Liste gesperrt werden.                                                                                                                                                                                                                                                     | `text/x-python`. Höchstens 100 Einträge                               |

Der Abschnitt **Immer gesperrt** listet die integrierten Endungen und Inhaltstypen. Ein Produkt kann
mehr sperren oder gesperrte Dateien als inerte Anhänge aufbewahren, aber nie eine Sperre aufheben.

> [!IMPORTANT]
> Die Richtlinie anzusehen erfordert `product:read`; sie zu ändern erfordert `product:manage` (Rollen
> **Product owner** und **Product admin**). Archivierte Produkte sind schreibgeschützt.

> [!NOTE]
> Die Liste **Erlaubte Typen** der Installation gilt auch nach der Richtlinie: Enthält die
> Positivliste `application/octet-stream` nicht, werden auch inerte Dateien abgelehnt.

Die Richtlinie wird auf drei Arten geprüft: anhand des angegebenen Inhaltstyps, anhand der Endung des
Dateinamens und anhand der ersten Bytes des Inhalts (ausführbare Dateien, HTML, SVG und jede Datei,
die mit `#!` beginnt). Das Umbenennen einer Datei in eine gesperrte Endung folgt derselben Richtlinie.
Änderungen werden im Audit-Protokoll als `storage.policy.update` erfasst. Details für Hochladende:
[Dateien](help:files#content-types).

## Aufbewahrung {#retention}

| Einstellung             | Bedeutung                                                                                                                                                                             | Standard |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **Audit-Log**           | Tage, die der Server Audit-Ereignisse aufbewahrt (`observability.audit_retention_days`).                                                                                              | 365 Tage |
| **Abgeschlossene Jobs** | Tage, die der Server abgeschlossene Jobs (erfolgreich, fehlgeschlagen, tot oder abgebrochen) und abgeschlossene Webhook-Zustellungen aufbewahrt (`observability.job_retention_days`). | 30 Tage  |

Datensätze und Dateien haben keine Aufbewahrungsfrist: sie bleiben, bis jemand sie löscht, die eigene
Ablaufzeit einer Datei verstreicht oder der Mandant gelöscht wird (wodurch alle seine Daten gelöscht
werden).

## Backups {#backups}

Die Karte **Backups werden nicht gemeldet** ist Absicht: Die API meldet weder den Backup-Status noch,
wie lange die Metadaten gelöschter Dateien aufbewahrt werden. Beides gehört zum Serverbetrieb.
Standardmäßig entfernt die Bereinigung die Metadatenzeilen gelöschter Dateien nach 30 Tagen;
Datenbank-Backups und das Audit-Protokoll behalten Name, Größe und Prüfsumme einer gelöschten Datei
länger.

## Fehlerbehebung {#troubleshooting}

**Produktstatistiken nicht verfügbar.** Deine Rollen gewähren `collections:read` nicht. Bitte einen
Product owner um eine Produktrolle oder nutze [Datensätze](help:records) und [Dateien](help:files)
für deinen Mandanten.

**Storage-Modul nicht aktiviert.** Der Server betreibt das Modul `storage` nicht, daher können keine
Dateien gespeichert werden. Ein Betreiber ergänzt `storage` bei den aktivierten Modulen; siehe
[Modulreferenz](help:modules-reference).

**Die Karten Speicherkonfiguration und Aufbewahrung fehlen.** Diese Karten erfordern `platform:settings` oder
`product:manage`. Product viewer und Support sehen sie nicht.

**Ein Mandant zeigt mehr Verbrauch, als seine Dateien zusammen ergeben.** Abgelaufene Dateien zählen
bis zur nächsten Bereinigung. Frag einen Betreiber, ob `axentra storage purge` regelmäßig läuft.

**Das Speichern der Inhaltstyp-Richtlinie schlägt mit „Zwischenzeitlich geändert“ fehl.** Jemand hat
das Produkt (seine Einstellungen, seinen Namen oder seine Richtlinie) geändert, nachdem du die Seite
geöffnet hast. Lade die Seite neu und nimm deine Änderung erneut vor.

**Das Speichern der Richtlinie schlägt mit „Bitte prüfe deine Eingaben“ fehl.** Ein Eintrag ist keine
gültige Endung (Kleinbuchstaben, Ziffern, `_`, `+` oder `-`, höchstens 16 Zeichen, ohne Punkt) bzw.
kein gültiger Inhaltstyp (`type/subtype`), oder eine Liste hat mehr als 100 Einträge. Die Meldung
unter dem Feld nennt das Problem.

**Nicht gefunden beim Öffnen der Seite.** Das Modul `data` ist deaktiviert, oder das Produkt ist
archiviert und du bist kein Plattform-Administrator.
