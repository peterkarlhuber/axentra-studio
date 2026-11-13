# QA-Checkliste Axentra Studio (Testversion)

Die gültigen Anmeldedaten der Testbenutzer stehen auf http://127.0.0.1:8765/qa/ (Tab „Start“). Alle Testbenutzer haben dasselbe Passwort. Wenn nichts anderes steht, arbeitest du im Produkt „Beispiel-CRM (Test)“ (Auswahl oben rechts). Alle Personen-, Firmen- und Produktnamen enden mit „(Test)“.

80 Testfälle. Jeder dauert etwa 1 bis 3 Minuten.
Empfohlen ist die Checkliste auf http://127.0.0.1:8765/qa/ (Tab „QA-Checkliste“).
Diese Datei ist zum Lesen oder Ausdrucken.

Name: ______________________   Datum: ____________   Computer/Browser: ______________________

## Inhalt

- A Erster Start und Orientierung (5)
- B Anmeldung und Abmeldung (8)
- C Benutzerverwaltung (4)
- D Produkte (3)
- E Mandanten (4)
- F Rollen und Berechtigungen (8)
- G API-Schlüssel (3)
- H Daten, Datensätze und Suche (5)
- I Dateien (5)
- J Jobs und Zeitpläne (3)
- K Ereignisse und Webhooks (4)
- L Nutzung und Kontingente (3)
- M Tarife und Abonnements (Zahlungen sind simuliert) (5)
- N Benachrichtigungen, Vorlagen und Postfach (4)
- O Audit-Protokoll (1)
- P Einstellungen, Profil, Sprache und Darstellung (3)
- Q Fehlerbehandlung und Datenspeicherung (4)
- R Handy-Ansicht, Tastatur und Barrierefreiheit (2)
- S Hilfecenter und Systemzustand (3)
- T API-Prüfung (optional) (3)

## A Erster Start und Orientierung

*Hier prüfst du, ob alles startet und ob du dich zurechtfindest.*

### A-01 Studio startet und öffnet sich im Browser

**Benutzer:** keiner  
**Bereich:** Start

**Schritte:**

1. Doppelklick auf „2 - Starten“.
2. Warten, bis sich der Browser öffnet.

**Was sollte passieren:** Ein schwarzes Fenster bleibt offen. Der Browser zeigt http://127.0.0.1:8765/ mit der Seite „Anmelden“.

**Woran erkenne ich einen Fehler:** Kein Browser geht auf, auch nach mehreren Minuten nicht. Oder das schwarze Fenster zeigt einen Fehler und schließt sich.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### A-02 Kit-Seite /qa/ mit allen Tabs

**Benutzer:** keiner  
**Bereich:** Start

**Schritte:**

1. Im Browser http://127.0.0.1:8765/qa/ öffnen.
2. Tab „Start“: die Liste der Testbenutzer ansehen.
3. Tabs „QA-Checkliste“, „E-Mails“, „Integrationen“ und „Version“ kurz anklicken.

**Was sollte passieren:** „Start“ zeigt Testbenutzer mit E-Mail-Adresse und Passwort. „QA-Checkliste“ zeigt diese Testfälle zum Abhaken. „Integrationen“ zeigt je Anbindung einen Status („Echt, lokal“, „Simuliert“ oder „Nicht konfiguriert“). Jeder Tab hat Inhalt.

**Woran erkenne ich einen Fehler:** Seite fehlt, ist leer, oder Testbenutzer fehlen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### A-03 Dashboard nach der ersten Anmeldung

**Benutzer:** Alex Admin (Test)  
**Bereich:** Orientierung

**Schritte:**

1. Auf http://127.0.0.1:8765/ als Alex Admin anmelden.
2. Oben rechts das Produkt „Beispiel-CRM (Test)“ wählen, falls nicht schon gewählt.
3. Links „Dashboard“ öffnen.

**Was sollte passieren:** Das Dashboard zeigt Zahlen, z. B. „Mandanten“, „Benutzer“, „API-Schlüssel“, „Datensätze“. Die Zahlen sind nicht alle 0. Unten oder daneben steht der „Systemzustand“.

**Woran erkenne ich einen Fehler:** Fehlermeldung, leere Seite, oder alle Zahlen sind 0 (dann fehlen die Testdaten).

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### A-04 Seitenleiste: alle Bereiche erreichbar

**Benutzer:** Alex Admin (Test)  
**Bereich:** Orientierung

**Schritte:**

1. Links in der Seitenleiste nacheinander jeden Eintrag anklicken: Mandanten, Benutzer, Einladungen, Rollen, Berechtigungen, API-Schlüssel, Datenübersicht, Datensätze, Dateien, Suche, Jobs, Zeitpläne, Ereignisse, Webhooks, Nutzung, Tarife, Abonnements, Benachrichtigungen, Posteingang, Audit-Protokoll, Systemzustand, Monitoring, Einstellungen.
2. Bei jeder Seite kurz prüfen, ob Inhalt erscheint.

**Was sollte passieren:** Jede Seite lädt und hat eine Überschrift. Einträge mit dem Kennzeichen „Aus“ zeigen „Modul auf diesem Server nicht aktiviert“ – das ist kein Fehler, aber notier, welche es sind.

**Woran erkenne ich einen Fehler:** Eine Seite zeigt „Etwas ist schiefgelaufen“, bleibt dauerhaft bei „Wird geladen …“ oder ist leer ohne Erklärung.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### A-05 Produkt wechseln

**Benutzer:** Alex Admin (Test)  
**Bereich:** Orientierung

**Schritte:**

1. Seite „Mandanten“ öffnen.
2. Oben rechts die Produktauswahl öffnen und „Beispiel-Shop (Test)“ wählen.

**Was sollte passieren:** Du bleibst auf „Mandanten“, siehst jetzt aber die Mandanten des Beispiel-Shops: „Musterladen OHG (Test)“ und „Beispiel Boutique (Test)“.

**Woran erkenne ich einen Fehler:** Es erscheinen weiter die Mandanten des Beispiel-CRM, oder Studio springt auf eine andere Seite.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## B Anmeldung und Abmeldung

### B-01 Anmelden mit richtigem Passwort

**Benutzer:** Ole Operator (Test)  
**Bereich:** Anmeldung

**Schritte:**

1. Auf der Seite „Anmelden“ E-Mail-Adresse und Passwort von Ole Operator (Test) eingeben.
2. Auf „Anmelden“ klicken.

**Was sollte passieren:** Du bist angemeldet. Oben rechts steht der Name „Ole Operator (Test)“.

**Woran erkenne ich einen Fehler:** Fehlermeldung trotz richtiger Daten, oder ein falscher Name oben rechts.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### B-02 Falsches Passwort

**Benutzer:** Ole Operator (Test)  
**Bereich:** Anmeldung

**Schritte:**

1. Abmelden.
2. Richtige E-Mail-Adresse, aber Passwort „falsch123“ eingeben.
3. Auf „Anmelden“ klicken.

**Was sollte passieren:** Meldung „Anmeldung fehlgeschlagen“ mit „E-Mail-Adresse oder Passwort ist falsch.“ Du bleibst auf der Anmeldeseite. Das Passwort wird nirgends angezeigt.

**Woran erkenne ich einen Fehler:** Du wirst trotzdem angemeldet, oder die Meldung verrät, ob es das Konto gibt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### B-03 Deaktiviertes Konto

