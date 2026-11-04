---
title: Sicherheit
summary: Wie Axentra und Studio Anmeldungen schützen, Mandanten trennen, begrenzen, was Personen vergeben dürfen, und mit Geheimnissen umgehen, und was du tun kannst, um deine Installation sicher zu halten.
keywords: Sicherheit, Sitzung, Cookie, CSRF, Row-Level Security, RLS, Mandantentrennung, Mandantenisolation, Rollenobergrenze, Geheimnis, Secret, API-Schlüssel, Erneuerung, Rotation, Webhook-Signatur, HMAC, Audit, Datenschutz, DSGVO, GDPR, Passwort
---

Axentra ist so gebaut, dass ein Fehler an einer Stelle nicht alles öffnet: Der Zugriff wird
verweigert, solange keine Rolle ihn gewährt, die Daten jedes Mandanten sind in der Datenbank
getrennt, niemand kann mehr Rechte vergeben, als er selbst hat, und Geheimnisse werden einmal
angezeigt und danach nur in einer Form gespeichert, die sich nicht zurücklesen lässt. Diese Seite
erklärt diese Schutzmechanismen in einfachen Worten, was du in Studio davon siehst und welche
Gewohnheiten eine Installation sicher halten.

> [!NOTE]
> Studio ist nur ein Fenster zum Axentra-Server. Jede Entscheidung (wer was sehen oder ändern
> darf) trifft der Server. Studio blendet Schaltflächen aus, die du nicht nutzen kannst, aber das
> Ausblenden dient der Bequemlichkeit, nicht dem Schutz.

## Sitzungen und CSRF-Schutz {#sessions-csrf}

### Deine Sitzung {#sessions}

Wenn du dich anmeldest, legt der Server eine _Sitzung_ an, und dein Browser erhält ein
Sitzungscookie. Das Cookie ist so markiert, dass Skripte auf einer Seite es nicht lesen können,
und unter HTTPS wird es nur über verschlüsselte Verbindungen gesendet. Der Server speichert nur
einen Fingerabdruck (Hash) des Sitzungstokens, nie das Token selbst. Bei jeder Anmeldung entsteht
ein neues Token.

Eine Sitzung endet:

- nach ihrer maximalen Lebensdauer (Standard 12 Stunden),
- nach einer Zeit ohne Aktivität (Standard 120 Minuten),
- wenn du im Benutzermenü **Abmelden** wählst,
- wenn du sie in deinem [Profil](help:profile) unter **Deine Sitzungen** beendest oder ein
  Administrator auf deiner Benutzerseite **Überall abmelden** verwendet,
- wenn dein Konto deaktiviert wird,
- für alle deine _anderen_ Sitzungen, wenn du dein Passwort änderst.

