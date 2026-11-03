---
title: Bekannte Einschränkungen
summary: Was Studio und der Axentra-Server noch nicht können oder nur mit bekannter Einschränkung, und wie du das umgehst.
keywords: Einschränkungen, Grenzen, bekannte Probleme, nicht unterstützt, fehlende Funktion, Beschränkungen, Workaround, Umgehung, Roadmap, nicht möglich
---

Diese Seite listet die Einschränkungen, die dir bei der Arbeit mit dieser Version von Studio und
dem Axentra-Server auffallen können, jeweils mit einer Umgehung, sofern es eine gibt. Manche
stammen von Studio, andere vom Server; die API des Servers bietet manchmal mehr als Studio.

## Benutzer und Anmeldung {#users-sign-in}

- **In Studio werden keine Konten angelegt.** Konten entstehen bei der Ersteinrichtung, beim
  Annehmen einer Einladung oder bei der ersten Anmeldung per Single Sign-on. Lade Personen
  stattdessen in einen Mandanten ein.
- **Keine Einladungen für Produktverantwortliche.** Ein Produktmitglied kannst du nur hinzufügen,
  wenn es bereits ein Konto hat, das du sehen kannst. Umgehung: Lade die Person zuerst in einen der
  Mandanten des Produkts ein oder bitte einen Plattform-Administrator, sie hinzuzufügen.
- **Kein Zurücksetzen des Passworts, keine E-Mail-Bestätigung und keine
  Zwei-Faktor-Authentifizierung** in Axentra selbst. Verwendest du Single Sign-on, kann dein
  Identitätsanbieter die Zwei-Faktor-Authentifizierung erzwingen.
- **Single-Sign-on-Anbieter werden nur in der Serverkonfiguration eingerichtet.** Studio kann
  Identitätsanbieter weder auflisten noch hinzufügen oder deaktivieren.
- **Konten ohne E-Mail-Adresse** (bei manchen Single-Sign-on-Konfigurationen möglich) lassen sich
  in Studio weder anlegen noch verknüpfen.
- **Kein Export und keine Löschung der Daten einer Person.** Datenschutzanfragen muss der Betreiber
  über Benutzer, Datensätze, Sicherungen und Protokolle hinweg bearbeiten.
- **Die Drosselung der Anmeldung gilt pro Minute.** Wer eine E-Mail-Adresse kennt, kann durch
  falsche Passwörter die Passwortanmeldung für dieses Konto bis zu einer Minute lang blockieren;
  bereits offene Sitzungen und Single Sign-on sind nicht betroffen.

## Rollen, Berechtigungen und API-Schlüssel {#access}

- **Studio kann nur dann anzeigen, welche Rollen du vergeben darfst, wenn du Rollen lesen kannst**
  (`roles:read`). Ohne diese Berechtigung ist das Rollenfeld ein einfaches Textfeld, und der Server
  erklärt eine Ablehnung. Eine Rollenänderung, die erfolgt, während eine Seite offen ist, wird erst
  bemerkt, wenn Studio deine Berechtigungen das nächste Mal neu lädt oder du die Seite neu lädst.
- **Eigene Berechtigungen eines Produkts lassen sich in Studio nicht deklarieren.** Die Seite
  **Berechtigungen** ist schreibgeschützt; Produkte deklarieren sie im Code oder über die API.
- **Beim Speichern einer eigenen Rolle fallen stillgelegte Produktberechtigungen weg**, die noch
  darin aufgeführt sind. Solange sie stillgelegt waren, hatten sie keine Wirkung, wären aber
  zurückgekehrt, wenn das Produkt sie erneut deklariert hätte.
- **API-Schlüssel, die eine Person angelegt hat, werden nicht widerrufen, wenn diese Person geht.**
  Prüfe und widerrufe sie selbst.
- **Die Bestätigung beim Widerrufen listet abgeleitete Schlüssel nicht auf.** Das Widerrufen eines
  Schlüssels widerruft auch jeden Schlüssel, der mit ihm angelegt wurde, aber Studio zeigt nicht,
  welche das sind.

## Daten und Dateien {#data-files}

- **Keine Gesamtzahlen.** Listen zeigen „N Einträge angezeigt“ und laden auf Wunsch weitere; die
  API hat bewusst keine Seitennummern oder Gesamtzahlen.
- **Datensätze:** Filter nur auf JSON-Werte der obersten Ebene, Sortierung nur nach ID,
  Erstellungs- oder Änderungszeit. Speichern ersetzt das gesamte JSON-Objekt eines Datensatzes.
  Ein Datensatz umfasst höchstens 256 KiB.
