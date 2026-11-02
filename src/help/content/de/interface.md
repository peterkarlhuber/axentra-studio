---
title: Sich in Studio zurechtfinden
summary: Der Aufbau von Studio, die Seitenleiste, der Produktwechsler, das Benutzermenü, das Dashboard und die integrierte Hilfe.
keywords: Oberfläche, Aufbau, Layout, Navigation, Seitenleiste, Menü, Schublade, mobil, Smartphone, Brotkrümel, Breadcrumbs, Produktwechsler, Benutzermenü, Sprache, Darstellung, Dark Mode, dunkler Modus, heller Modus, Dashboard, Hilfe, Infotipp, Suche, Tastatur
---

Dieser Artikel zeigt, wie Studio aufgebaut ist, damit du jede Seite schnell findest. Er behandelt die
Navigation, den Wechsel zwischen Produkten, persönliche Einstellungen wie Sprache und Darstellung, das
Dashboard und die Hilfe, die in jede Seite eingebaut ist.

## Der Aufbau {#layout}

Nach der Anmeldung öffnet Studio das Dashboard des zuletzt verwendeten Produkts oder die
Produktliste, wenn du noch keines hast. Jede Seite besteht aus drei Teilen:

- **Seitenleiste** (links): die Navigation, nach Bereichen gruppiert.
- **Obere Leiste**: links die **Brotkrümelnavigation** (der Pfad zur aktuellen Seite, jeder Schritt
  anklickbar), rechts der **Produktwechsler**, der Hilfe-Button und das **Benutzermenü**.
- **Inhaltsbereich**: der Seitentitel mit einer einzeiligen Beschreibung, rechts die Hauptaktion der
  Seite (zum Beispiel **Neuer Mandant**) und darunter Filter, Tabellen, Karten und Tabs.

## Die Seitenleiste {#sidebar}

Die Seitenleiste listet die Bereiche in dieser Reihenfolge:

| Gruppe                      | Einträge                                               |
| --------------------------- | ------------------------------------------------------ |
| (oben)                      | **Dashboard**, **Produkte**                            |
| **Identität & Mandanten**   | **Mandanten**, **Benutzer**, **Einladungen**           |
| **Zugriff & API-Schlüssel** | **Rollen**, **Berechtigungen**, **API-Schlüssel**      |
| **Daten & Speicher**        | **Datenübersicht**, **Datensätze**, **Dateien**        |
| **Ereignisse & Jobs**       | **Jobs**, **Zeitpläne**, **Ereignisse**, **Webhooks**  |
| **Nutzung & Abrechnung**    | **Nutzung**, **Tarife**, **Abonnements**               |
| (einzeln)                   | **Benachrichtigungen**                                 |
| **Audit & Überwachung**     | **Audit-Protokoll**, **Systemzustand**, **Monitoring** |
| (unten)                     | **Einstellungen**, **Hilfecenter**                     |

Einträge, die zu einem Produkt gehören (von **Dashboard** bis **Benachrichtigungen**, außer
**Produkte**), werden nur angezeigt, wenn ein Produkt ausgewählt ist. **Produkte**,
**Audit-Protokoll**, **Systemzustand**, **Monitoring** und **Einstellungen** sind plattformweit.

Die Seitenleiste zeigt allen dieselben Einträge. Öffnest du eine Seite, für die dir die Berechtigung
fehlt, teilt dir die Seite das mit (**Nicht erlaubt**), und Aktionen, die du nicht ausführen darfst,
werden nicht angeboten.

### Mit „Aus“ gekennzeichnete Einträge {#module-off}