**Benutzer:** Tobias Test (Test)  
**Bereich:** Anmeldung

**Schritte:**

1. Mit den Daten von Tobias Test (Test) anmelden.

**Was sollte passieren:** Meldung „Anmeldung fehlgeschlagen“ mit „E-Mail-Adresse oder Passwort ist falsch.“ Du bleibst auf der Anmeldeseite.

**Woran erkenne ich einen Fehler:** Tobias wird angemeldet, obwohl sein Konto deaktiviert ist.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### B-04 Abmelden

**Benutzer:** Ole Operator (Test)  
**Bereich:** Anmeldung

**Schritte:**

1. Anmelden.
2. Oben rechts auf den Namen klicken (Benutzermenü).
3. „Abmelden“ wählen.
4. Im Browser auf „Zurück“ klicken.

**Was sollte passieren:** Nach dem Abmelden erscheint die Seite „Anmelden“. Auch mit „Zurück“ siehst du keine Daten mehr, sondern wieder die Anmeldung.

**Woran erkenne ich einen Fehler:** Nach „Zurück“ sind Daten wieder sichtbar und bedienbar.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### B-05 Sitzung bleibt nach Neuladen bestehen

**Benutzer:** Ole Operator (Test)  
**Bereich:** Anmeldung

**Schritte:**

1. Anmelden und „Mandanten“ öffnen.
2. Seite neu laden (F5, Mac: Cmd+R).
3. Browser-Tab schließen, neuen Tab mit http://127.0.0.1:8765/ öffnen.

**Was sollte passieren:** Du bleibst angemeldet und landest wieder auf einer Studio-Seite, ohne neu anmelden zu müssen.

**Woran erkenne ich einen Fehler:** Nach dem Neuladen musst du dich neu anmelden.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### B-06 Sitzung von außen beenden

**Benutzer:** Ole Operator (Test)  
**Bereich:** Anmeldung

**Schritte:**

1. Im normalen Fenster als Ole Operator (Test) anmelden.
2. Ein privates Browserfenster öffnen und dort auch als Ole Operator (Test) anmelden.
3. Im privaten Fenster: Benutzermenü > „Profil“ > „Deine Sitzungen“ > „Alle anderen Sitzungen abmelden“ und bestätigen.
4. Im normalen Fenster eine andere Seite anklicken.

**Was sollte passieren:** Das normale Fenster wird zur Seite „Anmelden“ geschickt. Das private Fenster bleibt angemeldet.

**Woran erkenne ich einen Fehler:** Das normale Fenster arbeitet weiter, als wäre nichts passiert.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### B-07 Passwort vergessen – E-Mail kommt im Mail-Fänger an

**Benutzer:** keiner (E-Mail-Adresse von Lena Demo (Test))  
**Bereich:** Anmeldung

**Schritte:**

1. Abmelden. Auf der Anmeldeseite „Passwort vergessen?“ klicken.
2. Die E-Mail-Adresse von Lena Demo (Test) eingeben, „Link zum Zurücksetzen senden“ klicken.
3. http://127.0.0.1:8765/qa/ öffnen, Tab „E-Mails“.

**Was sollte passieren:** Studio zeigt „Sieh in deinem Postfach nach“. Auf /qa/ erscheint nach kurzer Zeit eine Mail an Lena mit einem Link. Der Link öffnet „Neues Passwort wählen“ (du musst es nicht wirklich ändern).

**Woran erkenne ich einen Fehler:** Keine Mail nach 2 Minuten, oder der Link führt zu einer Fehlerseite.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### B-08 Benutzer nur mit Single Sign-on

**Benutzer:** SSO Nutzer (Test)  
**Bereich:** Anmeldung

**Schritte:**

1. Mit sso.nutzer@example.com und dem gemeinsamen Passwort anmelden.
2. Als Alex Admin (Test) unter „Benutzer“ den SSO Nutzer (Test) öffnen.

**Was sollte passieren:** Die Anmeldung scheitert („Anmeldung fehlgeschlagen“) – das ist richtig, im Kit gibt es keinen SSO-Anbieter. In der Benutzerdetailseite steht „Kein Passwort (nur Single Sign-on)“ und unter „Single-Sign-on-Identitäten“ eine Identität.

**Woran erkenne ich einen Fehler:** Die Anmeldung klappt, oder die Identität fehlt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## C Benutzerverwaltung

### C-01 Benutzer suchen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Benutzer

**Schritte:**

1. Links „Benutzer“ öffnen.
2. Ins Suchfeld „Maria“ tippen.

**Was sollte passieren:** Die Liste zeigt nur noch Maria Muster (Test). Wenn du die Suche löschst, sind wieder alle da.

**Woran erkenne ich einen Fehler:** Suche findet nichts oder zeigt nicht passende Einträge.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### C-02 Benutzerdetails ansehen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Benutzer

**Schritte:**

1. In „Benutzer“ auf Lena Demo (Test) klicken.

**Was sollte passieren:** Die Detailseite zeigt Profil, „Mitgliedschaften“ (Mandanten „Muster GmbH (Test)“ und „Demo Handwerk KG (Test)“ mit Rolle) und „Aktive Sitzungen“.

**Woran erkenne ich einen Fehler:** Mitgliedschaften fehlen oder sind falsch.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### C-03 Benutzer deaktivieren und wieder aktivieren

**Benutzer:** Alex Admin (Test)  
**Bereich:** Benutzer

**Schritte:**

1. Benutzer Jonas Beispiel (Test) öffnen.
2. „Benutzer deaktivieren“ klicken und bestätigen.
3. In einem privaten Fenster als Jonas anmelden.
4. Zurück im Admin-Fenster: „Benutzer aktivieren“ klicken.
5. Im privaten Fenster nochmal als Jonas anmelden.

**Was sollte passieren:** Nach dem Deaktivieren steht der Hinweis „Dieser Benutzer ist deaktiviert und kann sich nicht anmelden.“ und die Anmeldung als Jonas scheitert mit „Anmeldung fehlgeschlagen“. Nach dem Aktivieren klappt sie wieder.

**Woran erkenne ich einen Fehler:** Jonas kann sich trotz Deaktivierung anmelden, oder nach Aktivierung nicht mehr.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### C-04 Einladung erstellen und widerrufen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Benutzer

**Schritte:**

1. Links „Einladungen“ öffnen, Mandant „Muster GmbH (Test)“ wählen.
2. „Mitglied einladen“ klicken, E-Mail „peter.test@example.com“, Rolle wählen, „Einladung senden“.
3. Das Fenster mit dem Einladungslink schließen.
4. Bei der neuen Einladung „Einladung widerrufen“ wählen und bestätigen.

**Was sollte passieren:** Erst erscheint „Einladung erstellt“ mit Einladungslink („Wird nur einmal angezeigt“). Die Einladung steht danach in der Liste. Nach dem Widerrufen hat sie den Status „Widerrufen“ oder verschwindet aus der Liste der offenen. Die Einladungs-Mail an peter.test@example.com erscheint auf /qa/ im Tab „E-Mails“.

**Woran erkenne ich einen Fehler:** Einladung erscheint nicht in der Liste, oder Widerrufen ändert nichts.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## D Produkte

### D-01 Produktliste