- **Die Volltextsuche** ([Suche](help:search)) durchsucht immer einen Mandanten und findet nur ganze
  Wörter (keine Präfix- oder unscharfe Suche). Studio legt keine Dokumente im Index an; das macht dein Produkt.
- **Sicherungen und Dateispeicher:** Studio zeigt keinen Sicherungsstatus, und das
  Sicherungsverfahren des Servers umfasst die Datenbank; der Dateispeicher muss separat gesichert
  werden.

## Jobs, Ereignisse und Webhooks {#events}

- **Job einreihen wird nur mit `jobs:manage` angeboten.** Manche Jobarten dürfen auch
  Mandantenbenutzer einreihen, aber die API sagt nicht, welche; Studio bietet sie daher nicht an.
- **Die Live-Ansicht der Ereignisse fragt regelmäßig ab.** Neue Ereignisse erscheinen mit kurzer
  Verzögerung, nicht sofort; WebSockets gibt es nicht.
- **Die nächste Ausführung eines Zeitplans berechnet der Server beim Speichern**; Studio prüft die
  Cron-Syntax während der Eingabe, zeigt aber keine Vorschau der nächsten Ausführung eines nicht
  gespeicherten Ausdrucks. Zeitpläne laufen in UTC.

## Nutzung und Abrechnung {#usage-billing}

- **Reservierungen lassen sich nur über ihre ID nachschlagen.** Die API hat keine Liste der
  Reservierungen.
- **Keine Karten- oder Bankdaten in Studio**, und das ist Absicht. Kostenpflichtige Tarife laufen
  über den gehosteten Checkout des Zahlungsanbieters.
- **Die Zahlungsanbieter wurden in dieser Version nicht gegen Live-Dienste getestet**, sondern nur
  gegen simulierte Anbieter.

## Benachrichtigungen {#notifications}

- **Nur E-Mail.** SMS- oder Push-Kanäle gibt es nicht.
- **Noch keine Versandbegrenzung pro Mandant** für Benachrichtigungen.

## Studio und der Server {#studio-server}

- **Die Serverversion wird nur beim Laden von Studio geprüft.** Lade die Seite nach einem
  Server-Update neu. Auch die Liste der aktivierten Module wird nur beim Laden gelesen.
- **Getrennte Adressen für Studio und API** funktionieren nur, wenn beide zur selben Site gehören
  (zum Beispiel `studio.example.com` und `api.example.com`). Der empfohlene und getestete Aufbau
  liefert beide unter derselben Adresse aus.
- **Einzelproduktserver mit übrig gebliebenen Produkten:** Enthält ein Server im
  Einzelproduktbetrieb noch weitere Produkte, blendet Studio den Produktwechsler aus.
  Plattform-Administratoren erreichen die anderen Produkte nur über die Seite **Produkte** und
  können sie dort nicht archivieren.
- **Servereinstellungen lassen sich in Studio nicht ändern.** Die Seite **Einstellungen** zeigt nur
  die wirksame Konfiguration; Änderungen erfolgen auf dem Server.
- **Die allgemeine Ratenbegrenzung für Anfragen ist standardmäßig aus** und wird pro
  Serverprozess gezählt.

## Browser, Sprachen und Barrierefreiheit {#browsers-languages}

- **Automatisch getestet werden nur Chromium-basierte Browser.** Firefox und Safari sollten
  funktionieren, sind aber von den automatischen Tests nicht abgedeckt.
- **Servertexte sind englisch**: Rollen- und Berechtigungsbeschreibungen und die **Servermeldung**
  in den Fehlerdetails werden nicht übersetzt.
- **Barrierefreiheitsprüfungen erfassen die erste Ansicht jeder Seite**; geöffnete Dialoge, Menüs
  und Formularfehler werden nur in manchen Bereichen geprüft. Siehe
  [Tastatur und Barrierefreiheit](help:keyboard-accessibility#known-gaps).

## Betrieb {#operations}

- **Für diese Version gab es weder einen Produktivbetrieb noch Lasttests**; Kapazitätszahlen gibt
  es noch nicht.
- **Datenbankmigrationen gehen nur vorwärts.** Zurück zu einer früheren Version heißt, eine
  Sicherung wiederherzustellen.

## Verwandte Seiten {#related}

- [Fehlerbehebung](help:troubleshooting) für Fehlermeldungen und Lösungen.
- [Häufige Fragen](help:faq) für häufige Fragen.
- [Modulreferenz](help:modules-reference) dafür, was ein ausgeschaltetes Modul bedeutet.
