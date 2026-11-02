---
title: Tastatur und Barrierefreiheit
summary: So verwendest du Studio mit Tastatur, Screenreader, Zoom, reduzierter Bewegung und heller oder dunkler Darstellung, und welche Lücken bekannt sind.
keywords: Barrierefreiheit, Accessibility, a11y, Tastatur, Tastenkürzel, Tastenkombinationen, Tab, Fokus, Screenreader, Bildschirmleser, NVDA, JAWS, VoiceOver, Zoom, Vergrößerung, Kontrast, Dunkelmodus, heller Modus, Darstellung, reduzierte Bewegung, WCAG, BITV
---

Studio ist darauf ausgelegt, WCAG 2.1 Stufe AA zu erfüllen. Jede Funktion lässt sich mit der
Tastatur bedienen, Screenreader geben die Seitenstruktur korrekt wieder, und Studio folgt deinen
Systemeinstellungen für Farbschema und Bewegung. Jedes Release wird automatisch mit der
Barrierefreiheits-Engine axe-core geprüft, auf jeder Seite, in heller und dunkler Darstellung, auf
einem Desktop-Bildschirm und auf einem 360 Pixel breiten Smartphone-Bildschirm.

## Bedienung mit der Tastatur {#keyboard}

| Taste                                       | Was sie bewirkt                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Tab** / **Umschalt+Tab**                  | Zum nächsten oder vorherigen Bedienelement wechseln.                                                   |
| **Tab** direkt nach dem Laden einer Seite   | Erreicht zuerst **Zum Hauptinhalt springen**; **Eingabe** springt an der Navigation vorbei.            |
| **Eingabe**                                 | Einem Link folgen, eine Schaltfläche drücken, ein Formular absenden.                                   |
| **Leertaste**                               | Eine Schaltfläche drücken, ein Kontrollkästchen ankreuzen, einen Schalter umlegen.                     |
| **Pfeiltasten**                             | Sich in Menüs, Auswahllisten und Tabs bewegen; **Eingabe** oder **Leertaste** wählt aus.               |
| **Esc**                                     | Einen Dialog, eine ausklappbare Leiste, ein Menü, einen Infotipp oder die mobile Navigation schließen. |
| **F8**                                      | Zum Benachrichtigungsbereich springen (die Meldungen in der Bildschirmecke).                           |
| **Eingabe** in einem Feld **Ereignistypen** | Fügt den eingegebenen Ereignistyp zur Liste hinzu.                                                     |

Gut zu wissen:

- **Dialoge halten den Fokus in sich**, solange sie geöffnet sind, und geben ihn beim Schließen an
  die Schaltfläche zurück, die sie geöffnet hat.
- **Dialoge mit einmal angezeigten Geheimnissen schließen sich nicht mit Esc.** Geheimnisse von
  API-Schlüsseln und Webhooks werden nur einmal angezeigt; der Dialog bleibt daher offen, bis du
  **Ich habe das Geheimnis sicher gespeichert** bestätigst. So geht kein Geheimnis versehentlich
  verloren.
- **Gefährliche Aktionen** fragen nach einer Bestätigung; manche, etwa das Widerrufen eines
  API-Schlüssels, verlangen zusätzlich die Eingabe eines Namens (**Zur Bestätigung … eingeben**).
  Das schützt vor versehentlichen Tastendrücken.
- **Infotipps** (die kleinen (i)-Schaltflächen neben Beschriftungen) öffnen sich mit **Eingabe**
  oder **Leertaste** und schließen sich mit **Esc**. Infotipps funktionieren mit Tastatur, Touch und
  Screenreader, nicht nur beim Überfahren mit der Maus.
- **Tabellen** mit vielen Spalten scrollen in einem eigenen, beschrifteten Bereich. Fokussiere den
  Bereich mit **Tab** und scrolle ihn mit den Pfeiltasten.

## Fokus {#focus}

Das Bedienelement mit dem Tastaturfokus zeigt immer einen sichtbaren Rahmen (violett, mit
mindestens 3:1 Kontrast zum Hintergrund). Nachdem du eine andere Seite geöffnet hast, setzt Studio
den Fokus auf die Hauptüberschrift der Seite; du beginnst also beim neuen Inhalt, und Screenreader
kündigen die neue Seite an.

## Screenreader {#screen-readers}

- **Landmarks:** Jede Seite hat eine Kopfzeile, die Hauptnavigation und den Hauptinhalt sowie
  genau eine Hauptüberschrift.
- **Brotkrümelnavigation** und **Hauptnavigation** sind beschriftet. Bereiche ausgeschalteter
  Module in der Seitenleiste werden als „Modul nicht aktiviert“ angesagt.
- **Formulare:** Jedes Feld hat eine sichtbare Beschriftung; Pflichtfelder werden angesagt;
  Fehlermeldungen sind mit ihrem Feld verknüpft.
- **Tabellen** haben Beschriftungen und Spaltenüberschriften, und sortierbare Spalten sagen ihre
  Sortierrichtung an. Die Anzahl „N Einträge angezeigt“ wird angesagt, wenn weitere Zeilen laden.
