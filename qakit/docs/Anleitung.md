# Axentra Studio – Testversion: Anleitung

Mit dieser Testversion probierst du Axentra Studio auf deinem eigenen Computer aus.
Alles läuft nur bei dir. Die Testdaten sind erfunden.

> **Was diese Testversion ist – und was nicht**
>
> - **Ist:** eine lokale Testumgebung. Sie läuft nur auf deinem Computer und ist nur dort erreichbar.
> - **Ist:** mit erfundenen Testdaten gefüllt (Firmen, Personen, Dateien).
> - **Ist nicht:** eine fertige Version zum Ausliefern.
> - **Ist nicht:** eine Sicherheitsfreigabe. Wenn hier alles klappt, heißt das nicht, dass das Produkt sicher ist.
> - **Zahlungen sind nur simuliert.** Es fließt nie echtes Geld. Gib nirgends echte Kartendaten ein.
> - **Manche Teile sind absichtlich eingeschränkt** (kein Fehler): Die Beispiel-Jobs bleiben „Wartend“. Webhook-Zustellungen scheitern. Der Checkout-Link führt ins Leere. Studios eigener Bereich „Postfach“ meldet „nicht verfügbar“. Der SSO-Testbenutzer kann sich nicht anmelden. Details stehen auf der Kit-Seite im Tab **Integrationen**.
> - **E-Mails gehen nie hinaus.** Jede Mail landet in einem lokalen Mail-Fänger (ein Programm, das Mails auffängt, statt sie zu versenden). Du siehst sie auf der Kit-Seite im Tab **E-Mails**.

---

## 1 Herunterladen

Lade die passende Datei für deinen Computer herunter:

| Dein Computer                      | Datei                          |
| ---------------------------------- | ------------------------------ |
| Windows 10 oder 11 (64 Bit)        | `AxentraStudio-QA-windows.zip` |
| Mac mit Apple-Chip (M1 oder neuer) | `AxentraStudio-QA-macos.zip`   |
| Linux (64 Bit, x86)                | `AxentraStudio-QA-linux.zip`   |

Entpacke die ZIP-Datei (Doppelklick, bei Windows: Rechtsklick > **Alle extrahieren**).
Du bekommst einen Ordner `AxentraStudio-QA`. Darin liegen die Skripte und der Ordner `Dokumente` (diese Anleitung und die Checklisten). Leg ihn an einen Ort, den du wiederfindest, zum Beispiel auf den Schreibtisch.
Wichtig: Starte nichts direkt aus der ZIP-Datei heraus. Erst entpacken.
Macs mit Intel-Prozessor werden nicht unterstützt, weil es einige benötigte Bibliotheken dafür nicht mehr gibt. Nimm in dem Fall einen Windows- oder Linux-Computer.
Verschiebe oder benenne den Ordner nach dem ersten Start nicht mehr um. Falls doch: **6 - Deinstallieren** am neuen Ort ausführen und neu beginnen.

## 2 Installieren

Du musst sonst nichts installieren. Die Datenbank (PostgreSQL) und Studio sind schon im Ordner.

- Du brauchst etwa **600 MB** freien Speicherplatz.
- Beim **ersten** Installieren brauchst du **einmal Internet**. Der Kit lädt dann Python und geprüfte Programmbausteine (etwa 150 MB). Danach läuft alles ohne Internet.

Im Ordner liegen sechs Skripte (kleine Startdateien). Die Endung hängt vom System ab: Windows `.cmd`, Mac `.command`, Linux `.sh`.

| Skript                          | Was es tut                                                 |
| ------------------------------- | ---------------------------------------------------------- |
| **1 - Installieren**            | Richtet die Testversion ein.                               |
| **2 - Starten**                 | Startet alles und öffnet Studio im Browser.                |
| **3 - Beenden**                 | Stoppt alles.                                              |
| **4 - Testdaten sichern**       | Kopiert die Testdaten in den Ordner `Sicherungen`.         |
| **5 - Testdaten zuruecksetzen** | Löscht die Testdaten. Beim nächsten Start gibt es frische. |
| **6 - Deinstallieren**          | Entfernt alles, was der Kit angelegt hat.                  |

Du kannst **1 - Installieren** doppelklicken. Du musst aber nicht: **2 - Starten** installiert automatisch, wenn nötig.

### Warnungen beim ersten Doppelklick

Die Skripte sind nicht von Apple oder Microsoft signiert (also nicht „beglaubigt“). Darum warnt dein System beim ersten Mal. Das ist hier erwartet.