Ein Eintrag, dessen Servermodul nicht aktiviert ist, bleibt sichtbar und zeigt **Aus**. Öffnest du
ihn, erscheint **Modul auf diesem Server nicht aktiviert** mit der Modul-ID (zum Beispiel `storage`),
die der Serverbetreiber aktivieren muss. So siehst du, was es gibt und was fehlt. Siehe
[Module](help:concepts#modules).

### Die Seitenleiste einklappen {#collapse-sidebar}

Unten in der Seitenleiste reduziert **Seitenleiste einklappen** sie auf Symbole; **Seitenleiste
ausklappen** bringt die Beschriftungen zurück. In der eingeklappten Seitenleiste siehst du den Namen
eines Symbols, wenn du mit der Maus darüberfährst oder es fokussierst. Studio merkt sich die Wahl in
diesem Browser. Die Serverversion wird unten in der ausgeklappten Seitenleiste angezeigt.

### Auf Smartphones und kleinen Bildschirmen {#mobile}

Studio funktioniert ab 360 Pixeln Breite. Auf schmalen Bildschirmen wird die Seitenleiste zu einer
ausziehbaren Schublade: Öffne sie mit **Navigation öffnen** (dem Menü-Button oben links). Die Schublade schließt
sich, wenn du eine Seite wählst, mit **Navigation schließen** oder mit Escape. Breite Tabellen
scrollen in ihrem eigenen Bereich, und weniger wichtige Spalten können ausgeblendet sein.

## Das Produkt wechseln {#product-switcher}

Die meisten Bereiche gehören zu einem Produkt; die Adresse enthält dann `/p/<product id>/`. Der
**Produktwechsler** in der oberen Leiste zeigt das aktuelle Produkt (**Produkt** und seinen Namen).

1. Wähle den Produktwechsler aus.
2. Wähle ein anderes Produkt aus der Liste oder **Alle Produkte**, um die Produktliste zu öffnen.

Studio bleibt beim Wechsel im selben Bereich: Siehst du dir gerade die Mandanten von Produkt A an,
landest du bei den Mandanten von Produkt B. Studio merkt sich das zuletzt verwendete Produkt pro
Browser. Archivierte Produkte erscheinen nicht im Wechsler; öffne sie unter **Produkte**.

Auf plattformweiten Seiten (zum Beispiel **Audit-Protokoll** oder **Einstellungen**) kann der
Wechsler **Kein Produkt ausgewählt** anzeigen.

Im **Einzelproduktbetrieb** gibt es kein Menü: Die obere Leiste zeigt eine feste Beschriftung
**Produkt** mit dem Namen des einen Produkts des Servers. Siehe
[Einzel- und Mehrproduktbetrieb](help:concepts#single-multi-product).

## Brotkrümelnavigation {#breadcrumbs}

Die Brotkrümelnavigation zeigt, wo du dich befindest, zum Beispiel _Mandanten › ten_01EXAMPLE_.
Wähle einen früheren Schritt, um eine Ebene zurückzugehen.

## Das Benutzermenü {#user-menu}

Öffne das Benutzermenü über deine Initialen und deinen Namen oben rechts. Es enthält:

| Eintrag         | Was er bewirkt                                                              |
| --------------- | --------------------------------------------------------------------------- |
| **Profil**      | Dein Konto: Name, Passwort, aktive Sitzungen. Siehe [Profil](help:profile). |
| **Sprache**     | Die Sprache der Oberfläche. Siehe [unten](help:interface#language).         |
| **Darstellung** | **Hell**, **Dunkel** oder **System**. Siehe [unten](help:interface#theme).  |
| **Abmelden**    | Beendet deine Sitzung. Siehe [An- und Abmelden](help:signing-in#sign-out).  |

### Sprache {#language}

Wähle im Benutzermenü **Sprache** und dann eine Sprache. Die Änderung gilt sofort. Die Sprache wird in diesem
Browser und in deinem Konto gespeichert und gilt deshalb auch in anderen Browsern. Du kannst sie auch
unter **Einstellungen** oder vor der Anmeldung auf der Anmeldeseite ändern. Ohne eigene Wahl folgt
Studio der Sprache des Browsers. Datum, Uhrzeit und Zahlen werden für die gewählte Sprache
formatiert.

> [!NOTE]
> Manche Texte kommen vom Server und sind immer englisch: die Namen und Beschreibungen der
> integrierten Rollen (zum Beispiel „Product admin“, „Owner“), die Beschreibungen im
> Berechtigungskatalog und die Servermeldung in den technischen Details eines Fehlers.

### Darstellung {#theme}

Wähle im Benutzermenü **Darstellung**: **Hell**, **Dunkel** oder **System** (folgt deinem
Betriebssystem). Wie die Sprache wird die Darstellung in diesem Browser und in deinem Konto
gespeichert.

## Das Dashboard {#dashboard}

Das **Dashboard** ist die Startseite eines Produkts. Es zeigt:

- **Kennzahlen**: **Mandanten**, **Benutzer**, **API-Schlüssel**, **Audit-Ereignisse (24 h)**,
  **Datensätze** und **Abgelehnte Anfragen (24 h)**. Jede Kennzahl verlinkt auf die passende Seite;
  ihr (i)-Tipp sagt genau, was gezählt wird. Meldet der Server keine Kennzahlen, siehst du „Der Server
  hat für dieses Produkt keine Kennzahlen gemeldet.“
- Karten zu **Nutzung und Abrechnung**, wenn diese Module aktiviert sind und du sie lesen darfst.
- **Systemzustand**: das Ergebnis der Bereitschaftsprüfung des Servers, mit **Details**.
- **Server**: **Serverversion**, **API-Version**, **Umgebung**, **Modus**, **Produkt-ID** und die
  **Module** mit ihrem Zustand (grün: aktiviert, grau: nicht aktiviert).

Schnellaktionen oben rechts: **Neuer Mandant** (mit `tenants:create`, Modul `tenancy`) und **Neuer
API-Schlüssel** (mit `api_keys:manage`).

| Kennzahl                       | Was gezählt wird                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Mandanten**                  | Alle Mandanten des Produkts, aktive und gesperrte.                                                              |
| **Benutzer**                   | Mandantenmitglieder und Produktverantwortliche, jede Person einmal.                                             |
| **API-Schlüssel**              | Nicht widerrufene Schlüssel, einschließlich abgelaufener.                                                       |
| **Datensätze**                 | Datensätze in allen Sammlungen und Mandanten.                                                                   |
| **Audit-Ereignisse (24 h)**    | Audit-Ereignisse dieses Produkts in den letzten 24 Stunden.                                                     |
| **Abgelehnte Anfragen (24 h)** | Abgelehnte Versuche in den letzten 24 Stunden; öffnet das Audit-Protokoll, gefiltert auf abgelehnte Ereignisse. |

> [!TIP]
> Die Karte **Server** beantwortet die häufigste Support-Frage: „Welche Version läuft, und ist das
> Modul überhaupt aktiviert?“

## Listen und Formulare {#lists-forms}

- **Listen** werden seitenweise geladen: Unter einer Tabelle holt **Mehr laden** die nächsten
  Einträge, und **Alle Einträge geladen** markiert das Ende. Seitenzahlen gibt es nicht.
- **Anlegedialoge** ergänzen die Adresse um `?new=1`, sodass der Dialog ein Neuladen übersteht und
  die Zurück-Taste des Browsers ihn schließt.
- **Kurznamen** (kurze, URL-taugliche Namen) werden aus dem Namen abgeleitet, bis du den Kurznamen
  selbst bearbeitest.
- **Änderungen speichern** wird erst aktiv, wenn sich etwas geändert hat.
- **Destruktive Aktionen** verlangen eine Bestätigung; beim Löschen eines Mandanten musst du seinen
  Kurznamen eintippen.
- **Geheimnisse** (API-Schlüssel, Einladungs-Token) werden einmal angezeigt. Ein Geheimnisdialog lässt
  sich nicht mit Escape oder durch Klicken außerhalb schließen; bestätige zuerst, dass du das
  Geheimnis gespeichert hast.

## Hilfe in Studio {#help-center}

Das **Hilfecenter** enthält alle Artikel, Tutorials und Referenzseiten. Öffne es über die
Seitenleiste (**Hilfecenter**), über den Hilfe-Button (?) in der oberen Leiste (**Hilfe und
Dokumentation**) oder über den Link auf der Anmelde- und der Einrichtungsseite; es funktioniert auch
ohne Anmeldung.

- **Suche**: Tippe in das Suchfeld („Hilfe durchsuchen, zum Beispiel „API-Schlüssel““). Studio
  durchsucht alle Artikel in deiner Sprache, und jeder Treffer öffnet den passenden Abschnitt.
- **Hier beginnen**: die Artikel für neue Benutzer.
- **Artikel** haben ein Inhaltsverzeichnis (**Auf dieser Seite**), **Zurück** und **Weiter**,
  **Verwandte Themen** und einen Button, mit dem du einen Link zum Artikel kopierst. Links
  funktionieren in jeder Sprache, und beim Wechsel der Sprache bleibt der Artikel geöffnet.

### Hilfe auf jeder Seite {#contextual-help}

- **Seitenhilfe**: Der (?)-Button neben einem Seitentitel (**Hilfe zu dieser Seite**) öffnet den
  Artikel zu dieser Seite in einem Seitenpanel. Du behältst deine Position, und ein Formular, das du
  gerade ausfüllst, bleibt unverändert. Links im Panel öffnen weitere Artikel (**Zurück** kehrt
  zurück), **Im Hilfecenter öffnen** zeigt den vollständigen Artikel, und **Hilfe schließen**
  schließt das Panel.
- **Infotipps**: Der (i)-Button neben einem Feld, einer Spalte oder einem Status erklärt Auswirkungen,
  Standardwerte und Grenzen. Er öffnet sich per Klick, Tippen, Enter oder Leertaste und schließt sich
  mit Escape. **Mehr erfahren** im Tipp öffnet den zugehörigen Artikel im Seitenpanel.
- Links **Mehr erfahren** in Meldungen, leeren Seiten und Bestätigungsdialogen führen zu dem
  Abschnitt, der die Situation erklärt.

## Tastaturgrundlagen {#keyboard}

Alles in Studio funktioniert mit der Tastatur:

| Taste                     | Wirkung                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Tab / Umschalt+Tab        | Nächstes / vorheriges Bedienelement. Der Fokus ist immer sichtbar.                                   |
| Tab direkt nach dem Laden | Erreicht **Zum Hauptinhalt springen**; Enter springt über die Navigation hinweg.                     |
| Enter / Leertaste         | Aktiviert Buttons, Links, Kontrollkästchen, Schalter und Infotipps.                                  |
| Pfeiltasten               | Bewegen sich in Menüs, Listen und zwischen Tabs.                                                     |
| Escape                    | Schließt ein Menü, einen Dialog, einen Infotipp oder die mobile Navigation (keine Geheimnisdialoge). |
| F8                        | Springt zum Benachrichtigungsbereich (Kurzmeldungen).                                                |

Wenn du eine andere Seite öffnest, wandert der Fokus zu ihrem Titel, sodass Screenreader die neue
Seite ansagen. Mehr unter [Tastatur und Barrierefreiheit](help:keyboard-accessibility).

## Fehlerbehebung {#troubleshooting}

| Situation                                                     | Ursache und Lösung                                                                                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Die Seitenleiste zeigt nur wenige Einträge                    | Es ist kein Produkt ausgewählt. Wähle eines mit dem Produktwechsler oder unter **Produkte**.                                                                     |
| Ein Eintrag zeigt **Aus**                                     | Das Servermodul ist nicht aktiviert. Wende dich an den Betreiber; siehe [Module](help:concepts#modules).                                                         |
| Eine Seite meldet **Nicht erlaubt**                           | Deine Rollen enthalten die Berechtigung nicht. Siehe [Rollen und Berechtigungen](help:roles-permissions).                                                        |
| **Im Studio noch nicht verfügbar**                            | Der Server hat das Modul, aber dieses Studio-Release hat keine Seiten dafür. Verwende die API oder ein neueres Studio.                                           |
| Der Produktwechsler listet ein Produkt nicht                  | Das Produkt ist archiviert, oder du hast darin keine Rolle. Öffne **Produkte**.                                                                                  |
| Sprache oder Darstellung unterscheiden sich zwischen Browsern | Eine in einem Browser getroffene Wahl wird dort gespeichert und hat Vorrang vor der in deinem Konto gespeicherten. Wähle im Benutzermenü dieses Browsers erneut. |
| Nach einem Server-Update verhält sich Studio seltsam          | Lade die Seite neu; Studio prüft die Serverversion nur beim Laden.                                                                                               |
