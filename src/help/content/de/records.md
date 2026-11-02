---
title: Datensätze
summary: Durchsuche, filtere, lege an, bearbeite und lösche die JSON-Datensätze, die Mandanten in Sammlungen speichern, und löse Konflikte vom Typ „zwischenzeitlich geändert“.
keywords: Datensätze, Daten, JSON, Dokumente, Sammlung, Collection, Einträge, Zeilen, Datenbank, Filter, Version, Konflikt, 412, If-Match, optimistische Nebenläufigkeit
---

_Datensätze_ sind kleine JSON-Objekte, die deine Anwendung über die Axentra-API speichert, zum
Beispiel Bestellungen, Notizen oder Einstellungen, ohne eine eigene Datenbanktabelle zu brauchen.
Jeder Datensatz gehört zu genau einem Mandanten und zu einer _Sammlung_ (einer benannten Gruppe wie
`orders`). Auf der Seite **Datensätze** kannst du dir diese Daten ansehen, Datensätze anhand ihres
Inhalts finden und mit Schreibberechtigung Datensätze von Hand korrigieren oder ergänzen.

> [!IMPORTANT]
> Die Seite erfordert das Servermodul `data`. Lesen erfordert `records:read` im Mandanten; Anlegen,
> Ändern und Löschen erfordert `records:write`. Die Mandantenrollen **Owner**, **Admin** und
> **Member** gewähren beides; **Viewer** liest nur. Die Produktrollen **Product owner** und
> **Product admin** dürfen in jedem Mandanten schreiben; **Support** und **Product viewer** lesen in
> jedem Mandanten. Die Liste aller Sammlungen erfordert `collections:read` (nur Produktrollen). Siehe
> [Rollen und Berechtigungen](help:roles-permissions).

## Sammlungen und Datensätze {#collections}

- Eine **Sammlung** entsteht, wenn der erste Datensatz in sie geschrieben wird, und verschwindet,
  wenn ihr letzter Datensatz gelöscht wird. Es gibt nichts zu konfigurieren. Namen bestehen aus
  Kleinbuchstaben, Ziffern und Unterstrichen, beginnen mit einem Buchstaben und haben höchstens 63
  Zeichen (`orders`, `support_notes`).