**Benutzer:** Alex Admin (Test)  
**Bereich:** Produkte

**Schritte:**

1. Links „Produkte“ öffnen.

**Was sollte passieren:** Die Liste zeigt „Beispiel-CRM (Test)“, „Beispiel-Shop (Test)“ und „Altes Testprodukt (Test)“ mit Status „Archiviert“.

**Woran erkenne ich einen Fehler:** Produkte fehlen oder Status stimmt nicht.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### D-02 Neues Produkt anlegen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Produkte

**Schritte:**

1. In „Produkte“ auf „Neues Produkt“ klicken.
2. Name „QA Testprodukt“ eingeben. Den Kurznamen nicht ändern.
3. „Produkt anlegen“ klicken.

**Was sollte passieren:** Meldung „Produkt „QA Testprodukt“ angelegt“. Der Kurzname wurde automatisch aus dem Namen gebildet (z. B. „qa-testprodukt“). Das Produkt steht in der Liste.

**Woran erkenne ich einen Fehler:** Fehlermeldung oder Produkt fehlt danach in der Liste.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### D-03 Archiviertes Produkt wiederherstellen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Produkte

**Schritte:**

1. „Altes Testprodukt (Test)“ öffnen.
2. „Wiederherstellen“ klicken und bestätigen.
3. Danach „Archivieren“ klicken und bestätigen, damit alles wieder wie vorher ist.

**Was sollte passieren:** Erst „Produkt wiederhergestellt“, Status „Aktiv“. Nach dem Archivieren „Produkt archiviert“, Status „Archiviert“.

**Woran erkenne ich einen Fehler:** Status ändert sich nicht oder Fehlermeldung.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## E Mandanten

### E-01 Mandantenliste und Filter

**Benutzer:** Alex Admin (Test)  
**Bereich:** Mandanten

**Schritte:**

1. Links „Mandanten“ öffnen.
2. Im Statusfilter „Gesperrt“ wählen.

**Was sollte passieren:** Ohne Filter: Muster GmbH (Test), Beispiel AG (Test), Demo Handwerk KG (Test), Musterstadt e.V. (Test), Probe & Partner (Test), Grenzfall Datenhungrig GmbH (Test). Mit Filter „Gesperrt“ nur Musterstadt e.V. (Test).

**Woran erkenne ich einen Fehler:** Mandanten fehlen oder der Filter wirkt nicht.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### E-02 Mandant anlegen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Mandanten

**Schritte:**

1. „Neuer Mandant“ klicken.
2. Name „Peter QA GmbH“ eingeben.
3. „Mandant anlegen“ klicken.

**Was sollte passieren:** Meldung „Mandant „Peter QA GmbH“ angelegt“. Er steht in der Liste mit Status „Aktiv“.

**Woran erkenne ich einen Fehler:** Fehlermeldung oder er fehlt in der Liste.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### E-03 Mandant sperren und reaktivieren

**Benutzer:** Alex Admin (Test)  
**Bereich:** Mandanten

**Schritte:**

1. „Peter QA GmbH“ öffnen.
2. „Mandant sperren“ klicken und bestätigen.
3. Dann „Mandant reaktivieren“ klicken und bestätigen.

**Was sollte passieren:** Nach dem Sperren erscheint oben „Dieser Mandant ist gesperrt“. Nach dem Reaktivieren ist der Hinweis weg und der Status „Aktiv“.

**Woran erkenne ich einen Fehler:** Hinweis bleibt oder Status ändert sich nicht.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### E-04 Mitglieder eines Mandanten

**Benutzer:** Alex Admin (Test)  
**Bereich:** Mandanten

**Schritte:**

1. Mandant „Muster GmbH (Test)“ öffnen, Tab „Mitglieder“.

**Was sollte passieren:** Mitglieder mit Rolle: Maria Muster (Test) (Inhaberin), Jonas Beispiel (Test) (Admin), Lena Demo (Test) (Mitglied), Tobias Test (Test) (Betrachter), Sven Service (Test) (eigene Rolle „Support-Mitarbeiter (Test)“).

**Woran erkenne ich einen Fehler:** Mitglieder fehlen oder haben falsche Rollen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## F Rollen und Berechtigungen

*Ab F-03 meldest du dich mit Benutzern an, die weniger dürfen. Dort ist ein Test bestanden, wenn etwas NICHT geht.*

### F-01 Rollen ansehen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Rollen

**Schritte:**

1. Links „Rollen“ öffnen.

**Was sollte passieren:** Unter „Eigene Rollen“ stehen „Support-Mitarbeiter (Test)“ und „Abrechnung (Test)“. Unter „Integrierte Rollen“ die eingebauten Rollen (nur lesbar).

**Woran erkenne ich einen Fehler:** Eigene Rollen fehlen, oder integrierte Rollen lassen sich ändern.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### F-02 Eigene Rolle anlegen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Rollen

**Schritte:**

1. „Neue eigene Rolle“ klicken.
2. Name „QA Leser“, Geltungsbereich „Mandant“, zwei Berechtigungen ankreuzen.
3. Speichern.

**Was sollte passieren:** Meldung „Rolle „QA Leser“ angelegt“. Die Rolle steht unter „Eigene Rollen“ mit 2 Berechtigungen.

**Woran erkenne ich einen Fehler:** Fehlermeldung oder falsche Anzahl Berechtigungen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### F-03 Eingeschränkter Benutzer: kein Audit-Protokoll

**Benutzer:** Lena Demo (Test)  
**Bereich:** Rollen

**Schritte:**

1. Als Lena Demo (Test) anmelden.
2. Die Seitenleiste ansehen.
3. http://127.0.0.1:8765/audit direkt in die Adresszeile tippen.

**Was sollte passieren:** „Audit-Protokoll“ fehlt in der Seitenleiste. Die direkte Adresse zeigt eine Meldung wie „Nicht erlaubt“ – keine Audit-Einträge.

**Woran erkenne ich einen Fehler:** Lena sieht Audit-Einträge.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### F-04 Eingeschränkter Benutzer: keine API-Schlüssel anlegen

**Benutzer:** Sabine Support (Test)  
**Bereich:** Rollen

**Schritte:**

1. Als Sabine Support (Test) anmelden.
2. Links „API-Schlüssel“ öffnen.

**Was sollte passieren:** Sabine sieht die Liste (oder einen Hinweis, dass ihr der Zugriff fehlt), aber keinen Knopf „Neuer API-Schlüssel“ und kein „Schlüssel widerrufen“.

**Woran erkenne ich einen Fehler:** Sabine kann einen Schlüssel anlegen oder widerrufen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### F-05 Eingeschränkter Benutzer: keine Mandanten anlegen

**Benutzer:** Sabine Support (Test)  
**Bereich:** Rollen

**Schritte:**

1. Als Sabine Support (Test) „Mandanten“ öffnen.
2. Einen Mandanten öffnen.

**Was sollte passieren:** Kein Knopf „Neuer Mandant“. Kein „Mandant löschen“ oder „Mandant sperren“.

**Woran erkenne ich einen Fehler:** Sabine kann Mandanten anlegen, sperren oder löschen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### F-06 Mandanten-Inhaberin sieht nur ihren Mandanten

**Benutzer:** Karin Kunde (Test)  
**Bereich:** Rollen

**Schritte:**

1. Als Karin Kunde (Test) anmelden.
2. „Mandanten“ öffnen.