- **Windows** (blaues Fenster „Der Computer wurde durch Windows geschützt“): Klick auf **Weitere Informationen**, dann auf **Trotzdem ausführen**.
- **Mac** („kann nicht geöffnet werden“): Rechtsklick auf das Skript > **Öffnen** > nochmal **Öffnen**.
  Bei neueren macOS-Versionen klappt das nicht mehr. Dann: **Systemeinstellungen** > **Datenschutz & Sicherheit** > ganz unten **Trotzdem öffnen**. Danach das Skript nochmal doppelklicken.
- **Linux**: Wenn sich beim Doppelklick nur ein Texteditor öffnet: Rechtsklick > **Als Programm ausführen**. Oder Terminal im Ordner öffnen und `./"2 - Starten.sh"` eingeben.

## 3 Erster Start

1. Doppelklick auf **2 - Starten**.
2. Ein kleines schwarzes Fenster (Terminal) geht auf. Darin steht, was gerade passiert.
3. Beim ersten Start dauert es etwas länger (wenige Minuten). Der Kit installiert, legt die Testdatenbank an und füllt sie mit Testdaten.
4. Dann öffnet sich dein Browser mit Studio: **http://127.0.0.1:8765/**

**Lass das schwarze Fenster offen**, solange du testest. Du kannst es kleiner machen (minimieren). Wenn du es schließt, ist Studio aus.

Zwei Adressen solltest du kennen:

| Adresse                   | Was dort ist                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| http://127.0.0.1:8765/    | **Studio** selbst. Hier testest du.                                                                                                                                                                                             |
| http://127.0.0.1:8765/qa/ | **Kit-Seite** mit den Tabs **Start** (Testbenutzer mit Passwörtern), **QA-Checkliste** (zum Abhaken), **E-Mails** (abgefangene Mails), **Integrationen** (Status der Anbindungen und Link zum API-Testbereich) und **Version**. |

Im Tab **Integrationen** steht bei jeder Anbindung (Verbindung zu einem anderen Dienst), wie sie läuft:
**Echt, lokal** (läuft wirklich, aber nur auf deinem Computer), **Simuliert** (nachgemacht, z. B. Zahlungen) oder **Nicht konfiguriert** (gibt es in dieser Testversion nicht).

## 4 Anmelden mit Testbenutzern

Studio zeigt zuerst die Seite **Anmelden**. Gib **E-Mail-Adresse** und **Passwort** ein und klick auf **Anmelden**.

Die Testbenutzer findest du auf der Kit-Seite **http://127.0.0.1:8765/qa/** im Tab **Start**. Dort stehen immer die gültigen Adressen und Passwörter. Die meisten Testdaten gehören zum Beispielprodukt **Beispiel-CRM (Test)**. Die wichtigsten Benutzer:

Alle Testbenutzer haben dasselbe Passwort `Axentra-Test-2026!` (maßgeblich ist die Kit-Seite). Alle Namen enden mit „(Test)“.

| Name                     | E-Mail-Adresse              | Was die Person darf                                                |
| ------------------------ | --------------------------- | ------------------------------------------------------------------ |
| Alex Admin (Test)        | alex.admin@example.com      | Plattform-Administration: darf alles. Für die meisten Tests.       |
| Paula Plattform (Test)   | paula.plattform@example.com | Darf überall nur lesen. Jeder Ändern-Versuch muss scheitern.       |
| Otto Inhaber (Test)      | otto.inhaber@example.com    | Inhaber des Produkts „Beispiel-CRM (Test)“.                        |
| Ole Operator (Test)      | ole.operator@example.com    | Verwaltet das Produkt „Beispiel-CRM (Test)“.                       |
| Sabine Support (Test)    | sabine.support@example.com  | Darf im Produkt fast nur lesen (Support).                          |
| Bea Abrechnung (Test)    | bea.abrechnung@example.com  | Nur Nutzung und Abrechnung.                                        |
| Maria Muster (Test)      | maria.muster@example.com    | Inhaberin des Mandanten „Muster GmbH (Test)“.                      |
| Jonas Beispiel (Test)    | jonas.beispiel@example.com  | Verwaltet den Mandanten „Muster GmbH (Test)“.                      |
| Lena Demo (Test)         | lena.demo@example.com       | Normales Mitglied in zwei Mandanten.                               |
| Karin Kunde (Test)       | karin.kunde@example.com     | Inhaberin des Mandanten „Beispiel AG (Test)“.                      |
| Sven Service (Test)      | sven.service@example.com    | Darf bei „Muster GmbH (Test)“ nur lesen.                           |
| Frieda Verein (Test)     | frieda.verein@example.com   | Inhaberin eines **gesperrten** Mandanten.                          |
| Markus Laden (Test)      | markus.laden@example.com    | Inhaber eines Mandanten im zweiten Produkt „Beispiel-Shop (Test)“. |
| Erik Ohne-Mandant (Test) | erik.ohne@example.com       | Hat gar keine Rechte. Sieht nach der Anmeldung nichts.             |
| Tobias Test (Test)       | tobias.test@example.com     | Ist **deaktiviert**. Anmeldung muss scheitern.                     |
| SSO Nutzer (Test)        | sso.nutzer@example.com      | Hat kein Passwort. Anmeldung geht nicht (ist Absicht).             |

