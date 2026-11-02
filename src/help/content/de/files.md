---
title: Dateien
summary: Lade die Dateien eines Mandanten hoch, finde, lade herunter, teile und lösche sie und verwalte Speicherkontingent, Größengrenzen und die Inhaltstyp-Richtlinie.
keywords: Dateien, hochladen, Upload, herunterladen, Download, Anhänge, Dokumente, Speicher, Kontingent, Speicherplatz, Dateigröße, Inhaltstyp, MIME-Typ, Download-Link, Freigabelink, signierte URL, Presigned URL, S3, Labels, Metadaten, Ablauf, inert, gesperrte Typen
---

Die Seite **Dateien** zeigt die Dateien, die ein Mandant über das Speichermodul von Axentra abgelegt
hat: Dokumente, Bilder, Exporte oder jeden anderen Anhang, den deine Anwendung hochlädt. Du kannst
Dateien von Hand hochladen, sie nach Name, Typ oder Label finden, herunterladen, einen befristeten
Download-Link erstellen, sie umbenennen und löschen. Die Seite zeigt außerdem, wie viel seines
Speicherkontingents der Mandant belegt.

Eine Datei gehört immer zu genau einem Mandanten. Der Inhalt lässt sich nach dem Upload nicht mehr
ändern; um eine Datei zu ersetzen, lade eine neue hoch und lösche die alte. Name und Labels lassen
sich ändern.

> [!IMPORTANT]
> Die Seite erfordert das Servermodul `storage`. Ansehen und Herunterladen erfordert `files:read` im
> Mandanten; Hochladen, Bearbeiten und Löschen erfordert `files:write`. Die Mandantenrollen
> **Owner**, **Admin** und **Member** gewähren beides, **Viewer** liest nur. Produktrollen:
> **Product owner** und **Product admin** dürfen in jedem Mandanten schreiben, **Support** und
> **Product viewer** lesen. Das Kontingent eines Mandanten zu ändern erfordert `tenants:update`
> (**Product owner**, **Product admin**). Siehe [Rollen und Berechtigungen](help:roles-permissions).

## Die Dateien eines Mandanten durchsuchen {#browse}

1. Öffne **Daten & Speicher** › **Dateien** ([Seite öffnen](app:files)).
2. Wähle einen **Mandanten**.