**Was sollte passieren:** Karin sieht nur „Beispiel AG (Test)“, nicht die anderen Mandanten.

**Woran erkenne ich einen Fehler:** Karin sieht Muster GmbH (Test) oder andere fremde Mandanten.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### F-07 Nur-Lese-Plattformrolle: Schreiben wird verweigert

**Benutzer:** Paula Plattform (Test)  
**Bereich:** Rollen

**Schritte:**

1. Als Paula Plattform anmelden.
2. „Mandanten“ öffnen und einen Mandanten öffnen.
3. „Datensätze“ öffnen, Mandant „Muster GmbH (Test)“ und eine Sammlung wählen.

**Was sollte passieren:** Paula sieht alle Daten, aber keine Knöpfe zum Ändern („Neuer Mandant“, „Mandant bearbeiten“, „Neuer Datensatz“ fehlen) – oder ein Versuch endet mit „Nicht erlaubt“.

**Woran erkenne ich einen Fehler:** Paula kann etwas anlegen, ändern oder löschen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### F-08 Benutzer ohne jede Rolle

**Benutzer:** Erik Ohne-Mandant (Test)  
**Bereich:** Rollen

**Schritte:**

1. Als Erik Ohne-Mandant anmelden.
2. Die Seite ansehen, auf der du landest.
3. „Produkte“ öffnen.

**Was sollte passieren:** Die Anmeldung klappt, aber Erik sieht keine Daten. Zum Beispiel „Noch keine Produkte für dich“.

**Woran erkenne ich einen Fehler:** Erik sieht Produkte, Mandanten oder Daten.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## G API-Schlüssel

### G-01 Schlüsselliste der Testdaten

**Benutzer:** Alex Admin (Test)  
**Bereich:** API-Schlüssel

**Schritte:**

1. Links „API-Schlüssel“ öffnen.

**Was sollte passieren:** Schlüssel „crm-backend (Test)“ (Aktiv, mit „Zuletzt verwendet“), „import-worker Muster GmbH (Test, laeuft bald ab)“ (Mandant, läuft in wenigen Tagen ab), „reporting nur lesend (Test)“, „rotierter Schluessel (Test)“, „alter Schluessel (Test, widerrufen)“ mit Status „Widerrufen“ und „Kurzzeit-Schluessel (Test, abgelaufen)“ mit Status „Abgelaufen“.

**Woran erkenne ich einen Fehler:** Schlüssel fehlen oder Status falsch.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### G-02 Schlüssel anlegen – Geheimnis nur einmal

**Benutzer:** Alex Admin (Test)  
**Bereich:** API-Schlüssel

**Schritte:**

1. „Neuer API-Schlüssel“ klicken.
2. Name „qa-test“, Berechtigung „records:read“ ankreuzen, „Schlüssel anlegen“.
3. Versuchen, das Fenster mit Esc zu schließen.
4. Mit dem Augen-Symbol das Geheimnis anzeigen, kopieren und in eine Textdatei einfügen (für Teil API-Prüfung).
5. „Ich habe das Geheimnis sicher gespeichert“ ankreuzen, „Fertig“.

**Was sollte passieren:** Das Fenster „Geheimnis jetzt kopieren“ zeigt das Geheimnis. Esc schließt es nicht. „Fertig“ geht erst nach dem Haken. Danach ist das Geheimnis nirgends mehr zu sehen.

**Woran erkenne ich einen Fehler:** Fenster schließt mit Esc ohne Haken, oder das Geheimnis ist später in der Liste wieder sichtbar.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### G-03 Schlüssel widerrufen

**Benutzer:** Alex Admin (Test)  
**Bereich:** API-Schlüssel

**Schritte:**

1. Bei „qa-test“ das Aktionsmenü (…) öffnen, „Schlüssel widerrufen“.
2. Zur Bestätigung den Namen „qa-test“ eintippen und bestätigen.

**Was sollte passieren:** Erst nach dem Eintippen lässt sich bestätigen. Danach Meldung „API-Schlüssel „qa-test“ widerrufen“ und Status „Widerrufen“.

**Woran erkenne ich einen Fehler:** Widerruf ohne Namenseingabe möglich, oder Status bleibt „Aktiv“.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## H Daten, Datensätze und Suche

### H-01 Datenübersicht

**Benutzer:** Alex Admin (Test)  
**Bereich:** Daten

**Schritte:**

1. Links „Datenübersicht“ öffnen.

**Was sollte passieren:** Unter „Datensatz-Sammlungen“ stehen „kontakte“, „notizen“ und „aufgaben“ mit Anzahl. Unter „Dateispeicher“ der Speicherverbrauch pro Mandant.

**Woran erkenne ich einen Fehler:** Sammlungen fehlen oder Fehlermeldung.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### H-02 Datensätze ansehen und filtern

**Benutzer:** Alex Admin (Test)  
**Bereich:** Daten

**Schritte:**

1. „Datensätze“ öffnen, Mandant „Muster GmbH (Test)“ und Sammlung „kontakte“ wählen.
2. Filter hinzufügen: Feld „status“, Wert „kunde“.

**Was sollte passieren:** Ohne Filter 6 Kontakte, u. a. Erika Mustermann (Test), Max Mustermann (Test), Nora Test (Test). Mit Filter nur die 3 Kunden: Erika Mustermann (Test), Hans Beispiel (Test), Clara Demo (Test).

**Woran erkenne ich einen Fehler:** Filter wirkt nicht, oder Datensätze anderer Mandanten erscheinen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### H-03 Datensatz anlegen, ändern, löschen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Daten

**Schritte:**

1. In „kontakte“ von Muster GmbH (Test) „Neuer Datensatz“ klicken.
2. Als Daten eingeben: {"name": "Peter Prüfer", "status": "interessent"}
3. „Datensatz anlegen“ klicken.
4. Den neuen Datensatz öffnen, „Bearbeiten“, status auf "kunde" ändern, speichern.
5. Dann „Datensatz löschen“ und bestätigen.

**Was sollte passieren:** Jeder Schritt bestätigt mit einer Meldung („angelegt“, „gespeichert“, „gelöscht“). Die Version steigt nach dem Ändern.

**Woran erkenne ich einen Fehler:** Änderung wird nicht übernommen, oder Datensatz bleibt nach dem Löschen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### H-04 Ungültige Eingabe wird abgefangen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Daten

**Schritte:**

1. „Neuer Datensatz“ klicken.
2. Als Daten nur „hallo“ eingeben (ohne Klammern).
3. „Datensatz anlegen“ klicken.

**Was sollte passieren:** Eine verständliche Meldung am Feld, z. B. „Das ist kein gültiges JSON.“ Nichts wird angelegt.

**Woran erkenne ich einen Fehler:** Absturz, weiße Seite oder ein Datensatz wird trotzdem angelegt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### H-05 Suche in einem Mandanten

**Benutzer:** Alex Admin (Test)  
**Bereich:** Daten

**Schritte:**

1. Links „Suche“ öffnen, Mandant „Muster GmbH (Test)“ wählen.
2. Nach „Mustermann“ suchen.

**Was sollte passieren:** Treffer der Art „kontakt“, z. B. Erika Mustermann (Test) und Max Mustermann (Test). Ein Klick öffnet das „Indizierte Dokument“.