Ein **Mandant** ist ein Kunde des Produkts, zum Beispiel eine Firma mit eigenen Daten.

**Abmelden:** oben rechts auf deinen Namen klicken (Benutzermenü) > **Abmelden**.
Um einen anderen Benutzer zu testen: abmelden und neu anmelden. Oder ein privates Browserfenster nehmen.

## 5 Tests durchführen

**Empfohlen: die Checkliste auf der Kit-Seite.**
Öffne **http://127.0.0.1:8765/qa/** und dort den Tab **QA-Checkliste**. Am besten in einem zweiten Browser-Tab neben Studio.

1. Arbeite die Abschnitte der Reihe nach ab. Abschnitt A zuerst. Jeder Fall dauert 1 bis 3 Minuten.
2. Jeder Fall sagt dir: mit welchem Testbenutzer, welche Schritte, was passieren sollte, woran du einen Fehler erkennst.
3. Wähle das Ergebnis: **Bestanden**, **Fehlgeschlagen**, **Nicht getestet** oder **Nicht anwendbar**. Schreib bei Bedarf eine Notiz dazu.
4. Wenn etwas anders ist als erwartet: **Screenshot machen** (wie das geht, steht in der Fehlerbericht-Vorlage). Speicher ihn im Ordner `QA-Ergebnisse` und nenne ihn z. B. `B-03_1.png`. Trag den Dateinamen beim Fall ein.
5. Für jeden Fehler zusätzlich die **Fehlerbericht-Vorlage.md** (im Ordner `Dokumente`) ausfüllen.
6. Mach einfach weiter mit dem nächsten Fall.

Alles wird **automatisch gespeichert** (in `QA-Ergebnisse/ergebnisse.json` im Kit-Ordner). Du kannst jederzeit aufhören und später weitermachen.
Zum Weitergeben: **Ergebnis herunterladen (Text)** oder **Ergebnis herunterladen (Tabelle)**. Schick die Datei zusammen mit deinen Screenshots und Fehlerberichten.

**Ersatzweise: auf Papier oder in Excel.** Im Ordner `Dokumente` liegen dieselben Testfälle als **QA-Checkliste.md** (zum Lesen oder Ausdrucken) und **QA-Ergebnisse.csv** (zum Ausfüllen in Excel, Numbers oder LibreOffice; danach wieder als CSV speichern).

Hilfe in Studio selbst: links unten **Hilfecenter**, oder die kleinen (i)-Knöpfe neben Beschriftungen.

## 6 Beenden

Doppelklick auf **3 - Beenden**. Oder schließ das schwarze Fenster.
Beides stoppt alles, auch die Datenbank. Deine Testdaten bleiben erhalten.

## 7 Erneut starten

Doppelklick auf **2 - Starten**. Diesmal geht es schneller.
Du siehst die Testdaten so, wie du sie verlassen hast. Deine Änderungen sind noch da.

## 8 Testdaten sichern und zurücksetzen

**Sichern:** Doppelklick auf **4 - Testdaten sichern**.
Die Testdaten werden in den Ordner `Sicherungen` im Kit-Ordner kopiert. Jede Sicherung bekommt einen Unterordner mit Datum und Uhrzeit, z. B. `Sicherungen/2026-11-14_10-30-00/`. Läuft Axentra Studio gerade, wird es dafür zuerst beendet.

**Zurücksetzen:** Doppelklick auf **5 - Testdaten zuruecksetzen**.

1. Das Skript fragt, ob du wirklich zurücksetzen willst.
2. Es bietet dir vorher eine Sicherung an. Im Zweifel: ja.
3. Dann löscht es die Testdaten.
4. Beim nächsten **2 - Starten** gibt es wieder frische Testdaten, wie beim ersten Mal.

**Sicherung wiederherstellen** (selten nötig):

