---
title: Suche
summary: Den Volltextindex eines Mandanten durchsuchen, die Ergebnisse nach Art eingrenzen, ein indiziertes Dokument ansehen und einen falschen Eintrag aus dem Index entfernen.
keywords: Suche, Volltext, finden, Index, Suchindex, indiziertes Dokument, Art, Referenz-ID, Hervorhebung, Wortfolge, ausschließen, search:query, search:index
---

Die Seite **Suche** durchsucht den Volltextindex, den dein Produkt für jeden Mandanten führt. Das
Produkt legt den durchsuchbaren Text seiner eigenen Objekte in diesem Index ab (eine Rechnung, einen
Kontakt, ein Ticket); in Studio kannst du ihn so abfragen wie deine Benutzer, prüfen, was indiziert
ist, und einen Eintrag entfernen, der dort nicht hingehört.

Der Index ist eine _Kopie_: Dein Produkt schreibt ihn und bleibt die maßgebliche Quelle. Axentra
liest Datensätze, Dateien oder die Tabellen deines Produkts nicht von selbst, ein Objekt erscheint
also erst in der Suche, wenn das Produkt es indiziert hat.

> [!IMPORTANT]
> Die Seite erfordert das Servermodul `search`. Suchen erfordert `search:query` im Mandanten; ein
> Dokument aus dem Index entfernen erfordert `search:index` (siehe [Wer was darf](#permissions)).

## Wer was darf {#permissions}

| Rolle                                                | Suchen (`search:query`) | Aus dem Index entfernen (`search:index`) |
| ---------------------------------------------------- | ----------------------- | ---------------------------------------- |
| Mandant **Owner**, **Admin**                         | ja                      | ja                                       |
| Mandant **Member**, **Viewer**                       | ja                      | nein                                     |
| **Product owner**, **Product admin** (jeder Mandant) | ja                      | ja                                       |
| **Support**, **Product viewer** (jeder Mandant)      | ja                      | nein                                     |
| **Plattform-Administration**                         | ja                      | ja                                       |
| **Plattform-Leserecht**                              | ja                      | nein                                     |

Mitglieder können standardmäßig nicht in den Index schreiben, weil jeder Eintrag allen angezeigt
wird, die im Mandanten suchen dürfen. Eine eigene Rolle kann beide Berechtigungen gewähren; siehe
[Rollen und Berechtigungen](help:roles-permissions).

## Einen Mandanten durchsuchen {#query}

1. Öffne **Daten & Speicher** › **Suche** ([Seite öffnen](app:search)).
2. Wähle einen **Mandanten**. Jeder Mandant hat einen eigenen Index; eine Suche über alle
   Mandanten gibt es nicht.
3. Gib unter **Suchen nach** deine Suche ein und wähle **Suchen** (oder drücke die Eingabetaste).

| Du gibst ein       | Die Suche findet                                                  |
| ------------------ | ----------------------------------------------------------------- |
| `invoice acme`     | Dokumente, die beide Wörter enthalten (in beliebiger Reihenfolge) |
| `"late payment"`   | Dokumente, die genau diese Wortfolge enthalten                    |
| `invoice or offer` | Dokumente, die mindestens eines der Wörter enthalten              |
| `invoice -draft`   | Dokumente mit `invoice`, die `draft` nicht enthalten              |

Die Suche findet ganze Wörter und unterscheidet nicht zwischen Groß- und Kleinschreibung, findet
aber keine Wortteile (`inv` findet nicht `invoice`, außer mit [Wortanfänge finden](#prefix)) und korrigiert keine Tippfehler. Ob
`invoices` auch `invoice` findet, hängt von der Sprache ab, mit der der Server indiziert (siehe
[Gut zu wissen](#limits)).

Suche und Mandant stehen in der Adresse, du kannst eine Suche also als Lesezeichen speichern oder
den Link an jemanden schicken, der Zugriff auf denselben Mandanten hat.

### Wortanfänge finden {#prefix}

Wähle **Wortanfänge finden** für die Suche beim Tippen: Jedes eingegebene Wort muss passen, und
Wörter ab zwei Zeichen finden auch längere Wörter, die damit beginnen (`inv` findet `invoice`,
`inv acme` findet Dokumente mit einem Wort, das mit `inv` beginnt, und dem Wort `acme`). In diesem
Modus haben Anführungszeichen, `or` und `-Wort` keine besondere Bedeutung, und nur die ersten acht
Wörter zählen. Die Auswahl ist wie die Suche selbst Teil der Adresse.

### Nach Art eingrenzen {#kinds}

Jedes indizierte Dokument hat eine **Art**, die dein Produkt festlegt, zum Beispiel `invoice` oder
`note`. Gib unter **Arten** eine oder mehrere Arten durch Kommas getrennt ein, um nur diese zu
sehen. Arten bestehen aus Kleinbuchstaben, Ziffern, Punkten, Bindestrichen und Unterstrichen und
beginnen mit einem Buchstaben; höchstens 20 auf einmal. Lass das Feld leer, um alle Arten zu
durchsuchen.

Unter dem Feld listet **Indizierte Arten** die Arten im Index des Mandanten mit der Anzahl ihrer
Dokumente. Wähle eine aus, um sie ins Feld zu übernehmen, oder wähle sie erneut, um sie zu entfernen.

## Die Ergebnisse lesen {#results}

Die Ergebnisse sind nach Relevanz sortiert: Treffer im Titel zählen mehr als Treffer im Text, mehr
Treffer zählen mehr, und bei gleichwertigen Ergebnissen steht das zuletzt aktualisierte vorne. Jedes
Ergebnis zeigt:

- den **Titel** mit hervorgehobenen Treffern (oder die Referenz-ID, wenn das Dokument keinen Titel
  hat),
- die **Art** und die **Referenz-ID**, also die eigene ID des Objekts in deinem Produkt,
- wann das Dokument zuletzt im Index **aktualisiert** wurde,
- bis zu zwei kurze Textstellen mit hervorgehobenen Treffern.

Zuerst werden zwanzig Ergebnisse angezeigt; **Mehr laden** holt die nächsten. Der Zähler unter der
Liste sagt, wie viele angezeigt werden und ob es weitere gibt.

> [!NOTE]
> Die Ergebnisse sind keine Momentaufnahme. Ändert das Produkt den Index, während du blätterst,
> kann ein Dokument verrutschen und doppelt oder gar nicht erscheinen. Sehr tiefes Blättern (ab
> Position 1000 in der Standardeinstellung) wird abgelehnt; verfeinere stattdessen die Suche.

## Ein indiziertes Dokument ansehen {#document}

Wähle den Titel eines Ergebnisses. Eine Seitenleiste zeigt, was der Index dazu enthält: **Art**,
**Referenz-ID**, **Dokument-ID** (`sdoc_…`), **Version** (steigt mit jeder neuen Indizierung),
**Sprache**, wer es indiziert hat (**Indiziert von**, **Zuletzt indiziert von**) und wann, den
vollständigen **Text** und die **Metadaten**, die dein Produkt dazu gespeichert hat. Metadaten
werden angezeigt, aber nicht durchsucht.

## Ein Dokument aus dem Index entfernen {#remove}

Wenn ein Dokument nicht in der Suche erscheinen soll (zum Beispiel weil es versehentlich indiziert
wurde oder zu einem gelöschten Objekt gehört), kannst du es entfernen:

1. Öffne das Dokument aus den Ergebnissen.
2. Wähle **Aus dem Index entfernen** und bestätige.

> [!WARNING]
> Das entfernt nur den Indexeintrag. Das Originalobjekt in deinem Produkt bleibt unverändert, und
> das Produkt fügt den Eintrag wieder hinzu, sobald es dieses Objekt das nächste Mal indiziert. Um
> etwas dauerhaft zu entfernen, lösche oder ändere es in deinem Produkt.

## Wie Dokumente in den Index kommen {#index}

Dein Produkt indiziert seine Objekte über die API (`PUT …/search/documents/{kind}/{ref_id}` mit
`search:index`), meist direkt nach dem Speichern eines Objekts oder in einem [Job](help:jobs), der
es erneut versucht. Wird dieselbe Art mit derselben Referenz-ID erneut indiziert, ersetzt das das
Dokument. Studio legt selbst keine Dokumente an. Wer ein Dokument indiziert hat, steht am Dokument
und, sofern der Server das nicht abschaltet, im [Audit-Log](help:audit)
(`search.document.upsert`, `search.document.delete`), ohne seinen Text.

## Gut zu wissen {#limits}

| Punkt           | Regel                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Umfang          | Immer ein Mandant. Alle mit `search:query` im Mandanten sehen jedes Dokument dieses Mandanten.                                       |
| Suchtext        | 1 bis 500 Zeichen. Eine Suche nur aus Satzzeichen oder sehr häufigen Wörtern findet nichts.                                          |
| Arten           | `^[a-z][a-z0-9_.-]{0,62}$`, höchstens 20 pro Suche                                                                                   |
| Übereinstimmung | Ganze Wörter, mit **Wortanfänge finden** auch Wortanfänge; keine unscharfe oder akzentunabhängige Suche (`café` findet nicht `cafe`) |
| Sprache         | Eine pro Installation (Servereinstellung `search.language`, Standard `simple`: ohne Wortstamm und Stoppwörter)                       |
| Blättern        | 20 pro Seite in Studio, höchstens bis Position `search.max_offset` (Standard 1000)                                                   |

## Fehlerbehebung {#troubleshooting}

### Keine Treffer {#no-results}

Prüfe die Schreibweise, verwende ganze Wörter und weniger davon und entferne den Artfilter. Wenn
das Objekt dabei sein müsste, hat dein Produkt es für diesen Mandanten (noch) nicht indiziert: Der
Index enthält nur, was das Produkt hineinlegt.

### Die Suche hat zu lange gedauert {#too-expensive}

**Suche hat zu lange gedauert** bedeutet, dass der Server die Suche nach ihrem Zeitlimit abgebrochen
hat (Servereinstellung `search.statement_timeout_ms`, Standard 5 Sekunden), meist weil ein sehr
häufiges Wort oder ein kurzer Wortanfang auf einen großen Teil eines großen Index passt. Verwende
genauere oder mehr Wörter, schalte **Wortanfänge finden** aus oder grenze die Suche mit einem
Artfilter ein.

### Andere Meldungen {#messages}

**Du kannst diesen Mandanten nicht durchsuchen.** Deine Rolle in diesem Mandanten enthält
`search:query` nicht. Frag einen Owner oder Admin des Mandanten.

**Die Suche wird als „Modul nicht aktiviert“ angezeigt.** Der Server läuft ohne das Modul
`search`. Siehe [Module](help:modules-reference#search-realtime).

**Bitte prüfe deine Eingaben.** Die Suche ist länger als 500 Zeichen, eine Art ist ungültig, oder du
hast tiefer geblättert, als der Server erlaubt. Kürze oder verfeinere die Suche.

**Nicht gefunden** beim Öffnen eines Dokuments. Das Produkt hat es aus dem Index entfernt, nachdem
die Ergebnisse geladen wurden. Suche erneut.

**Aus dem Index entfernen fehlt.** Deine Rolle enthält `search:index` in diesem Mandanten nicht.