- Ein **Datensatz** hat eine **ID** (`rec_…`), seine **Daten** (ein JSON-Objekt), eine **Version**
  (beginnt bei 1 und steigt mit jeder Änderung), die Zeitpunkte **Erstellt**/**Aktualisiert** und den
  Benutzer oder API-Schlüssel, der ihn angelegt und zuletzt geändert hat (**Erstellt von**,
  **Geändert von**).
- Derselbe Sammlungsname in zwei Mandanten enthält zwei getrennte Mengen von Datensätzen. Studio
  zeigt immer genau einen Mandanten an; der Server setzt die Trennung durch.

## Datensätze durchsuchen {#browse}

1. Öffne **Daten & Speicher** › **Datensätze** ([Seite öffnen](app:records)).
2. Wähle oben einen **Mandanten**.
3. Wähle links in der Liste **Sammlungen** eine Sammlung. Die Zahl daneben zählt ihre Datensätze in
   allen Mandanten.

Die Tabelle zeigt **ID**, eine gekürzte Vorschau der **Daten**, **Version**, **Erstellt** und
**Aktualisiert**, die neuesten zuerst, 50 pro Seite; **Mehr laden** holt die nächste Seite. Wähle das
Augensymbol (**Datensatz … ansehen**), um den Datensatz mit allen Feldern und dem vollständigen,
formatierten JSON zu öffnen.

> [!TIP]
> Auf der Seite eines Mandanten öffnet **Datensätze ansehen** diese Seite mit bereits ausgewähltem
> Mandanten. In der [Datenübersicht](help:data-overview#collections) öffnet die Auswahl einer
> Sammlung diese hier.

Hast du keine Produktrolle, kann Studio die Sammlungen des Produkts nicht auflisten. Gib dann den
Namen der Sammlung unter **Name der Sammlung** ein und wähle **Öffnen**.

### Sortieren {#sort}

Wähle die Spaltenköpfe **ID**, **Erstellt** oder **Aktualisiert**, um zu sortieren; wähle sie erneut,
um die Reihenfolge umzukehren. Nach **Daten** lässt sich nicht sortieren.

## Nach Inhalt filtern {#filter}

1. Gib unter **Feld** den Namen eines Felds der obersten Ebene des JSON ein, zum Beispiel `status`.
2. Gib unter **Ist gleich** den Wert ein, zum Beispiel `open`.
3. Wähle **Filter hinzufügen**. Der Filter erscheint als Chip; das **×** an einem Chip entfernt ihn.

Mehrere Filter müssen alle zutreffen. Werte werden nach Möglichkeit als JSON gelesen: `true`, `42`,
`null`, `"42"` oder `{"city": "Graz"}` treffen mit ihrem Typ zu, alles andere (`open`) trifft als Text
zu. So findet `total` = `12` den Datensatz `{"total": 12}`, aber nicht `{"total": "12"}`.

Ein Filter ist eine _Enthaltensein_-Prüfung: Ein Objektwert trifft zu, wenn das Feld des Datensatzes
mindestens diese Schlüssel enthält. `address` = `{"city": "Graz"}` findet `{"address": {"city":
"Graz", "zip": "8010"}}`. Feldnamen dürfen nur Buchstaben, Ziffern und Unterstriche enthalten; filtere
verschachtelte Felder daher wie gezeigt über einen Objektwert.

## Einen Datensatz anlegen {#create}

1. Wähle den Mandanten (und optional die Sammlung).
2. Wähle **Neuer Datensatz**.
3. Behalte unter **Sammlung** den Sammlungsnamen bei oder gib einen ein. Ein neuer Name legt die
   Sammlung an.
4. Gib unter **Daten** ein JSON-Objekt ein, zum Beispiel:

   ```json
   { "status": "open", "total": 12, "customer": { "name": "Acme" } }
   ```

5. Wähle **Datensatz anlegen**. Studio wechselt zur Sammlung des Datensatzes.

ID, Version und Zeitpunkte setzt der Server; trag sie nicht in die Daten ein.

## Einen Datensatz bearbeiten {#edit}

1. Öffne den Datensatz (Augensymbol) und wähle **Bearbeiten**.
2. Ändere das JSON unter **Daten** und wähle **Änderungen speichern**.

Das Speichern **ersetzt das gesamte Objekt**: Felder, die du aus dem JSON entfernst, werden aus dem
Datensatz entfernt. Die Sammlung lässt sich nicht ändern; um einen Datensatz zu verschieben, lege ihn
in der anderen Sammlung an und lösche den alten.

### Versionen und Konflikte {#versions}

Studio teilt dem Server mit, welche Version du bearbeitet hast (HTTP `If-Match`). Hat jemand anderes,
eine Person oder deine Anwendung, den Datensatz geändert oder gelöscht, nachdem du ihn geöffnet hast,
lehnt der Server die Änderung mit **Zwischenzeitlich geändert** (HTTP 412) ab, statt die andere
Änderung stillschweigend zu überschreiben. Das gilt auch für das Löschen.

So löst du das: Schließe den Dialog, lade die Liste neu, öffne den Datensatz erneut, übertrage deine
Änderung auf die aktuellen Daten und speichere.

## Einen Datensatz löschen {#delete}

1. Öffne den Datensatz und wähle **Datensatz löschen**.
2. Bestätige mit **Datensatz löschen**.

> [!CAUTION]
> Das Löschen ist endgültig; es gibt keinen Papierkorb. Das Audit-Protokoll hält fest, dass der
> Datensatz gelöscht wurde (`data.record.delete`), aber nicht seine Daten.

## Einstellungen und Grenzen {#limits}

| Element       | Regel                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| Sammlungsname | `^[a-z][a-z0-9_]{0,62}$`: Kleinbuchstaben, Ziffern, Unterstriche, beginnt mit einem Buchstaben, höchstens 63 Zeichen |
| Daten         | Ein JSON-Objekt (kein Array und kein einfacher Wert), serialisiert höchstens 256 KiB                                 |
| Filterfeld    | Buchstaben, Ziffern, Unterstrich, beginnend mit einem Buchstaben oder Unterstrich, höchstens 63 Zeichen              |
| Sortierung    | `id`, `created_at`, `updated_at`, aufsteigend oder absteigend                                                        |
| Seitengröße   | 50 in Studio; die API akzeptiert ein `limit`                                                                         |

## Für Entwickler {#api}

Studio verwendet dieselbe API wie deine Anwendung. `C = /v1/products/{product_id}/tenants/{tenant_id}/records/{collection}`:

| Methode und Pfad                            | Berechtigung       | Zweck                                              |
| ------------------------------------------- | ------------------ | -------------------------------------------------- |
| `GET /v1/products/{product_id}/collections` | `collections:read` | Sammlungen mit Anzahlen                            |
| `GET C?where=&sort=&limit=&cursor=`         | `records:read`     | Liste; `where` ist ein JSON-Objekt (Enthaltensein) |
| `GET C/{record_id}`                         | `records:read`     | Ein Datensatz, `ETag` ist die Version              |
| `POST C` (Body: das Datenobjekt)            | `records:write`    | Anlegen (201)                                      |
| `PUT C/{record_id}`, `If-Match`             | `records:write`    | Daten ersetzen                                     |
| `DELETE C/{record_id}`, `If-Match`          | `records:write`    | Löschen (204)                                      |

```http
PUT /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE/records/orders/rec_01EXAMPLE
If-Match: "3"
Content-Type: application/json

{"status": "shipped", "total": 12}
```

Ohne `If-Match` überschreibt der Server bedingungslos. Jedes Anlegen, Ersetzen und Löschen schreibt
ein Audit-Ereignis (`data.record.create`, `data.record.replace`, `data.record.delete`) mit Sammlung
und Version, nie mit den Daten. Für relationale Daten mit vielen Zeilen oder Joins verwenden Produkte
statt Datensätzen eigene Tabellen; siehe [API-Grundlagen](help:api-basics).

## Fehlerbehebung {#troubleshooting}

**Zwischenzeitlich geändert.** Jemand hat den Datensatz geändert oder gelöscht, nachdem du ihn
geöffnet hast. Lade neu, öffne den Datensatz erneut und wiederhole deine Änderung. Siehe
[Versionen und Konflikte](#versions).

**Bitte prüfe deine Eingaben** beim Speichern. Sammlungsname oder Daten halten die
[Grenzen](#limits) nicht ein. Studio prüft bereits den Namen und ob die Daten ein JSON-Objekt sind;
die Servermeldung nennt das Problem.

**Zu groß.** Die Daten des Datensatzes überschreiten 256 KiB. Speichere große Inhalte als
[Datei](help:files) und behalte im Datensatz nur deren Datei-ID.

**Bitte prüfe deine Eingaben** beim Filtern: Ein Feldname enthält einen Punkt oder andere nicht
erlaubte Zeichen. Filtere verschachtelte Werte mit einem Objektwert (siehe
[Nach Inhalt filtern](#filter)).

**Die Liste Sammlungen zeigt einen Fehler oder „Nicht erlaubt“.** Das Auflisten von Sammlungen
erfordert `collections:read`, das nur Produktrollen haben. Gib den Sammlungsnamen stattdessen unter
**Name der Sammlung** ein.

**Neuer Datensatz, Bearbeiten und Datensatz löschen fehlen.** Deine Rolle gewährt in diesem Mandanten
kein `records:write`, oder es ist noch kein Mandant ausgewählt.

**Nicht gefunden.** Der Datensatz wurde gelöscht, der Mandant ist gesperrt (nur
Plattform-Administratoren erreichen gesperrte Mandanten), oder du hast keinen Zugriff auf diesen
Mandanten.

**Keine passenden Datensätze.** Entferne die Filter einzeln. Denk daran, dass `12` und `"12"`
verschiedene Werte sind.