1. **3 - Beenden** ausführen.
2. **5 - Testdaten zuruecksetzen** ausführen (die Frage nach einer Sicherung mit „n“ beantworten, wenn du den jetzigen Stand nicht brauchst).
3. Den gewünschten Unterordner aus `Sicherungen` in den Ordner `_kit` kopieren und dort in `daten` umbenennen.
4. **2 - Starten**. Du arbeitest jetzt mit dem gesicherten Stand weiter.

Gut zu wissen: Alle Daten des Kits liegen **im Kit-Ordner selbst**. Die Testdaten in `AxentraStudio-QA/_kit/daten/`, die Sicherungen in `AxentraStudio-QA/Sicherungen/`, deine Testergebnisse in `AxentraStudio-QA/QA-Ergebnisse/`. Zurücksetzen löscht nur die Testdaten, nicht deine Ergebnisse. Der Kit schreibt nichts an andere Stellen auf deinem Computer.

## 9 Deinstallieren

1. Doppelklick auf **6 - Deinstallieren**.
2. Das Skript stoppt alles und fragt nach.
3. Es bietet dir eine Sicherung an.
4. Es löscht die Teile, die der Kit angelegt hat (im Ordner `_kit`: `env`, `python`, `cache`, `daten`).
5. Danach ziehst du den Ordner `AxentraStudio-QA` in den Papierkorb.
   **Vorher:** Wenn du etwas behalten willst, kopier die Ordner `QA-Ergebnisse` (deine Testergebnisse und Screenshots) und `Sicherungen` an einen anderen Ort.

Sonst wird auf deinem Computer nichts verändert.

---

## Wenn etwas nicht klappt

**Im schwarzen Fenster steht, dass der Port 8765 belegt ist.**
Ein Port ist eine Art Türnummer, über die Studio erreichbar ist. Diese Tür benutzt gerade ein anderes Programm.
Meist läuft die Testversion schon (z. B. in einem vergessenen Fenster). Doppelklick auf **3 - Beenden**, dann wieder **2 - Starten**. Hilft das nicht: Computer neu starten und nochmal versuchen.

**Der Browser hat sich nicht geöffnet.**
Öffne deinen Browser selbst und tippe in die Adresszeile: **http://127.0.0.1:8765/**
Nimm einen aktuellen Browser (Chrome, Edge, Firefox oder Safari).

**Ich habe das schwarze Fenster aus Versehen geschlossen.**
Kein Problem. Deine Daten sind noch da. Doppelklick auf **2 - Starten**.
Studio im Browser zeigt in der Zwischenzeit **Server nicht erreichbar** oder **Keine Verbindung zu Axentra**. Nach dem Neustart: Seite neu laden (Taste F5, beim Mac Cmd+R).

**Die Seite lädt ewig oder zeigt einen Fehler.**
Seite neu laden. Schau ins schwarze Fenster: Steht dort eine Fehlermeldung? Mach einen Screenshot davon für den Fehlerbericht.

**Mac: „kann nicht geöffnet werden, da es von einem nicht verifizierten Entwickler stammt“.**
Siehe oben unter _Warnungen beim ersten Doppelklick_: Rechtsklick > **Öffnen**, oder **Systemeinstellungen** > **Datenschutz & Sicherheit** > **Trotzdem öffnen**.

**Windows: „Der Computer wurde durch Windows geschützt“.**
**Weitere Informationen** > **Trotzdem ausführen**.

**Windows fragt nach der Firewall (Netzwerkzugriff).**
Die Testversion braucht kein Netzwerk nach außen. Du kannst **Abbrechen** wählen. Studio läuft trotzdem auf deinem Computer.

**Die erste Installation bricht ab.**
Prüfe deine Internetverbindung (nur beim ersten Mal nötig) und ob genug Speicherplatz frei ist (etwa 600 MB). Dann nochmal **2 - Starten**.

**Ich komme mit einem Testbenutzer nicht rein.**
Prüfe Adresse und Passwort auf **http://127.0.0.1:8765/qa/** (Tab **Start**). Achte auf Groß- und Kleinschreibung. Tobias Test und SSO Nutzer können sich absichtlich nicht anmelden. Nach zu vielen Fehlversuchen kommt **Zu viele Anfragen**: eine Minute warten.

**Im schwarzen Fenster steht, dass der Ordnerpfad ein Sonderzeichen enthält.**
Die Datenbank verträgt die Zeichen `$`, `` ` ``, `"`, `%` und `!` im Ordnernamen nicht. Entpacke das Testpaket in einen Ordner ohne diese Zeichen, zum Beispiel in `Downloads`.

**Alles ist durcheinander.**
**4 - Testdaten sichern** (falls du etwas behalten willst), dann **5 - Testdaten zuruecksetzen**, dann **2 - Starten**.