Dein Betreiber kann die Laufzeiten ändern. Endet eine Sitzung, bringt Studio dich zur Anmeldeseite
und danach zurück an die Stelle, an der du warst (siehe
[Sitzung beendet](help:troubleshooting#session-ended)).

### CSRF-Schutz {#csrf}

_Cross-Site Request Forgery_ (CSRF) ist ein Angriff, bei dem eine andere Website versucht, deinen
Browser eine Änderung an Axentra senden zu lassen, während du angemeldet bist. Axentra blockiert
das auf drei Arten, ohne dass du etwas tun musst:

1. Das Sitzungscookie wird bei Anfragen, die andere Websites im Hintergrund auslösen, nicht
   mitgesendet (`SameSite=Lax`).
2. Jede Änderung, die Studio sendet, trägt ein Sicherheitstoken, das zu deiner Sitzung gehört.
   Studio hält dieses Token nur im Arbeitsspeicher, nie im Browser-Speicher.
3. Der Server prüft, dass die Anfrage von einer Adresse kommt, der er vertraut (die Adresse von
   Studio muss in der Liste der erlaubten Ursprünge des Servers stehen).

Läuft Studio unter einer Adresse, der der Server nicht vertraut, scheitern die Anmeldung und jede
Änderung mit **Nicht erlaubt**; siehe
[Anmelden oder Speichern scheitert](help:troubleshooting#csrf-origin).

### Passwörter und Anmeldeversuche {#passwords}

Passwörter werden mit Argon2id gespeichert, einem langsamen Einweg-Hash. Die Richtlinie des
Servers verlangt standardmäßig mindestens 12 Zeichen. Eine fehlgeschlagene Anmeldung meldet immer,
dass E-Mail-Adresse _oder_ Passwort falsch sind, damit niemand herausfinden kann, welche Konten
existieren. Nach etwa 10 Fehlversuchen für ein Konto innerhalb einer Minute (von einer
Netzwerkadresse aus mehr) werden weitere Versuche bis zu einer Minute lang abgelehnt.

Ein _erstes_ Passwort für ein Konto, das sich nur per Single Sign-on anmeldet, lässt sich nur
innerhalb weniger Minuten nach der Anmeldung festlegen; so kann eine gestohlene Sitzung nicht in
eine dauerhafte Passwortanmeldung verwandelt werden (siehe
[Bitte melde dich erneut an](help:troubleshooting#reauthentication-required)).

## Mandantentrennung {#tenant-isolation}

Jeder Kunde und jede Organisation in einem Produkt ist ein [Mandant](help:tenants). Axentra hält
Mandanten auf zwei unabhängigen Ebenen auseinander:

1. **Berechtigungsprüfungen.** Bevor Daten gelesen oder geschrieben werden, prüft der Server, ob
   du (oder der API-Schlüssel) die nötige Berechtigung für genau dieses Produkt und diesen
   Mandanten hast.
2. **Row-Level Security in der Datenbank.** Jede Datenbanktransaktion ist auf ein Produkt oder
   einen Mandanten beschränkt. Selbst wenn in einer Abfrage ein Filter fehlt, liefert die
   Datenbank nur Zeilen dieses Produkts oder Mandanten und verweigert das Schreiben von Zeilen für
   einen anderen.

Was das für dich bedeutet:

- Ein Mandantenmitglied sieht nur die Daten des eigenen Mandanten. Wer mit einem Produkt oder
  Mandanten nichts zu tun hat, erhält **Nicht gefunden**, genau so, als gäbe es ihn nicht.
- Eine Rolle auf Produktebene (zum Beispiel **Product admin**) wirkt in _jedem_ Mandanten
  des Produkts. Vergib Produktrollen nur an Personen, die diese Reichweite wirklich brauchen.
- Ein API-Schlüssel gehört zu einem Produkt und lässt sich auf einen Mandanten beschränken.
- Benutzerkonten sind global: Ein Konto kann in mehreren Produkten und Mandanten arbeiten.
  Produktadministratoren sehen nur die Benutzer, die mit ihrem Produkt zu tun haben.

> [!NOTE]
> Datenbankadministratoren und Sicherungen der Datenbank können alle Daten sehen. Den
> Datenbankserver und seine Sicherungen zu schützen, ist Aufgabe des Betreibers.

## Rollenobergrenze: Niemand kann mehr vergeben, als er selbst hat {#role-ceiling}

Wer Mitglieder verwalten darf (`members:manage` oder `product_members:manage` für
Produktverantwortliche), kann deshalb noch lange niemanden zum Administrator machen. Der Server erzwingt
eine _Rollenobergrenze_:

- Du kannst eine Rolle nur vergeben (ein Mitglied hinzufügen, einladen oder ändern), wenn **du
  jede Berechtigung dieser Rolle** im selben Bereich hast.
- Du kannst ein Mitglied nur ändern oder entfernen, wenn auch seine _aktuelle_ Rolle innerhalb
  deiner Berechtigungen liegt.
- Die Owner-Rollen (**Owner** eines Mandanten, **Product owner** eines Produkts) kann nur ein
  Owner desselben Bereichs vergeben, ändern oder entfernen, oder jemand mit übergeordneter
  Befugnis: Produktverantwortliche bei Mandanten, Plattform-Administratoren überall.
- Der letzte Owner eines Produkts oder Mandanten kann weder entfernt noch herabgestuft werden,
  und der letzte Plattform-Administrator kann weder deaktiviert noch herabgestuft werden.

In Studio erscheinen Rollen, die du nicht vergeben kannst, als **„… (über deinen
Berechtigungen)“** und lassen sich nicht auswählen; bei Mitgliedern oberhalb deiner Ebene steht
**Über deiner eigenen Rolle: Nur wer die Berechtigungen dieser Rolle hat, kann sie ändern**.
Dasselbe Prinzip gilt für API-Schlüssel: Ein neuer Schlüssel kann nur Berechtigungen haben, die
sein Ersteller hat. Plattformberechtigungen werden nie an API-Schlüssel vergeben.

Details und Beispiele: [Rollen und Berechtigungen](help:roles-permissions) und die
[Berechtigungsreferenz](help:permissions-reference).

## Einmal angezeigte Geheimnisse {#one-time-secrets}

Manche Werte sind Geheimnisse, mit denen eine Maschine oder Person in deinem Namen handeln kann.
Axentra zeigt jedes davon **genau einmal** an:

| Geheimnis                                    | Wann es angezeigt wird                                            | Wie der Server es aufbewahrt                             |
| -------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| Geheimnis eines API-Schlüssels (`axk_…`)     | Nach dem Anlegen oder Erneuern eines Schlüssels                   | Nur als Hash; es kann nicht erneut angezeigt werden      |
| Signaturgeheimnis eines Webhooks (`whsec_…`) | Nach dem Anlegen eines Webhooks oder Erneuern seines Geheimnisses | Verschlüsselt (AES-256-GCM), nur zum Signieren verwendet |
| Einladungslink und Token                     | Nach dem Anlegen einer Einladung                                  | Nur ein Hash des Tokens                                  |
| Einrichtungstoken                            | Auf dem Server für den ersten Administrator ausgegeben            | Nur als Hash; begrenzte Zeit gültig                      |

In Studio erscheinen Geheimnisse von API-Schlüsseln und Webhooks in einem Dialog mit einer
Warnung, einem maskierten Feld und Kopierschaltflächen. Der Dialog lässt sich weder mit Escape noch
durch einen Klick daneben schließen; du bestätigst mit **Ich habe das Geheimnis sicher
gespeichert**. Einladungslinks und Tokens stehen in einem Feld mit der Kennzeichnung **Wird nur
einmal angezeigt**.

Geht ein Geheimnis verloren, lässt es sich nicht wiederherstellen:
[Erneuere den API-Schlüssel](help:api-keys), erneuere das
[Webhook-Geheimnis](help:webhooks) oder lege eine neue Einladung an.

## Sorgfältiger Umgang mit API-Schlüsseln {#api-key-hygiene}

Mit [API-Schlüsseln](help:api-keys) rufen andere Systeme die Axentra-API auf. Bewährte Praxis:

- **Ein Schlüssel pro Dienst und Umgebung**, benannt nach dem Einsatzort (zum Beispiel
  „billing-worker production“), damit du einen widerrufen kannst, ohne andere zu beschädigen.
- **Minimale Rechte:** Gewähre nur die Berechtigungen, die der Dienst braucht, und beschränke den
  Schlüssel auf einen Mandanten, wenn der Dienst nur für einen Mandanten arbeitet.
- **Bewahre Geheimnisse in einem Secret-Manager auf**, nie im Quellcode, in Tickets oder im Chat.
- **Erneuere regelmäßig** mit **Geheimnis erneuern**. Eine Übergangsfrist (bis zu 7 Tage) hält das
  alte Geheimnis funktionsfähig, während du die Dienste umstellst.
- **Widerrufe Schlüssel, die du nicht mehr brauchst.** Das Widerrufen eines Schlüssels widerruft
  auch jeden Schlüssel, der mit ihm angelegt wurde. Schlüssel, die eine Person angelegt hat,
  funktionieren nur, solange diese Person die verwendeten Berechtigungen behält
  ([Details](help:api-keys#creator-permissions)): Wenn jemand geht, ersetze die von ihm
  eingerichteten Schlüssel und widerrufe die alten.
- Behalte die Spalte **Zuletzt verwendet** im Blick: Ein nie verwendeter Schlüssel kann weg; ein
  unerwartet verwendeter Schlüssel verdient einen Blick ins [Audit-Protokoll](help:audit).

## Webhook-Signaturen {#webhook-signing}

Axentra signiert jede [Webhook](help:webhooks)-Anfrage, damit das empfangende System prüfen kann,
dass sie wirklich von deinem Axentra-Server stammt und weder verändert noch wiederholt eingespielt
wurde. Jede Anfrage trägt einen Header `Axentra-Signature`:

```text
Axentra-Signature: t=1767225600,v1=5f2b…
```

`t` ist der Zeitpunkt der Signatur (Unix-Sekunden); `v1` ist ein HMAC-SHA256 über
`<t>.<raw request body>`, berechnet mit dem Signaturgeheimnis des Webhooks. Während einer
Erneuerung des Geheimnisses mit Übergangsfrist trägt der Header zwei `v1`-Werte, einen pro
Geheimnis. Der Empfänger sollte:

1. den HMAC über den Zeitstempel, einen Punkt und den unveränderten Body berechnen,
2. ihn in konstanter Zeit mit jedem `v1`-Wert vergleichen,
3. Anfragen ablehnen, deren Zeitstempel älter als etwa 5 Minuten ist,
4. Ereignisse ignorieren, deren ID (`Axentra-Event-Id`) er bereits verarbeitet hat.

Das [Tutorial zum Webhook-Empfänger](help:tutorial-webhook-receiver) führt durch ein vollständiges
Beispiel.

## Audit-Trail {#audit-trail}

Der Server hält sicherheitsrelevante Änderungen in einem nur erweiterbaren
[Audit-Protokoll](help:audit) fest: wer (Benutzer oder API-Schlüssel), was (zum Beispiel
`access.role.create`), wann, in welchem Produkt und Mandanten, das Ergebnis, die Anfrage-ID, die
IP-Adresse und der Browser oder Client. Geheimnisse werden vor dem Speichern aus den Details
entfernt.

Produktverantwortliche mit `audit:read` sehen die Ereignisse ihres Produkts; Plattform-Administratoren
und -Betrachter (`platform:audit`) sehen installationsweite Ereignisse wie Anmeldungen und
Benutzeränderungen. Audit-Ereignisse werden für einen Zeitraum aufbewahrt, den dein Betreiber
festlegt (Standard 365 Tage).

## Was Studio nie speichert {#what-studio-never-stores}

- **Keine Geheimnisse im Browser.** Das CSRF-Token und ein Monitoring-Token, das du eingibst,
  bleiben nur im Arbeitsspeicher und verschwinden, wenn du den Tab schließt oder neu lädst.
  Einmal angezeigte Geheimnisse werden angezeigt, nie gespeichert.
- **Nur harmlose Einstellungen im Browser-Speicher:** Sprache, Darstellung, die eingeklappte
  Seitenleiste und das zuletzt verwendete Produkt.
- **Keine Karten- oder Bankdaten.** Studio fragt nie nach Zahlungsdaten; Zahlungen finden nur auf
  der gehosteten Seite des Zahlungsanbieters statt (siehe
  [Tarife und Abonnements](help:plans-subscriptions)).
- **Keine Skripte von Drittanbietern.** Studio lädt seinen Code nur von der eigenen Adresse.
  E-Mail-Vorschauen werden in einer Sandbox angezeigt, die keine Skripte ausführen kann.

Der Server entfernt außerdem Passwörter, Tokens und Schlüssel aus seinen Protokollen,
Fehlermeldungen und Audit-Details.

## Bewährte Praxis {#good-practice}

- Vergib Plattformrollen sparsam; bevorzuge Produkt- und Mandantenrollen.
- Verwende die integrierten Rollen, wo sie passen, und eigene Rollen nur mit den nötigen
  Berechtigungen.
- Deaktiviere die Konten von Personen, die gehen (**Benutzer deaktivieren** beendet sofort alle
  ihre Sitzungen), und prüfe die API-Schlüssel, die sie angelegt haben.
- Prüfe regelmäßig das [Audit-Protokoll](help:audit), besonders Änderungen an Rollen, Schlüsseln
  und Mitgliedern.
- Melde dich an gemeinsam genutzten Computern ab und beende Sitzungen, die du nicht erkennst, in
  deinem [Profil](help:profile).

> [!IMPORTANT]
> Axentra bietet technische Maßnahmen (Mandantentrennung, Verschlüsselung gespeicherter
> Geheimnisse, Audit-Trail, Datenminimierung in Protokollen), macht eine Installation aber nicht
> von sich aus datenschutzkonform, etwa im Sinne der DSGVO. Hosting, Sicherungen, Aufbewahrung und
> Anfragen betroffener Personen liegen in der Verantwortung des Betreibers. Einen eingebauten
> Export oder eine Löschung der Daten einer Person gibt es noch nicht (siehe
> [Einschränkungen](help:limitations)).

## Fehlerbehebung {#troubleshooting}

| Situation                                                                                                                       | Ursache und Lösung                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anmeldung und alle Änderungen scheitern mit **Nicht erlaubt** (`cross-origin request refused`, `missing or invalid CSRF token`) | Die Adresse von Studio steht nicht in den erlaubten Ursprüngen des Servers, oder das Cookie wird blockiert. Siehe [den Eintrag in der Fehlerbehebung](help:troubleshooting#csrf-origin). |
| Du wirst unerwartet abgemeldet                                                                                                  | Die Sitzung ist abgelaufen, wurde beendet, oder dein Passwort wurde in einer anderen Sitzung geändert. Melde dich erneut an.                                                             |
| **Nicht erlaubt** beim Vergeben einer Rolle                                                                                     | Rollenobergrenze: Die Rolle enthält Berechtigungen, die du nicht hast, oder es ist eine Owner-Rolle. Frag einen Owner.                                                                   |
| **Nicht erlaubt** beim Anlegen eines API-Schlüssels                                                                             | Du wolltest eine Berechtigung vergeben, die du selbst nicht hast. Entferne sie aus der Auswahl.                                                                                          |
| **Bitte melde dich erneut an** beim Festlegen eines Passworts                                                                   | Nur kurz nach der Anmeldung erlaubt. Wähle **Erneut anmelden** und wiederhole den Vorgang sofort.                                                                                        |
| Ein Empfänger lehnt Webhook-Signaturen ab                                                                                       | Er muss den _unveränderten_ Body signieren, jeden `v1`-Wert akzeptieren und das aktuelle Geheimnis verwenden. Siehe [Webhooks](help:webhooks).                                           |
| Du hast ein Geheimnis verloren                                                                                                  | Es kann nicht erneut angezeigt werden; erneuere es oder lege eine neue Einladung an.                                                                                                     |