**Woran erkenne ich einen Fehler:** „Keine Treffer“, Fehlermeldung oder die Seite hängt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## I Dateien

### I-01 Dateiliste und Speicherverbrauch

**Benutzer:** Alex Admin (Test)  
**Bereich:** Dateien

**Schritte:**

1. Links „Dateien“ öffnen, Mandant „Muster GmbH (Test)“ wählen.

**Was sollte passieren:** Dateien: angebot-2026-11.pdf, firmenlogo.png, kontakte-export.csv, protokoll-kickoff.txt. Darüber der „Speicherverbrauch“.

**Woran erkenne ich einen Fehler:** Dateien fehlen oder Speicherverbrauch fehlt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### I-02 Datei hochladen und herunterladen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Dateien

**Schritte:**

1. „Datei hochladen“ klicken, eine kleine Datei von deinem Computer wählen (z. B. ein Foto oder PDF).
2. „Hochladen“ klicken.
3. Bei der neuen Datei „Herunterladen“ wählen und die Datei öffnen.

**Was sollte passieren:** Fortschritt wird angezeigt, dann „… hochgeladen“. Die Datei steht in der Liste. Die heruntergeladene Datei ist identisch mit dem Original.

**Woran erkenne ich einen Fehler:** Upload scheitert ohne Erklärung, oder die heruntergeladene Datei ist kaputt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### I-03 Datei umbenennen und löschen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Dateien

**Schritte:**

1. Bei deiner hochgeladenen Datei „Name und Labels bearbeiten“, Namen ändern, speichern.
2. Dann „Datei löschen“ und bestätigen.

**Was sollte passieren:** „Datei aktualisiert“ mit neuem Namen, danach „… gelöscht“ und die Datei ist weg. Der Speicherverbrauch sinkt.

**Woran erkenne ich einen Fehler:** Name ändert sich nicht oder Datei bleibt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### I-04 Verbotener Dateityp

**Benutzer:** Alex Admin (Test)  
**Bereich:** Dateien

**Schritte:**

1. Eine Textdatei anlegen und sie „test.exe“ nennen.
2. Sie über „Datei hochladen“ hochladen.

**Was sollte passieren:** Studio lehnt sie ab (z. B. „Dateityp nicht zulässig“) oder speichert sie als „inert“ (unschädlich, wird nicht ausgeführt) – mit klarer Anzeige.

**Woran erkenne ich einen Fehler:** Die Datei wird ohne Hinweis ganz normal gespeichert.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### I-05 Speicherkontingent voll

**Benutzer:** Alex Admin (Test)  
**Bereich:** Dateien

**Schritte:**

1. „Dateien“ öffnen, Mandant „Grenzfall Datenhungrig GmbH (Test)“ wählen.
2. Den „Speicherverbrauch“ ansehen.
3. Versuchen, eine kleine Datei hochzuladen.

**Was sollte passieren:** Der Speicherverbrauch zeigt 3 von 3 Dateien. Der Upload wird abgelehnt, z. B. mit „Speicherkontingent erschöpft“.

**Woran erkenne ich einen Fehler:** Die Datei wird trotzdem gespeichert, oder es kommt ein unverständlicher Fehler.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## J Jobs und Zeitpläne

### J-01 Jobliste

**Benutzer:** Alex Admin (Test)  
**Bereich:** Jobs

**Schritte:**

1. Links „Jobs“ öffnen.

**Was sollte passieren:** Jobs wie „crm.kontakte.import“, „berichte.monatsbericht“, „daten.reindex“ mit Status „Wartend“, „crm.sync.extern“ mit „Abgebrochen“. Dazu Axentras eigene Jobs (z. B. Webhook-Zustellungen). Wichtig: Die Beispiel-Jobs bleiben „Wartend“, weil es im Kit keinen Bearbeiter für sie gibt. Das ist richtig so.

**Woran erkenne ich einen Fehler:** Liste leer oder Fehlermeldung. (Dauerhaft „Wartend“ ist bei den Beispiel-Jobs KEIN Fehler.)

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### J-02 Job einreihen und abbrechen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Jobs

**Schritte:**

1. „Job einreihen“ klicken, eine Art wählen, Mandant „Muster GmbH (Test)“, Verzögerung 3600 Sekunden.
2. „Einreihen“ klicken.
3. Beim neuen Job „Job abbrechen“ wählen und bestätigen.

**Was sollte passieren:** Erst „Job „…“ eingereiht“ mit Status „Wartend“ (er bleibt wartend, das ist normal), dann „Job abgebrochen“ mit Status „Abgebrochen“.

**Woran erkenne ich einen Fehler:** Job erscheint nicht oder lässt sich nicht abbrechen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### J-03 Zeitplan anlegen und deaktivieren

**Benutzer:** Alex Admin (Test)  
**Bereich:** Jobs

**Schritte:**

1. Links „Zeitpläne“ öffnen. Es gibt „Monatsbericht (Test)“, „Naechtlicher Kontakt-Import (Test)“ und „Index auffrischen (Test, pausiert)“ (deaktiviert).
2. „Neuer Zeitplan“ klicken, Name „QA stündlich“, „Häufige Ausdrücke“ > „Stündlich“, eine Art wählen.
3. „Zeitplan anlegen“ klicken.
4. Beim neuen Zeitplan „Deaktivieren“ wählen.

**Was sollte passieren:** Der neue Zeitplan zeigt „Nächster Lauf“. Nach „Deaktivieren“ steht er auf „Deaktiviert“.

**Woran erkenne ich einen Fehler:** Kein nächster Lauf, oder Deaktivieren wirkt nicht.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## K Ereignisse und Webhooks

### K-01 Ereignisprotokoll

**Benutzer:** Alex Admin (Test)  
**Bereich:** Ereignisse

**Schritte:**

1. Links „Ereignisse“ öffnen, Tab „Ereignisprotokoll“.
2. Ein Ereignis „kontakt.erstellt“ anklicken.

**Was sollte passieren:** 5 Ereignisse: „kontakt.erstellt“ (2×), „kontakt.geaendert“, „rechnung.erstellt“, „angebot.versendet“. Die Details zeigen die Daten.

**Woran erkenne ich einen Fehler:** Liste leer oder Details fehlen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### K-02 Live-Ansicht

**Benutzer:** Alex Admin (Test)  
**Bereich:** Ereignisse

**Schritte:**

1. Tab „Live“ öffnen. Warten, bis „Live“ angezeigt wird.
2. In einem zweiten Tab „Ereignisse“ > „Ereignis veröffentlichen“: Mandant „Muster GmbH (Test)“, Typ „qa.test“, „Veröffentlichen“.
3. Zurück zum ersten Tab.

**Was sollte passieren:** Im Live-Tab erscheint „qa.test“ von selbst, ohne Neuladen.

**Woran erkenne ich einen Fehler:** Ereignis erscheint nicht, oder der Zustand bleibt bei „Verbindung wird aufgebaut …“.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### K-03 Webhook mit fehlgeschlagenen Zustellungen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Webhooks

**Schritte:**

1. Links „Webhooks“ öffnen.
2. Den Endpunkt „Buchhaltungssystem (Test, nicht erreichbar)“ öffnen, Tab „Zustellungen“.
3. Eine Zustellung öffnen.

