---
title: Benachrichtigungen
summary: E-Mail-Vorlagen in mehreren Sprachen schreiben, in der Vorschau ansehen und testen, die Zustellung im Nachrichtenprotokoll verfolgen und deine eigenen Benachrichtigungseinstellungen festlegen.
keywords: Benachrichtigung, E-Mail, Mail, Vorlage, Template, Nachricht, Postausgang, Outbox, Zustellung, SMTP, Vorschau, Testversand, Postfach, Abmeldung, Opt-out, Einstellungen, Sprache, Übersetzung
---

Axentra versendet E-Mails aus **Vorlagen**. Eine Vorlage hat einen Schlüssel, eine Kategorie und
pro Sprache eine **Variante** mit Betreff, Textinhalt und optionalem HTML-Inhalt. Dein Produkt
(oder Axentra selbst, bei Einladungen) sendet eine Vorlage mit Werten für ihre Platzhalter an
einen Empfänger; Axentra erzeugt daraus die Nachricht, legt sie in einem Postausgang ab und stellt
sie im Hintergrund zu. In Studio schreibst du Vorlagen und siehst sie in der Vorschau an, sendest
Testnachrichten, prüfst den Zustellstatus und legst fest, welche Benachrichtigungen du selbst
erhältst.

> [!IMPORTANT]
> Die Seite **Benachrichtigungen** braucht das Modul `notify` auf dem Server; ohne das Modul
> erscheint der Eintrag nicht in der Navigation (und Einladungen verschicken keine E-Mail).
> Vorlagen, Nachrichtenprotokoll, Postfach und Statistik erfordern die Produktberechtigung
> `notify:manage`. Ein Testversand erfordert zusätzlich `notify:send` im Mandanten. Alle, die zum
> Produkt gehören, können ihre eigenen Einstellungen festlegen.

## Die Seite Benachrichtigungen {#overview}

Öffne [Benachrichtigungen](app:notifications). Mit `notify:manage` siehst du die
**Zustellstatistik** und die Tabs **Vorlagen**, **Nachrichtenprotokoll**, **Postfach** und **Meine
Einstellungen**. Ohne diese Berechtigung siehst du nur **Meine Einstellungen**.