Die Seite zeigt den **Speicherverbrauch** des Mandanten und die Liste **Gespeicherte Dateien**, die
neuesten zuerst, 50 pro Seite. Aufgeführt werden nur aktive, nicht abgelaufene Dateien. Wähle die
Spaltenköpfe **Name**, **Größe** oder **Hochgeladen**, um zu sortieren. Wähle den Namen einer Datei,
um ihre [Details](#details) zu öffnen; das Menü **…** jeder Zeile bietet **Details**,
**Herunterladen** und **Datei löschen**.

### Dateien filtern {#filter}

| Filter                                                         | Was er findet                                                                                                                                      |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name enthält**                                               | Einen Teil des Namens, ohne Beachtung der Groß-/Kleinschreibung.                                                                                   |
| **Inhaltstyp**                                                 | Einen exakten Typ (`application/pdf`) oder eine Familie (`image/*`).                                                                               |
| **Hochgeladen von**                                            | Die ID des Benutzers (`usr_…`) oder API-Schlüssels, der die Datei hochgeladen hat.                                                                 |
| **Label** und **Ist gleich**, dann **Label-Filter hinzufügen** | Dateien, deren Labels diesen Schlüssel mit diesem Wert enthalten. `true`, `42` und `null` treffen mit ihrem Typ zu, anderer Text als Zeichenkette. |

Alle Filter müssen zutreffen. Einen Label-Filter entfernst du mit dem **×** an seinem Chip.

## Eine Datei hochladen {#upload}

1. Wähle den Mandanten und dann **Datei hochladen**.
2. Wähle unter **Datei** die Datei aus. Studio zeigt ihren Namen, ihre Größe und ihren Typ sowie die
   Regeln, die der Server anwendet (maximale Größe, erlaubte und gesperrte Typen).
3. Optionale Felder:
   - **Anzeigename**: der Name, der in Listen angezeigt und für Downloads verwendet wird.
     Standardmäßig der Dateiname.
   - **Labels (Metadaten)**: ein flaches JSON-Objekt wie `{"kind": "invoice", "year": 2026}` (siehe
     [Labels](#labels)).
   - **Läuft ab am**: Nach diesem Zeitpunkt wird die Datei ausgeblendet und später entfernt (siehe
     [Ablauf](#expiry)).
4. Wähle **Hochladen**. Ein Fortschrittsbalken zeigt die Übertragung; **Upload abbrechen** stoppt sie.

Der Server prüft alles noch einmal, egal was Studio anzeigt. Leere Dateien werden abgelehnt.

### Größengrenze {#size-limit}

Jede Datei darf höchstens die **Maximale Dateigröße** des Servers haben (standardmäßig 50 MiB, vom
Betreiber in `storage.max_file_bytes` festgelegt). Der Server hört auf zu lesen, sobald ein Upload sie
überschreitet. Studio warnt vor dem Hochladen, wenn es die Grenze kennt; das ist nur der Fall, wenn
du die Servereinstellungen lesen darfst (`platform:settings` oder `product:manage`). Andernfalls sagt
der Dialog, dass der Server Größe, Typ und Kontingent während des Uploads prüft.

### Erlaubte und gesperrte Typen {#content-types}

Zwei Regeln entscheiden, ob ein Dateityp angenommen wird:

- **Gesperrte Typen.** Ausführbare Dateien, HTML, XHTML, SVG, JavaScript, Shell- und PHP-Skripte und
  ähnliche Dateien sind gesperrt, erkannt anhand von angegebenem Typ, Dateiendung und Inhalt (auch
  jede Datei, die mit `#!` beginnt). Je nach Inhaltstyp-Richtlinie des Produkts wird eine gesperrte
  Datei abgelehnt oder als [inerter Anhang](#inert) gespeichert. Wer das Produkt verwaltet, legt die
  Richtlinie auf dem Tab **Dateien** des Produkts fest; siehe
  [Die Inhaltstyp-Richtlinie festlegen](help:data-overview#content-type-policy).
- **Erlaubte Typen.** Hat der Betreiber eine Positivliste konfiguriert
  (`storage.allowed_content_types`), werden nur diese Typen angenommen, zum Beispiel
  `image/*, application/pdf`. Ohne Liste werden alle Typen außer den gesperrten angenommen.

Der vom Browser gemeldete Typ ist nur ein Hinweis: Der Server untersucht die ersten Bytes und
verwendet den erkannten Typ, wenn der angegebene fehlt, zu allgemein oder offensichtlich falsch ist.

### Inerte Anhänge {#inert}

Bewahrt die Richtlinie eine gesperrte Datei auf, statt sie abzulehnen, wird die Datei als
`application/octet-stream` gespeichert und in ihren Details als **Inert gespeichert** gekennzeichnet,
zusammen mit dem Typ, als der sie hochgeladen wurde. Eine solche Datei wird immer nur als Anhang
heruntergeladen, nie im Browser geöffnet. Das Umbenennen einer Datei in eine gesperrte Endung (zum
Beispiel `.html`) folgt derselben Richtlinie: Es wird abgelehnt, oder die Datei wird inert.

### Labels {#labels}

Labels sind deine eigenen Schlüssel-Wert-Paare, um Dateien zu finden und zu gruppieren, etwa
`{"kind": "invoice"}`. Regeln: ein flaches JSON-Objekt mit höchstens 64 Schlüsseln; Schlüssel mit
1–64 Zeichen aus Buchstaben, Ziffern und `_ . : -`; Werte sind Text (höchstens 1024 Zeichen), Zahlen,
`true`/`false` oder `null`; insgesamt höchstens 8 KiB. Trag keine Geheimnisse in Namen oder Labels
ein: Diese erscheinen im Audit-Protokoll.

## Speicherkontingent {#quota}

Die Karte **Speicherverbrauch** vergleicht die Bytes und die Dateianzahl des Mandanten mit seinem
wirksamen Kontingent. Die Anzeige wechselt bei 80 % in eine Warnfarbe und bei 95 % in eine kritische
Farbe. Die Zeile darunter sagt, woher das Kontingent stammt: **Kontingent für diesen Mandanten
festgelegt**, **Kontingent vom Produkt oder Server-Standard übernommen** oder **Kein Kontingent:
unbegrenzt**. Wie Standardwerte ermittelt werden, erklärt die
[Datenübersicht](help:data-overview#quotas).

Ist ein Kontingent erreicht, werden weitere Uploads abgelehnt; vorhandene Dateien bleiben erhalten.

### Das Kontingent eines Mandanten ändern {#edit-quota}

1. Wähle auf der Karte **Speicherverbrauch** die Option **Kontingent bearbeiten**.
2. Gib eine **Speichergrenze** mit ihrer **Einheit** (MiB, GiB, TiB) und/oder eine **Dateigrenze**
   ein. Lass ein Feld leer, um den Standard des Produkts oder Servers zu übernehmen; `0` sperrt alle
   Uploads.
3. Wähle **Änderungen speichern**.

Eine Grenze unter dem aktuellen Verbrauch ist erlaubt: Vorhandene Dateien bleiben, neue Uploads werden
abgelehnt. Hat jemand das Kontingent geändert, nachdem du den Dialog geöffnet hast, wird das Speichern
mit **Zwischenzeitlich geändert** abgelehnt; lade neu und versuche es erneut. Kontingentänderungen
werden protokolliert (`storage.quota.update`).

## Dateidetails {#details}

Wähle den Namen einer Datei, um ihre Details zu öffnen: **Name**, **ID**, **Status**, **Inhaltstyp**,
**Inert gespeichert** (nur bei inerten Dateien), **Größe**, **SHA-256**-Prüfsumme, **Version**,
**Hochgeladen von**, **Hochgeladen**, **Aktualisiert**, **Läuft ab** und die Labels. Mit der SHA-256
kannst du prüfen, ob eine heruntergeladene Kopie mit der gespeicherten Datei identisch ist.

Der **Status** einer aufgeführten Datei ist immer `active`. Intern ist eine Datei `pending`, während
ihre Bytes geschrieben werden, und `deleted` nach dem Löschen; beides erscheint nicht in der Liste.

## Eine Datei herunterladen {#download}

Wähle **Herunterladen** in den Details oder im Menü **…** der Zeile. Studio fordert beim Server einen
kurzlebigen Download-Link an und startet damit den Download. Dateien werden immer als Anhänge
heruntergeladen, nie im Browser geöffnet. Downloads werden nicht im Audit-Protokoll erfasst.

## Einen Download-Link teilen {#download-links}

1. Öffne die Details der Datei und wähle **Download-Link erstellen**.
2. Kopiere den **Download-Link** und gib ihn weiter.

> [!CAUTION]
> Wer den Link hat, kann die Datei bis zu seinem Ablauf ohne Anmeldung herunterladen. Ein Link lässt
> sich nicht einzeln widerrufen; das Löschen der Datei beendet ihn. Teile Links nur mit den
> vorgesehenen Empfängern und über einen vertrauenswürdigen Kanal.

### Wie lange ein Link funktioniert {#link-expiry}

Der Link läuft zu dem Zeitpunkt ab, der unter **Läuft ab** angezeigt wird. Studio fordert immer die
längste Lebensdauer an, die der Server erlaubt: `storage.signed_url_ttl_seconds`, standardmäßig 300
Sekunden (5 Minuten), konfigurierbar zwischen 10 Sekunden und 24 Stunden. Ein Link überdauert nie die
eigene Ablaufzeit der Datei.

Je nach Serverkonfiguration gibt es zwei Arten von Links:

| Art                                                                        | URL                                                                                             | Funktioniert nicht mehr, wenn                                                                                    |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Signierter Axentra-Link (Standard)                                         | Die öffentliche URL des Servers + `/v1/files/download/…`                                        | Er abläuft, die Datei gelöscht wird oder abläuft oder der Mandant bzw. das Produkt gesperrt oder archiviert wird |
| Vorsignierter S3-Link (gekennzeichnet mit **vom Objektspeicher signiert**) | Zeigt direkt auf den S3-Bucket; nur mit dem S3-Backend und aktiviertem `s3_presigned_downloads` | Er abläuft oder die Datei gelöscht wird. Das Sperren des Mandanten beendet ihn **nicht**                         |

## Eine Datei umbenennen oder ihre Labels ändern {#edit}

1. Öffne die Details und wähle **Name und Labels bearbeiten**.
2. Ändere den **Namen** und/oder das JSON unter **Labels (Metadaten)**. Die gespeicherten Labels
   ersetzen alle bisherigen Labels.
3. Wähle **Änderungen speichern**.

Der Inhalt lässt sich nicht ändern. Hat jemand anderes die Datei zwischenzeitlich bearbeitet, wird das
Speichern mit **Zwischenzeitlich geändert** abgelehnt.

## Eine Datei löschen {#delete}

1. Wähle **Datei löschen** in den Details oder im Menü **…** der Zeile.
2. Bestätige mit **Datei löschen**.

Die Datei verschwindet sofort für alle, ihr Kontingent wird freigegeben, und vorhandene Download-Links
funktionieren nicht mehr. Der Server löscht anschließend das gespeicherte Objekt.

> [!CAUTION]
> Das Löschen lässt sich nicht rückgängig machen. Auf Speicherebene ist es ein logisches Löschen: Je
> nach Backend können die Bytes auf dem Datenträger bleiben, bis der Platz wiederverwendet wird, oder
> als ältere Objektversionen in einem S3-Bucket mit Versionierung. Datenbank-Backups und das
> Audit-Protokoll behalten Name, Größe und Prüfsumme der Datei. Müssen gelöschte Dateien
> unwiederbringlich sein, brauchen Betreiber Festplattenverschlüsselung oder
> Bucket-Lifecycle-Regeln; siehe [Sicherheit](help:security).

## Ablauf {#expiry}

Eine Datei mit gesetztem **Läuft ab am** verschwindet in dem Moment, in dem dieser Zeitpunkt
verstreicht, aus Listen, Details und Download-Links. Die Bereinigung des Servers (`axentra storage
purge`, vom Betreiber eingeplant) entfernt sie später; bis dahin zählen ihre Bytes noch zum
Kontingent. Die Ablaufzeit lässt sich nur beim Upload festlegen und danach in Studio nicht mehr
ändern.

## Speicher-Backends und Virenprüfung {#backends}

Wo Dateiinhalte liegen, ist eine Servereinstellung, die in der
[Datenübersicht](help:data-overview#storage-configuration) angezeigt wird:

- `local`: ein Verzeichnis auf dem Server (Standard `./var/storage`).
- `s3`: Amazon S3 oder ein S3-kompatibler Dienst, optional mit serverseitiger Verschlüsselung.

Ein Wechsel des Backends migriert keine vorhandenen Dateien. Axentra berechnet für jede Datei eine
SHA-256, prüft Dateien aber **nicht** auf Schadsoftware und untersucht keine Archive. Brauchst du eine
Prüfung, führe sie nach dem Upload in deiner Anwendung oder in einem Job aus.

## Fehlerbehebung {#troubleshooting}

**Datei zu groß.** Die Datei überschreitet die maximale Dateigröße des Servers. Komprimiere oder teile
sie oder bitte einen Betreiber, `storage.max_file_bytes` zu erhöhen.

**Dateityp nicht zulässig.** Die Datei hat einen gesperrten Typ (ausführbare Datei, HTML, SVG,
Skript), ihre Endung oder ihr Inhalt sieht danach aus, oder sie steht nicht auf der Positivliste des
Servers. Prüfe die Regeln im Upload-Dialog. Wer das Produkt verwaltet, kann gesperrte Dateien als
inerte Anhänge aufbewahren lassen ([Inhaltstyp-Richtlinie](help:data-overview#content-type-policy)).

**Speicherkontingent erschöpft.** Der Mandant hat sein Byte- oder Dateikontingent erreicht. Lösche
Dateien oder bitte einen Product owner oder Product admin, [das Kontingent zu erhöhen](#edit-quota).
Abgelaufene Dateien zählen bis zur nächsten Bereinigung mit.

**Kein Zugriff auf die Dateien dieses Mandanten.** Deine Rollen gewähren in diesem Mandanten kein
`files:read`. Bitte einen Product owner oder den Owner des Mandanten um eine Rolle.

**Datei hochladen fehlt.** Dir fehlt in diesem Mandanten `files:write`, oder es ist kein Mandant
ausgewählt.

**Konflikt: Der Upload hat zu lange gedauert.** Der Upload blieb länger unvollständig als das
Zeitlimit des Servers (standardmäßig eine Stunde) und wurde verworfen. Lade erneut über eine
schnellere Verbindung hoch.

**Bitte prüfe deine Eingaben.** Die Labels sind kein flaches JSON-Objekt oder verstoßen gegen die
[Label-Regeln](#labels), oder **Läuft ab am** liegt in der Vergangenheit.

**Zwischenzeitlich geändert.** Jemand hat die Datei umbenannt, neu gelabelt oder gelöscht oder das
Kontingent geändert, nachdem du sie geöffnet hast. Lade neu und wiederhole den Vorgang.

**Ein Download-Link liefert „Nicht gefunden“.** Er ist abgelaufen, die Datei wurde gelöscht oder ist
abgelaufen, oder der Mandant bzw. das Produkt wurde gesperrt oder archiviert. Erstelle einen neuen
Link. Der Server beantwortet all diese Fälle absichtlich gleich.

**Der kopierte Link zeigt auf den falschen Host.** Signierte Links werden aus der öffentlichen URL des
Servers (`security.public_url`) gebildet. Bitte einen Betreiber, sie auf die Adresse zu setzen, die
die Empfänger erreichen können.

**Der Upload-Dialog zeigt weder Größengrenze noch erlaubte Typen.** Du kannst die
Servereinstellungen nicht lesen. Der Server setzt sie trotzdem durch; seine Fehlermeldung sagt dir,
welche Regel verletzt wurde.