**Was sollte passieren:** Zustellungen haben den Status „Fehlgeschlagen, wird wiederholt“ oder „Endgültig fehlgeschlagen“. „Letzter Fehler“ nennt z. B. „Connection refused“. Das ist gewollt: Die Empfänger sind im Kit absichtlich nicht erreichbar (siehe /qa/, Tab „Integrationen“).

**Woran erkenne ich einen Fehler:** Keine Zustellungen, oder Zustellungen stehen auf „Zugestellt“.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### K-04 Test-Ping und erneut zustellen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Webhooks

**Schritte:**

1. Endpunkt „Buchhaltungssystem (Test, nicht erreichbar)“ öffnen.
2. „Test-Ping senden“ klicken.
3. Tab „Zustellungen“: eine fehlgeschlagene Zustellung öffnen und „Erneut zustellen“ klicken.

**Was sollte passieren:** Test-Ping: „Test-Ping fehlgeschlagen“ mit einem verständlichen Grund (der Empfänger ist absichtlich nicht erreichbar). „Erneut zustellen“ meldet „Zustellung erneut eingereiht“ und die Zustellung scheitert danach wieder.

**Woran erkenne ich einen Fehler:** Kein Feedback, Studio hängt, oder Fehlermeldung ohne Erklärung.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## L Nutzung und Kontingente

### L-01 Nutzungsübersicht mit Diagramm

**Benutzer:** Alex Admin (Test)  
**Bereich:** Nutzung

**Schritte:**

1. Links „Nutzung“ öffnen, Tab „Übersicht“.
2. Zähler „API-Aufrufe (Test)“ wählen.
3. „Datentabelle anzeigen“ klicken.

**Was sollte passieren:** Ein Diagramm mit Tageswerten der letzten Tage und „Summen pro Mandant“ für mehrere Mandanten. Die Datentabelle zeigt die gleichen Werte als Zahlen.

**Woran erkenne ich einen Fehler:** Diagramm leer oder Fehlermeldung.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### L-02 Kontingent pro Mandant überschreiben

**Benutzer:** Alex Admin (Test)  
**Bereich:** Nutzung

**Schritte:**

1. Tab „Nutzung pro Mandant“, Mandant „Probe & Partner (Test)“ wählen.
2. Bei „Erstellte Berichte (Test)“ „Überschreibung festlegen“, Limit 5, „Überschreibung speichern“.
3. Dann „Überschreibung entfernen“ und bestätigen.

**Was sollte passieren:** Nach dem Speichern zeigt die Zeile Limit 5 mit Herkunft „Mandanten-Überschreibung“. Nach dem Entfernen wieder das vorherige Limit.

**Woran erkenne ich einen Fehler:** Limit ändert sich nicht oder Herkunft falsch.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### L-03 Mandant über dem Limit

**Benutzer:** Alex Admin (Test)  
**Bereich:** Nutzung

**Schritte:**

1. Tab „Nutzung pro Mandant“, Mandant „Grenzfall Datenhungrig GmbH (Test)“ wählen.
2. Mandant „Beispiel AG (Test)“ wählen.

**Was sollte passieren:** Bei Grenzfall steht „API-Aufrufe (Test)“ über 100 % (etwa 1180 von 1000) mit „Über dem Limit“. Bei Beispiel AG sind „Erstellte Berichte (Test)“ fast voll (18 von 20).

**Woran erkenne ich einen Fehler:** Kein Hinweis auf die Überschreitung, oder falsche Zahlen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## M Tarife und Abonnements (Zahlungen sind simuliert)

*Alle Zahlungen sind nur simuliert (Testattrappe). Gib nie echte Kartendaten ein. M-03 und M-04 brauchen den Mandanten „Peter QA GmbH“ aus E-02.*

### M-01 Abonnements und Status

**Benutzer:** Alex Admin (Test)  
**Bereich:** Abrechnung

**Schritte:**

1. Links „Abonnements“ öffnen.

**Was sollte passieren:** Abonnements: Muster GmbH (Test) Professional (Test) „Testphase“; Beispiel AG (Test) Starter (Test) „Aktiv“; Demo Handwerk KG (Test) Enterprise (Test) „Aktiv“; Probe & Partner (Test) Enterprise (Test) „Überfällig“; Grenzfall Datenhungrig GmbH (Test) Professional (Test) „Unvollständig“.

**Woran erkenne ich einen Fehler:** Abonnements fehlen oder Status falsch.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### M-02 Zahlungsanbieter ist ein Test

**Benutzer:** Alex Admin (Test)  
**Bereich:** Abrechnung

**Schritte:**

1. In „Abonnements“ Mandant „Beispiel AG (Test)“ „Öffnen“.
2. Den Bereich „Zahlungsanbieter“ ansehen.

**Was sollte passieren:** Anbieter „Testattrappe (fake)“, „Echtzahlungen: Aus“. Hinweis: Studio fragt nie nach Karten- oder Bankdaten.

**Woran erkenne ich einen Fehler:** „Echtzahlungen: An“, oder Studio fragt nach Kartendaten.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### M-03 Kostenlosen Tarif abonnieren

**Benutzer:** Alex Admin (Test)  
**Bereich:** Abrechnung

**Schritte:**

1. „Abonnements“ öffnen und die Abrechnung des Mandanten „Peter QA GmbH“ öffnen.
2. „Tarif abonnieren“ klicken, „Starter (Test)“ wählen, „Abonnieren“.

**Was sollte passieren:** Meldung „Abonnement gestartet“. Das Abonnement zeigt „Starter (Test)“. Unter „Wirksame Leistungen“ stehen die Leistungen des Tarifs.

**Woran erkenne ich einen Fehler:** Fehlermeldung oder kein Abonnement.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### M-04 Kostenpflichtiger Tarif: simulierter Checkout

**Benutzer:** Alex Admin (Test)  
**Bereich:** Abrechnung

**Schritte:**

1. Bei „Peter QA GmbH“ „Sofort kündigen“ und bestätigen.
2. „Tarif abonnieren“, „Professional (Test)“ wählen, „Checkout starten“.
3. „Checkout-Seite öffnen“ klicken.

**Was sollte passieren:** „Checkout angelegt“ erscheint. Die Checkout-Seite öffnet sich NICHT – die Adresse checkout.fake.invalid führt absichtlich ins Leere (Testattrappe). Das Abonnement steht auf „Unvollständig“. Das ist alles richtig so.

**Woran erkenne ich einen Fehler:** Eine echte Zahlungsseite mit Kartenfeldern erscheint. Ebenso ein Fehler: Der Checkout scheitert mit „Serverfehler“ (auch nach einem Neustart des Kits darf das nicht passieren).

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### M-05 Abonnement kündigen und fortsetzen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Abrechnung

**Schritte:**

1. Abrechnung von „Muster GmbH (Test)“ öffnen.
2. „Zum Periodenende kündigen“ klicken und bestätigen.
3. Dann „Fortsetzen“ klicken.

**Was sollte passieren:** Nach dem Kündigen: „Das Abonnement endet zum Ende des Zeitraums“. Nach „Fortsetzen“: „Abonnement fortgesetzt“, der Hinweis ist weg.

**Woran erkenne ich einen Fehler:** Status ändert sich nicht oder Fehlermeldung.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## N Benachrichtigungen, Vorlagen und Postfach