Die **Zustellstatistik** zählt die Nachrichten dieses Produkts nach Status, insgesamt und für den Zeitraum
**Letzte 24 Stunden**, und zeigt den **Zustellanbieter**, die **Zustellversuche (24 h)** und die
**Älteste wartende Nachricht**. Die Karte aktualisiert sich alle 30 Sekunden. Eine alte wartende
Nachricht bedeutet meist, dass kein Dispatcher läuft (siehe
[Fehlerbehebung](help:notifications#troubleshooting)).

## Vorlagen {#templates}

Der Tab **Vorlagen** listet deine Vorlagen und die mit **Eingebaut** gekennzeichneten Standardvorlagen mit Kategorie,
Sprachen und Version. Kennzeichen:

- **Eingebaut**: eine Standardvorlage, die mit Axentra ausgeliefert wird (derzeit `invitation`, auf
  Englisch und Deutsch). Öffne sie und speichere, um eine eigene Version mit demselben Schlüssel
  anzulegen; sie ersetzt die Standardvorlage für dieses Produkt. Löschst du deine Version, gilt
  wieder die Standardvorlage.
- **Vertraulich**: Der Inhalt gesendeter Nachrichten wird nie angezeigt und nach dem Versand
  gelöscht.
- **Nur System**: Axentra sendet diese Vorlage selbst (die Einladungs-E-Mail mit ihrem einmaligen
  Annahmelink). Du kannst ihren Inhalt ändern, sie aber weder manuell noch als Test senden.

### Eine Vorlage anlegen {#create-template}

1. Wähle **Neue Vorlage**.
2. Gib unter **Allgemein** den **Vorlagenschlüssel** ein, zum Beispiel `welcome`. Dein Produkt
   sendet die Vorlage über diesen Schlüssel; er lässt sich später nicht ändern.
3. Optional: **Name** und **Beschreibung** für Studio.
4. Gib die **Kategorie** ein, zum Beispiel `onboarding` (siehe
   [Kategorien](help:notifications#categories)).
5. Schalte **Vertraulich** ein für Inhalte wie Einmallinks oder Codes.
6. Deklariere unter **Variablen und Beispielwerte** jeden Platzhalter und gib einen Beispielwert
   für die Vorschau an (siehe [Platzhalter](help:notifications#placeholders)).
7. Fülle unter **Inhalt je Sprache** **Betreff** und **Text** für `en` aus, optional auch **HTML**.
8. Füge weitere Sprachen hinzu (siehe [Sprachen](help:notifications#locale-variants)).
9. Wähle **Vorlage erstellen**.

Jedes spätere Speichern erhöht die Version (**Neue Version speichern**). Ältere Versionen werden
nicht aufbewahrt: Das Nachrichtenprotokoll speichert für jede Nachricht den erzeugten Inhalt und
die Versionsnummer, nicht die alte Vorlage.

### Einstellungen einer Vorlage {#template-settings}

| Einstellung           | Was sie bewirkt                                                                        | Erlaubte Werte / Standard                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Vorlagenschlüssel** | Kennung beim Senden                                                                    | 2 bis 63 Zeichen: Kleinbuchstaben, Ziffern, `_`, `.` und `-`, beginnt mit einem Buchstaben; nicht änderbar |
| **Kategorie**         | Gruppiert Vorlagen für Abmeldungen                                                     | 2 bis 41 Kleinbuchstaben, Ziffern und `_`, beginnt mit einem Buchstaben; Standard `transactional`          |
| **Kanal**             | Zustellkanal                                                                           | Nur **E-Mail**                                                                                             |
| **Vertraulich**       | Der Inhalt gesendeter Nachrichten wird nie zurückgegeben und nach dem Versand gelöscht | Aus                                                                                                        |
| **Variablen**         | Platzhalter, die die Vorlage verwenden darf                                            | Höchstens 50; Buchstaben, Ziffern und `_`, nicht mit einer Ziffer beginnend                                |
| **Inhalt je Sprache** | Betreff, Text und optional HTML pro Sprache                                            | 1 bis 20 Sprachen; `en` ist Pflicht                                                                        |

### Platzhalter {#placeholders}

Schreibe Platzhalter als `{{ name }}` in Betreff, Text oder HTML. Unterstützt werden nur einfache
Platzhalter: keine Bedingungen, Schleifen, Filter oder Ausdrücke; alles andere, was mit `{{`
beginnt, wird beim Speichern abgelehnt. Jeder Platzhalter muss als Variable deklariert sein;
verwendet der Text nicht deklarierte, bietet Studio **Verwendete Platzhalter deklarieren** an.

Beim Senden einer Nachricht braucht jeder Platzhalter einen Wert (Zeichenkette, Zahl oder
true/false, höchstens 10 000 Zeichen). Werte werden unverändert in den Textinhalt eingesetzt; im
HTML-Inhalt werden sie HTML-maskiert. Betreffzeilen enthalten nie Zeilenumbrüche.

> [!WARNING]
> Ein Wert, der in einem Link (`href`) steht, bestimmt das Linkziel. Halte Links in der Vorlage
> oder lass sie von deinem Backend erzeugen; lass sie nicht von Endnutzern liefern.

### Kategorien {#categories}

Empfänger können sich in ihren Einstellungen von Kategorien abmelden. `transactional` und
`security` werden immer zugestellt und lassen sich nicht abbestellen. Verwende sie nur für
Nachrichten, die ein Benutzer unbedingt erhalten muss, etwa zum Zurücksetzen des Passworts oder für
Belege. Studio schlägt `transactional`, `security`, `onboarding` und `product` vor; du kannst jede
gültige Kategorie eingeben.

### Sprachen und Rückfall {#locale-variants}

Jede Sprache ist eine **Variante**. Um eine hinzuzufügen, gib einen Sprachcode wie `de` oder
`de-at` unter **Sprache hinzufügen** ein und wähle **Hinzufügen**; **Sprache … entfernen**
entfernt sie wieder. Englisch (`en`) ist Pflicht.

Axentra wählt die Variante in dieser Reihenfolge: die angefragte Sprache (zum Beispiel `de-at`),
dann ihre Basissprache (`de`), dann `en`. Die angefragte Sprache ist die beim Senden gewählte,
sonst die Sprache des empfangenden Benutzers, sonst (bei Einladungen) die Standardsprache des
Produkts, sonst Englisch.

## Vorschau {#preview}

Die **Vorschau** neben dem Editor erzeugt der Server aus dem aktuellen, nicht gespeicherten Stand
mit deinen Beispielwerten, kurz nachdem du aufgehört hast zu tippen. Wähle die Sprache in der
Auswahl der Vorschau; „Erzeugt in der Sprache …“ zeigt, welche Variante verwendet wurde. Die
Vorschau erscheint, sobald jede Sprache einen Betreff und einen Text hat.

HTML wird in einem isolierten Rahmen angezeigt: Skripte laufen nie, und externe Bilder, Schriften
und Styles werden nicht geladen. Die E-Mail-Programme der Empfänger können die Nachricht anders
darstellen.

## Einen Test senden {#send-test}

**Test senden** (im Editor oder über das Sendesymbol in der Vorlagenliste) sendet eine **echte**
Benachrichtigung:

1. Wähle unter **Mandant** den Mandanten. Die Nachricht gehört zu diesem Mandanten; du brauchst dort
   `notify:send`.
2. Wähle den Empfänger:
   - **Ein Mitglied des Mandanten**: Wähle das **Mitglied**. Dessen Sprache wird verwendet, sofern
     du keine andere wählst.
   - **Eine E-Mail-Adresse**: nur mit der Produktberechtigung `notify:send_external`
     (Product owner und Product admin). Ohne sie erklärt Studio, dass du nur an Mitglieder
     senden kannst.
3. Optional: Wähle eine **Sprache**; ohne Auswahl wird die Sprache des Empfängers verwendet, sonst
   Englisch.
4. Passe die **Werte** an (vorausgefüllt mit den Beispielwerten).
5. Optional: **Vorschau** zeigt das Ergebnis mit diesen Werten. Wähle dann **Senden**.

Studio bestätigt mit **Benachrichtigung angenommen**, der Nachrichten-ID und dem Status. Die
Zustellung erfolgt asynchron; verfolge sie im **Nachrichtenprotokoll**. Jeder Dialog sendet mit
einem eigenen Idempotenzschlüssel, sodass ein wiederholter Klick nach einem Netzwerkfehler nicht
doppelt sendet.

Hat sich der Empfänger von der Kategorie der Vorlage abgemeldet, wird die Nachricht mit dem Status
**Unterdrückt** angenommen und nicht zugestellt.

## Nachrichtenprotokoll {#message-log}

Das **Nachrichtenprotokoll** ist der Postausgang: jede Benachrichtigung des Produkts mit Zeit,
Vorlage (Schlüssel, Version und Sprache), **Empfänger**, **Status**, **Versuche** und **Letzter
Fehler**. Filtere nach **Status**, **Vorlagenschlüssel**, **Empfänger** und **Mandant** und wähle
dann **Übernehmen**; **Filter zurücksetzen** löscht die Filter. Das Detailsymbol öffnet alle
Felder und, sofern vorhanden, den Inhalt.

| Status               | Bedeutung                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| **In Warteschlange** | Wartet auf den Dispatcher; **Nächster Versuch** zeigt, wann                                                     |
| **Wird gesendet**    | Ein Dispatcher stellt sie gerade zu                                                                             |
| **Gesendet**         | Der Anbieter hat sie angenommen                                                                                 |
| **Fehlgeschlagen**   | Dauerhafter Fehler, oder alle Versuche sind aufgebraucht                                                        |
| **Unterdrückt**      | Nicht gesendet: Der Empfänger hat sich von der Kategorie abgemeldet, oder der Benutzer hat keine E-Mail-Adresse |

Eine fehlgeschlagene Zustellung wird automatisch mit wachsenden Wartezeiten wiederholt,
standardmäßig bis zu 5 Versuche. **Zustellung erneut versuchen** stellt eine
Nachricht im Status **Fehlgeschlagen** mit neuen Versuchen wieder in die Warteschlange. Nachdem der Inhalt
durch die Aufbewahrungsregel gelöscht wurde, geht das nicht mehr; sende die Benachrichtigung dann
neu.

Der Inhalt kann fehlen: Vertrauliche Vorlagen zeigen ihn nie, die Aufbewahrungsregel löscht ihn
(standardmäßig 30 Tage nach der Zustellung), und unterdrückte Nachrichten speichern keinen. Studio
sagt, welcher Fall vorliegt. Aus dem letzten Fehler entfernt der Server Tokens, Schlüssel und
Passwörter.

> [!NOTE]
> Die Zustellung erfolgt mindestens einmal: Nach einem Absturz kann eine Nachricht doppelt
> zugestellt werden. Nachrichten tragen eine stabile Message-ID, sodass Mailserver Duplikate
> erkennen können. Die Reihenfolge der Nachrichten ist nicht garantiert.

## Postfach {#mailbox}

Das **Postfach** gibt es nur, wenn der Server den lokalen Entwicklungsanbieter verwendet
(`notify.provider = "local"`). Dieser Anbieter versendet nichts; er legt hier ab, was er
„zugestellt“ hat, damit du Vorlagen auf Entwicklungs- und Testservern prüfen kannst. Filtere nach
**Empfänger** und öffne eine Nachricht, um sie so zu sehen, wie sie zugestellt wurde.

Bei einem echten Anbieter (SMTP) meldet der Tab **Kein lokales Postfach auf diesem Server**:
Nachrichten gehen an echte Empfänger, und du verfolgst sie im **Nachrichtenprotokoll**.

## Meine Einstellungen {#preferences}

Unter **Meine Einstellungen** wählst du, welche Kategorien du von diesem Produkt erhältst:

1. Wähle unter **Gilt für** entweder **Das ganze Produkt** oder einen Mandanten.
2. Entferne unter **Diese Kategorien erhalten** die Haken bei Kategorien, die du nicht möchtest.
   Gesperrte Kategorien (`transactional`, `security`) werden immer zugestellt.
3. Wähle **Einstellungen speichern**.

Die Einstellungen gelten für Nachrichten, die ab jetzt gesendet werden, an dich als Benutzer und an
deine E-Mail-Adresse. Eine Kategorie, die du für das ganze Produkt ausschaltest, bleibt in jedem
Mandanten aus; eine Mandanteneinstellung kann weitere ausschalten, aber keine wieder einschalten.
Kategorien erscheinen, sobald das Produkt Vorlagen darin hat. Einstellungen für einen Mandanten
erfordern dort `notify:preferences` (Mitglieder und Administratoren haben sie).

## Für Administratoren und Entwickler {#developers}

- **Versand aus deinem Produkt**: `POST /v1/products/{product_id}/tenants/{tenant_id}/notify/send`
  mit `template_key`, `to` (`{"user_id": …}` oder `{"email": …}`), `variables` und optional
  `locale`, dazu ein Header `Idempotency-Key`. Erfordert `notify:send` im Mandanten; freie Adressen
  außerhalb der Mitglieder des Mandanten erfordern zusätzlich `notify:send_external`. Siehe
  [API-Grundlagen](help:api-basics).
- **Dispatcher**: Nachrichten werden nur zugestellt, solange ein Dispatcher läuft (`axentra
notify-dispatch --loop` oder ein Worker). Ohne ihn bleiben Nachrichten **In Warteschlange**.
- **Anbieter und Einstellungen** (`[notify]`): `provider` (`local` oder `smtp`), `sender`,
  SMTP-Host, Port, Zugangsdaten und STARTTLS, `max_attempts` (Standard 5), Backoff,
  `content_retention_days` (Standard 30) und `message_retention_days` (Standard 180). Siehe
  [Serverkonfiguration](help:server-configuration).
- **Datenschutz**: Betreffzeilen und Inhalte werden verschlüsselt gespeichert. Empfängeradressen
  sind personenbezogene Daten und für Personen mit `notify:manage` sichtbar; sie werden nach Ablauf
  der Nachrichtenaufbewahrung zusammen mit der Nachricht gelöscht.
- **Einladungen**: Wird eine Mandanteneinladung angelegt, sendet Axentra die Vorlage `invitation`
  mit dem Annahmelink. Siehe [Mitglieder und Einladungen](help:members-invitations).

## Gut zu wissen {#good-to-know}

- Nur E-Mail: keine SMS oder Push-Nachrichten, keine Anhänge, keine Absenderadresse pro Produkt.
- Kein Abmeldelink und kein Header `List-Unsubscribe`; Abmeldungen funktionieren nur über die
  Einstellungen und nur für Adressen, die zu Benutzern gehören.
- Noch keine Versandratenbegrenzung pro Mandant.
- Siehe [Bekannte Einschränkungen](help:limitations).

## Fehlerbehebung {#troubleshooting}

| Was du siehst                                                                   | Warum                                                                                                                                       | Was du tun kannst                                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Nur **Meine Einstellungen**                                                     | Dir fehlt `notify:manage`                                                                                                                   | Bitte einen Produktadministrator darum, wenn du Vorlagen brauchst                                                    |
| **Bitte prüfe deine Eingaben** beim Speichern                                   | Ungültiger Schlüssel oder ungültige Kategorie, nicht deklarierter Platzhalter, nicht unterstützte `{{ … }}`-Syntax oder keine Variante `en` | Lies die Meldung des Servers; korrigiere das genannte Feld oder den Platzhalter                                      |
| Die Vorschau meldet einen fehlenden Wert                                        | Eine deklarierte Variable hat keinen Beispielwert                                                                                           | Fülle den **Beispielwert** aus                                                                                       |
| **Konflikt** „eine Vorlage mit diesem Schlüssel existiert“                      | Schlüssel sind pro Produkt eindeutig                                                                                                        | Wähle einen anderen Schlüssel oder bearbeite die vorhandene Vorlage                                                  |
| **Zwischenzeitlich geändert**                                                   | Jemand anderes hat die Vorlage gespeichert                                                                                                  | Lade neu; deine nicht gespeicherten Änderungen gehen verloren, kopiere sie also vorher                               |
| Kein Sendesymbol bei einer Vorlage                                              | Die Vorlage ist **Nur System**, oder dir fehlt `notify:send`                                                                                | Bei Einladungen erwartet; bitte um eine Rolle mit `notify:send`                                                      |
| „Du hast die Berechtigung notify:send in diesem Mandanten nicht“                | Deine Rolle deckt diesen Mandanten nicht ab                                                                                                 | Wähle einen anderen Mandanten oder bitte um eine Rolle                                                               |
| **Nicht erlaubt** beim Senden an eine Adresse                                   | Die Adresse gehört keinem Mitglied, und dir fehlt `notify:send_external`                                                                    | Sende an ein Mitglied oder frag einen Product owner                                                                  |
| **Nicht gefunden** bei einem Mitglied                                           | Der Benutzer ist kein Mitglied des Mandanten                                                                                                | Wähle ein Mitglied des gewählten Mandanten                                                                           |
| Nachrichten bleiben **In Warteschlange**; **Älteste wartende Nachricht** wächst | Kein Dispatcher läuft                                                                                                                       | Bitte den Betreiber, `axentra notify-dispatch --loop` oder einen Worker auszuführen                                  |
| Nachrichten enden als **Fehlgeschlagen**                                        | SMTP hat die Nachricht abgelehnt oder ist nicht erreichbar                                                                                  | Lies **Letzter Fehler**; bitte den Betreiber, die SMTP-Einstellungen zu prüfen, dann **Zustellung erneut versuchen** |
| **Konflikt** bei **Zustellung erneut versuchen**                                | Die Nachricht ist nicht fehlgeschlagen, oder ihr Inhalt wurde gelöscht                                                                      | Sende die Benachrichtigung neu                                                                                       |
| **Unterdrückt**                                                                 | Der Empfänger hat sich von der Kategorie abgemeldet oder hat keine E-Mail-Adresse                                                           | Verwende `transactional` nur für Nachrichten, die Benutzer unbedingt erhalten müssen                                 |
| **Kein lokales Postfach auf diesem Server**                                     | Der Server verwendet SMTP                                                                                                                   | Verwende das **Nachrichtenprotokoll**                                                                                |