- **Statusmeldungen** (in die Zwischenablage kopiert, wird geladen, Benachrichtigungen) werden
  über Live-Regionen angesagt. Fehlermeldungen werden sofort angesagt.
- **Diagramme** haben eine Textzusammenfassung, und **Datentabelle anzeigen** zeigt dieselben Werte
  als Tabelle.
- **E-Mail-Vorschauen** werden in einem abgeschotteten Rahmen angezeigt; ihr Textinhalt ist wie
  gewohnt lesbar.

## Zoom und Textgröße {#zoom}

Du kannst den Browser auf 200 % vergrößern, ohne Inhalte oder Funktionen zu verlieren. In schmalen
Fenstern (und bei Vergrößerung) passt sich das Layout an:

| Fensterbreite   | Layout                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------- |
| ab 1200 px      | Volle Seitenleiste, mehrspaltige Seiten                                                        |
| 960 bis 1199 px | Volle oder eingeklappte Seitenleiste                                                           |
| unter 960 px    | Die Seitenleiste wird zu einer ausklappbaren Leiste, die sich mit **Navigation öffnen** öffnet |
| unter 640 px    | Weniger wichtige Tabellenspalten werden ausgeblendet, Seitenaktionen rutschen unter den Titel  |

Normale Schaltflächen sind mindestens 36 Pixel hoch, große 44 Pixel; manche kompakte Schaltflächen
in Tabellen und Werkzeugleisten sind kleiner. Am Desktop kannst du die Seitenleiste mit
**Seitenleiste einklappen** auf Symbole reduzieren; Studio merkt sich das pro Browser.

## Reduzierte Bewegung {#reduced-motion}

Bittet dein Betriebssystem Apps, Bewegung zu reduzieren, schaltet Studio seine Animationen und
Übergänge aus (zum Beispiel bei Dialogen, Menüs und Ladeanzeigen).

## Helle, dunkle und System-Darstellung {#themes}

Öffne das Benutzermenü (dein Name in der oberen Leiste) und wähle **Darstellung**: **Hell**,
**Dunkel** oder **System** (folgt deinem Betriebssystem). Beide Darstellungen sind auf
ausreichenden Kontrast geprüft. Deine Wahl wird im Browser und in deinem Profil gespeichert; ein
Browser, in dem du noch keine Darstellung gewählt hast, übernimmt nach der Anmeldung die aus
deinem Profil.

## Sprache {#language}

Wähle die Sprache im Benutzermenü unter **Sprache** oder auf der Anmeldeseite. Bist du angemeldet,
wird die Wahl in deinem Profil gespeichert. Datum, Uhrzeit und Zahlen folgen der gewählten Sprache.
Manche Texte kommen vom Server und bleiben auf Englisch, zum Beispiel die Beschreibungen der
integrierten Rollen und Berechtigungen und die **Servermeldung** in den Fehlerdetails.

## Bekannte Lücken {#known-gaps}

- **Automatische Prüfungen erfassen die erste Ansicht jeder Seite.** Geöffnete Dialoge, Menüs,
  ausklappbare Leisten, Benachrichtigungen und Formularfehler werden nur in manchen Bereichen
  geprüft.
- **Automatisch getestet wird nur Chromium.** Firefox und Safari (WebKit) sind von den
  automatischen Tests nicht abgedeckt.
- **Der Hochkontrastmodus von Windows** (erzwungene Farben) wird nicht gezielt getestet.
- **Diagramme sind auf Zeigegeräte ausgerichtet.** Beim Überfahren erscheinen Details zu einzelnen
  Punkten; Tastatur- und Screenreader-Nutzer erhalten dieselben Werte über **Datentabelle
  anzeigen**.
- **Servertexte** wie Berechtigungsbeschreibungen und Servermeldungen gibt es nur auf Englisch.

Findest du eine Barriere, melde sie deinem Betreiber mit der Seitenadresse und den Schritten, die
dazu geführt haben.

## Fehlerbehebung {#troubleshooting}

| Situation                                          | Was du tun kannst                                                                                                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Der Fokusrahmen ist nicht sichtbar                 | Verwende **Tab** (der Rahmen erscheint beim Tastaturfokus, nicht bei Mausklicks). Prüfe, ob eine Browser-Erweiterung die Seitenstile überschreibt.                                                 |
| Ein Dialog schließt sich nicht mit Esc             | Er zeigt ein einmal angezeigtes Geheimnis. Kopiere und speichere es und bestätige dann **Ich habe das Geheimnis sicher gespeichert**.                                                              |
| Animationen laufen weiterhin                       | Schalte „Bewegung reduzieren“ in den Bedienungshilfen deines Betriebssystems ein und lade Studio neu.                                                                                              |
| Die Darstellung springt zurück                     | Der Browser-Speicher ist möglicherweise blockiert (zum Beispiel im privaten Modus), sodass die Wahl lokal nicht gespeichert wird; Studio greift dann auf die Darstellung aus deinem Profil zurück. |
| Inhalt wird bei starker Vergrößerung abgeschnitten | Breite Tabellen scrollen in ihrem eigenen Bereich; fokussiere ihn mit **Tab** und verwende die Pfeiltasten.                                                                                        |