*Keine E-Mail verlässt deinen Computer. Du findest sie auf der Kit-Seite /qa/ im Tab „E-Mails“.*

### N-01 Vorlagen und Vorschau

**Benutzer:** Alex Admin (Test)  
**Bereich:** Benachrichtigungen

**Schritte:**

1. Links „Benachrichtigungen“ öffnen, Tab „Vorlagen“.
2. Vorlage „Willkommensmail (Test)“ öffnen.
3. Die „Vorschau“ ansehen.

**Was sollte passieren:** Vorlagen „Willkommensmail (Test)“, „Rechnung bereit (Test)“, „Wartungshinweis im Posteingang (Test)“. Die Vorschau zeigt den Betreff „Willkommen im Beispiel-CRM, Erika (Test)“ mit eingesetzten Beispielwerten.

**Woran erkenne ich einen Fehler:** Platzhalter wie {{ name }} bleiben in der Vorschau stehen, oder Vorschau fehlt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### N-02 Test-Mail senden und im Mail-Fänger finden

**Benutzer:** Alex Admin (Test)  
**Bereich:** Benachrichtigungen

**Schritte:**

1. Bei „Rechnung bereit (Test)“ „Test senden“ klicken.
2. Mandant „Muster GmbH (Test)“, „Eine E-Mail-Adresse“: peter.qa@example.com, Werte ausfüllen, „Senden“.
3. http://127.0.0.1:8765/qa/ öffnen, Tab „E-Mails“.

**Was sollte passieren:** Studio zeigt „Benachrichtigung angenommen“. Nach kurzer Zeit steht die Mail an peter.qa@example.com auf /qa/ mit dem richtigen Betreff. Sie wurde nicht wirklich verschickt.

**Woran erkenne ich einen Fehler:** Mail kommt nach 2 Minuten nicht an, oder Platzhalter sind nicht ersetzt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### N-03 Nachrichtenprotokoll und Postfach in Studio

**Benutzer:** Alex Admin (Test)  
**Bereich:** Benachrichtigungen

**Schritte:**

1. Tab „Nachrichtenprotokoll“ öffnen.
2. Tab „Postfach“ öffnen.

**Was sollte passieren:** Im Protokoll steht deine Test-Mail mit Status „Gesendet“. Der Tab „Postfach“ meldet „Kein lokales Postfach auf diesem Server“. Das ist hier richtig: Die Mails landen im Mail-Fänger des Kits (/qa/, Tab „E-Mails“).

**Woran erkenne ich einen Fehler:** Test-Mail fehlt im Protokoll oder steht dauerhaft auf „Fehlgeschlagen“.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### N-04 Posteingang und eigene Einstellungen

**Benutzer:** Maria Muster (Test)  
**Bereich:** Benachrichtigungen

**Schritte:**

1. Als Maria Muster (Test) anmelden.
2. Links „Posteingang“ öffnen.
3. „Benachrichtigungen“ > Tab „Meine Einstellungen“ öffnen, eine Kategorie abwählen, „Einstellungen speichern“.

**Was sollte passieren:** Der Posteingang zeigt eine ungelesene Nachricht „Wartung am 30.11.2026 (Test)“. Beim Öffnen wird sie als gelesen markiert. Die Einstellungen speichern mit „Einstellungen gespeichert.“

**Woran erkenne ich einen Fehler:** Fehlermeldung oder Speichern klappt nicht.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## O Audit-Protokoll

### O-01 Deine Änderungen stehen im Audit

**Benutzer:** Alex Admin (Test)  
**Bereich:** Audit

**Schritte:**

1. Links „Audit-Protokoll“ öffnen.
2. Im Suchfeld „Freitext“ nach „qa-test“ suchen, „Filter anwenden“.
3. Einen Eintrag öffnen.

**Was sollte passieren:** Einträge zum Anlegen, Erneuern und Widerrufen des Schlüssels „qa-test“ mit Zeitpunkt, Akteur (du) und Ergebnis. Das Geheimnis steht nirgends im Klartext.

**Woran erkenne ich einen Fehler:** Einträge fehlen, oder ein Geheimnis ist im Audit lesbar.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## P Einstellungen, Profil, Sprache und Darstellung

### P-01 Dunkelmodus

**Benutzer:** Alex Admin (Test)  
**Bereich:** Einstellungen

**Schritte:**

1. Benutzermenü oben rechts > „Darstellung“ > „Dunkel“.
2. Ein paar Seiten durchklicken (Dashboard, Nutzung, Dateien).
3. Zurück auf „Hell“.

**Was sollte passieren:** Alles wird dunkel und bleibt gut lesbar. Kein weißer Kasten mit weißer Schrift. Zurück auf „Hell“ klappt.

**Woran erkenne ich einen Fehler:** Text nicht lesbar, oder Teile bleiben hell.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### P-02 Sprache wechseln

**Benutzer:** Alex Admin (Test)  
**Bereich:** Einstellungen

**Schritte:**

1. Benutzermenü > „Sprache“ > „English“.
2. Seite neu laden.
3. Wieder auf „Deutsch“ stellen.

**Was sollte passieren:** Die Oberfläche ist sofort englisch und bleibt es nach dem Neuladen. Danach wieder deutsch. Datumsformat passt sich an.

**Woran erkenne ich einen Fehler:** Gemischte Sprachen oder Rückfall nach dem Neuladen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### P-03 Anzeigename ändern

**Benutzer:** Lena Demo (Test)  
**Bereich:** Einstellungen

**Schritte:**

1. Als Lena anmelden, Benutzermenü > „Profil“.
2. Bei „Anzeigename“ „Lena Demo QA“ eintragen und speichern.

**Was sollte passieren:** „Name gespeichert“. Oben rechts steht der neue Name.

**Woran erkenne ich einen Fehler:** Name ändert sich nicht.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## Q Fehlerbehandlung und Datenspeicherung

*Für diese Fälle benutzt du die Skripte im Kit-Ordner.*

### Q-01 Server weg, während Studio offen ist

**Benutzer:** Alex Admin (Test)  
**Bereich:** Fehlerbehandlung

**Schritte:**

1. Studio offen lassen (z. B. „Mandanten“).
2. Doppelklick auf „3 - Beenden“.
3. In Studio auf eine andere Seite klicken oder „Aktualisieren“.

**Was sollte passieren:** Studio zeigt eine verständliche Meldung, z. B. „Server nicht erreichbar“ mit „Erneut versuchen“. Keine weiße Seite.

**Woran erkenne ich einen Fehler:** Weiße Seite, endloses Laden ohne Hinweis, oder technischer Text ohne Erklärung.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### Q-02 Server wieder da

**Benutzer:** Alex Admin (Test)  
**Bereich:** Fehlerbehandlung

**Schritte:**

1. Nach Q-01: Doppelklick auf „2 - Starten“.
2. Im bestehenden Studio-Tab „Erneut versuchen“ klicken oder neu laden.

**Was sollte passieren:** Studio arbeitet weiter. Ggf. musst du dich neu anmelden. Danach ist alles wie vorher.

**Woran erkenne ich einen Fehler:** Studio bleibt kaputt, auch nach Neuladen.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### Q-03 Daten bleiben nach Neustart erhalten

**Benutzer:** Alex Admin (Test)  
**Bereich:** Datenspeicherung

**Schritte:**

1. Einen Mandanten „Bleibt-da KG“ anlegen.
2. „3 - Beenden“, dann „2 - Starten“.
3. Anmelden und „Mandanten“ öffnen.

**Was sollte passieren:** „Bleibt-da KG“ ist noch da.

**Woran erkenne ich einen Fehler:** Mandant ist weg, oder die Testdaten wurden neu erzeugt.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### Q-04 Sichern und Zurücksetzen

**Benutzer:** keiner, dann Alex Admin (Test)  
**Bereich:** Datenspeicherung

**Schritte:**

1. „3 - Beenden“.
2. „4 - Testdaten sichern“ ausführen. Im Ordner „Sicherungen“ nachsehen.
3. „5 - Testdaten zuruecksetzen“ ausführen und bestätigen.
4. „2 - Starten“, anmelden, „Mandanten“ öffnen.

**Was sollte passieren:** In „Sicherungen“ gibt es einen neuen Ordner mit Datum und Uhrzeit. Nach dem Zurücksetzen ist „Bleibt-da KG“ weg, die ursprünglichen Testdaten sind wieder da.

**Woran erkenne ich einen Fehler:** Keine Sicherung, oder nach dem Zurücksetzen sind alte Änderungen noch da, oder gar keine Testdaten.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## R Handy-Ansicht, Tastatur und Barrierefreiheit

### R-01 Schmales Fenster (Handy-Ansicht)

**Benutzer:** Alex Admin (Test)  
**Bereich:** Handy-Ansicht

**Schritte:**

1. Das Browserfenster sehr schmal ziehen (etwa so breit wie ein Handy).
2. Links oben „Navigation öffnen“ klicken und „Datensätze“ wählen.
3. Durch eine Tabelle scrollen.

**Was sollte passieren:** Die Seitenleiste wird zu einem Menü-Knopf. Das Menü schließt sich nach der Auswahl. Die Seite scrollt nicht seitwärts; breite Tabellen scrollen in ihrem eigenen Bereich.

**Woran erkenne ich einen Fehler:** Inhalte abgeschnitten, Knöpfe nicht erreichbar, ganze Seite scrollt seitwärts.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### R-02 Bedienung nur mit Tastatur

**Benutzer:** Alex Admin (Test)  
**Bereich:** Barrierefreiheit

**Schritte:**

1. Seite „Mandanten“ neu laden. Nicht die Maus benutzen.
2. Einmal Tab drücken: „Zum Hauptinhalt springen“ erscheint.
3. Mit Tab weiter bis „Neuer Mandant“, Eingabe drücken.
4. Esc drücken.

**Was sollte passieren:** Man sieht immer, wo man ist (sichtbarer Rahmen). Der Dialog öffnet mit Eingabe und schließt mit Esc. Danach steht der Fokus wieder auf „Neuer Mandant“.

**Woran erkenne ich einen Fehler:** Fokus unsichtbar, Dialog nicht per Tastatur erreichbar oder Esc wirkt nicht.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## S Hilfecenter und Systemzustand

### S-01 Hilfecenter durchsuchen

**Benutzer:** Alex Admin (Test)  
**Bereich:** Hilfe

**Schritte:**

1. Links „Hilfecenter“ öffnen.
2. Im Suchfeld „API-Schlüssel“ eingeben.
3. Einen Treffer öffnen.

**Was sollte passieren:** Treffer erscheinen. Der Artikel ist auf Deutsch und hat rechts „Auf dieser Seite“ sowie unten „Zurück“/„Weiter“.

**Woran erkenne ich einen Fehler:** Keine Treffer, englische Artikel, oder Artikel leer.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### S-02 Hilfe ohne Anmeldung

**Benutzer:** keiner  
**Bereich:** Hilfe

**Schritte:**

1. Abmelden.
2. Auf der Anmeldeseite „Hilfe zur Anmeldung“ oder „Hilfecenter“ klicken.

**Was sollte passieren:** Das Hilfecenter öffnet sich auch ohne Anmeldung.

**Woran erkenne ich einen Fehler:** Weiterleitung zur Anmeldung oder Fehlerseite.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### S-03 Systemzustand

**Benutzer:** Alex Admin (Test)  
**Bereich:** Hilfe

**Schritte:**

1. Links „Systemzustand“ öffnen.

**Was sollte passieren:** „Bereitschaft“ und „Erreichbarkeit“ sind grün/OK. Unter „Versionen“ stehen Server- und Studio-Version (notier sie für Fehlerberichte).

**Woran erkenne ich einen Fehler:** Rote Prüfungen oder „Der Server meldet, dass er nicht bereit ist“.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

## T API-Prüfung (optional)

*Nur wenn du Lust hast. Die API-Referenz (http://127.0.0.1:8765/v1/docs, Link auf /qa/ im Tab „Integrationen“) funktioniert nur, wenn du im selben Browser in Studio angemeldet bist. Ihre Darstellung lädt Skripte aus dem Internet.*

### T-01 API-Referenz öffnen

**Benutzer:** Alex Admin (Test)  
**Bereich:** API

**Schritte:**

1. In Studio als Alex Admin (Test) angemeldet sein.
2. Auf /qa/ im Tab „Integrationen“ den Link zur API-Referenz öffnen (http://127.0.0.1:8765/v1/docs).
3. Den Abschnitt zu Mandanten (tenants) suchen.
4. Optional: In einem privaten Fenster ohne Anmeldung http://127.0.0.1:8765/v1/docs öffnen.

**Was sollte passieren:** Angemeldet öffnet sich die API-Referenz (technische Beschreibung aller Schnittstellen). Ohne Anmeldung wird sie verweigert (Fehler 401).

**Woran erkenne ich einen Fehler:** Seite leer (ohne Internet möglich – dann notieren), oder ohne Anmeldung sichtbar.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### T-02 Anfrage mit API-Schlüssel

**Benutzer:** Alex Admin (Test)  
**Bereich:** API

**Schritte:**

1. In Studio einen neuen API-Schlüssel mit „tenants:read“ anlegen und das Geheimnis kopieren.
2. In der API-Referenz die „Authorize“-Schaltfläche klicken, das Geheimnis als API-Schlüssel einfügen und bestätigen.
3. Die Anfrage zum Auflisten der Mandanten des Produkts ausführen („Try it out“, dann „Execute“).

**Was sollte passieren:** Antwort mit Status 200 und den Mandanten des Beispiel-CRM (Test). In Studio steht beim Schlüssel danach bei „Zuletzt verwendet“ ein Zeitpunkt.

**Woran erkenne ich einen Fehler:** Fehler 401/403 trotz richtigem Schlüssel, oder „Zuletzt verwendet“ bleibt leer.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________

### T-03 Widerrufener Schlüssel wird abgelehnt

**Benutzer:** Alex Admin (Test)  
**Bereich:** API

**Schritte:**

1. Den Schlüssel aus T-02 in Studio widerrufen.
2. Dieselbe Anfrage in der API-Referenz nochmal ausführen.

**Was sollte passieren:** Die Anfrage wird abgelehnt (Status 401).

**Woran erkenne ich einen Fehler:** Die Anfrage klappt weiterhin.

Ergebnis: ☐ Bestanden ☐ Fehlgeschlagen ☐ Nicht getestet ☐ Nicht anwendbar

Notiz: ______________________________________________________________

Screenshot-Datei: ______________________
