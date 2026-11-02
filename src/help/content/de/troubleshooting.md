---
title: Fehlerbehebung
summary: Was die Fehlermeldungen von Studio bedeuten, warum sie erscheinen und was du tun kannst, von Startproblemen bis zu abgelehnten Aktionen.
keywords: Fehler, Fehlermeldung, Problem, fehlgeschlagen, funktioniert nicht, Anfrage-ID, nicht erlaubt, verboten, nicht gefunden, Konflikt, 401, 403, 404, 409, 412, 413, 415, 422, 429, 500, keine Verbindung, inkompatible Version, Sitzung abgelaufen, Modul nicht aktiviert
---

Wenn der Axentra-Server eine Anfrage ablehnt oder nicht ausführen kann, zeigt Studio eine
übersetzte Meldung, die sagt, was passiert ist und was du tun kannst. Diese Seite erklärt jede
Meldung, die Startbildschirme, die du sehen kannst, bevor Studio sich öffnet, und einige häufige
Situationen. Jeder Abschnitt hat ein eigenes Linkziel, sodass Seiten dich direkt zur passenden
Erklärung führen können.

## Wie eine Fehlermeldung aufgebaut ist {#error-message}

Jeder Fehler in Studio hat dieselben Bestandteile:

- **Titel**: ein kurzer Name für das Problem, zum Beispiel **Nicht erlaubt** oder **Konflikt**. Er
  wird anhand des stabilen _Fehlercodes_ des Servers gewählt und ist daher in jeder Sprache
  derselbe.
- **Nachricht**: was passiert ist, die wahrscheinliche Ursache und was du als Nächstes tun kannst.
- **Feldfehler**: Lehnt der Server einzelne Werte ab, listet Studio sie unter den betroffenen
  Formularfeldern auf oder als Liste von Feldnamen und Gründen.
- **Technische Details** (aufklappbar): der **HTTP-Status**, der **Fehlercode**, die
  **Servermeldung** (die eigene Erklärung des Servers, immer auf Englisch) und die **Anfrage-ID**.

Fehlgeschlagene Aktionen (Speichern, Löschen, Senden) erscheinen als Benachrichtigung in der Ecke
des Bildschirms mit denselben Informationen. Bei **Nicht erlaubt** und **Konflikt** ergänzt die
Benachrichtigung die Servermeldung, weil diese meist genau nennt, was fehlt, zum Beispiel
`missing permission tenants:update` oder `a tenant with this slug exists in the product`.

### Die Anfrage-ID {#request-id}

Jede Antwort des Servers trägt eine Anfrage-ID wie `req_01EXAMPLE…`. Der Server schreibt dieselbe
ID in seine Protokolle und in das [Audit-Protokoll](help:audit). Wenn du deinem Betreiber oder dem
Support ein Problem meldest, gib immer die Anfrage-ID an: Damit finden sie die genaue Anfrage in
Sekunden.

> [!TIP]
> Öffne **Technische Details** und kopiere die Anfrage-ID, bevor du die Meldung schließt oder es
> erneut versuchst.

## Fehlercodes {#error-codes}

Die Tabelle gibt einen Überblick. Die Abschnitte darunter erklären jeden Code mit Ursachen und
Lösungen.

| Titel in Studio                        | Fehlercode                        | HTTP-Status    | Kurz gesagt                                          |
| -------------------------------------- | --------------------------------- | -------------- | ---------------------------------------------------- |
| **Bitte prüfe deine Eingaben**         | `validation_failed`               | 422 (oder 400) | Werte wurden abgelehnt                               |
| **Anfrage nicht verstanden**           | `bad_request`                     | 400            | Die Anfrage konnte nicht gelesen werden              |
| **Bitte melde dich an**                | `unauthenticated`                 | 401            | Keine gültige Sitzung                                |
| **Nicht erlaubt**                      | `forbidden`                       | 403            | Berechtigung fehlt oder Produkt bzw. Mandant inaktiv |
| **Bitte melde dich erneut an**         | `reauthentication_required`       | 403            | Erfordert eine kurz zurückliegende Anmeldung         |
| **Nicht gefunden**                     | `not_found`                       | 404            | Existiert nicht oder ist für dich nicht sichtbar     |
| **Modul nicht aktiviert**              | `module_disabled`                 | 404            | Servermodul ausgeschaltet                            |
| **Konflikt**                           | `conflict`                        | 409            | Kollidiert mit vorhandenen Daten oder dem Zustand    |
| **In diesem Modus nicht verfügbar**    | `mode_not_supported`              | 409            | In dieser Betriebsart des Servers nicht möglich      |
| **Kein Zahlungsanbieter eingerichtet** | `payment_provider_not_configured` | 409            | Die Abrechnung braucht einen Anbieter                |
| **Zwischenzeitlich geändert**          | `precondition_failed`             | 412            | Jemand anderes hat zuerst gespeichert                |
| **Zu groß**                            | `payload_too_large`               | 413            | Anfrage oder Datei zu groß                           |
| **Typ nicht zulässig**                 | `unsupported_media_type`          | 415            | Gesperrter oder nicht unterstützter Inhaltstyp       |
| **Zu viele Anfragen**                  | `rate_limited`                    | 429            | Langsamer werden                                     |
| **Kontingent überschritten**           | `quota_exceeded`                  | 429            | Mandantenkontingent oder Tariflimit aufgebraucht     |
| **Serverfehler**                       | `internal`                        | 500 und höher  | Fehler auf dem Server                                |
| **Server nicht erreichbar**            | `network_error`                   | keiner         | Keine Antwort vom Server                             |
| **Unerwarteter Fehler**                | `unknown`                         | andere         | Nicht erkannt                                        |

### Bitte prüfe deine Eingaben {#validation-failed}

**Was passiert ist:** Der Server hat die gesendeten Werte geprüft und mindestens einen abgelehnt
(`validation_failed`, HTTP 422).

**Typische Ursachen:** Ein Pflichtfeld ist leer, ein Wert ist zu lang, ein Schlüssel oder
Kurzname enthält unzulässige Zeichen, ein JSON-Feld ist kein JSON-Objekt, ein Berechtigungsname
ist unbekannt oder für diese Art von Rolle nicht erlaubt, ein Passwort erfüllt die
Passwortrichtlinie des Servers nicht.

**Was du tun kannst:** Lies die Meldungen unter den Feldern oder in der Liste unter dem Titel. Ist
kein Feld markiert, öffne **Technische Details**: Die **Servermeldung** nennt die Regel, zum
Beispiel `permissions not allowed for a tenant role: tenants:read`. Korrigiere den Wert und sende
erneut.

### Anfrage nicht verstanden {#bad-request}

**Was passiert ist:** Der Server konnte die Anfrage überhaupt nicht auswerten (`bad_request`,
HTTP 400), zum Beispiel weil ein Wert ein falsches Format hatte.

**Was du tun kannst:** Lade die Seite neu und wiederhole die Aktion. Passiert es erneut, melde es
mit der Anfrage-ID; normalerweise sendet Studio nur korrekt aufgebaute Anfragen.

### Bitte melde dich an {#unauthenticated}

**Was passiert ist:** Du bist nicht angemeldet, oder deine Sitzung ist beendet
(`unauthenticated`, HTTP 401).

**Typische Ursachen:** Eine Sitzung endet nach einer maximalen Lebensdauer (Standard 12 Stunden),
nach einer Zeit ohne Aktivität (Standard 120 Minuten), wenn du dich abmeldest, wenn du oder ein
Administrator sie beendet, wenn dein Konto deaktiviert wird und (für deine anderen Sitzungen) wenn
du dein Passwort änderst. Die genauen Zeiten legt dein Betreiber fest.

**Was du tun kannst:** Studio bringt dich automatisch zur Anmeldeseite und danach zurück zur
Seite, auf der du warst. Nicht gespeicherte Formulareingaben gehen verloren. Siehe
[Sitzung beendet](#session-ended).

### Nicht erlaubt {#forbidden}

**Was passiert ist:** Der Server kennt dich und das Element, lehnt die Aktion aber ab
(`forbidden`, HTTP 403).

**Typische Ursachen:**

- **Eine Berechtigung fehlt.** Die Servermeldung sagt, welche, zum Beispiel
  `missing permission records:write`. In der [Berechtigungsreferenz](help:permissions-reference)
  steht, was jede Berechtigung erlaubt und welche integrierten Rollen sie haben.
- **Das Produkt ist archiviert oder der Mandant gesperrt.** Dann können nur noch
  Plattform-Administratoren (voller Zugriff) und Plattform-Betrachter (Lesezugriff) darin
  arbeiten; alle anderen, auch API-Schlüssel, erhalten `the product or tenant is not active`.
- **Die Rollenobergrenze.** Du wolltest eine Rolle vergeben, die Berechtigungen enthält, die du
  selbst nicht hast, oder eine Owner-Rolle, ohne selbst Owner zu sein. Siehe
  [Rollenobergrenze](help:security#role-ceiling).
- **Berechtigungen von API-Schlüsseln.** Du wolltest einem neuen Schlüssel eine Berechtigung geben,
  die du selbst nicht hast (`you cannot grant permissions you do not hold`).
- **Ursprungsprüfung.** Der Server hat eine Anfrage abgelehnt, weil Studio unter einer Adresse
  läuft, der er nicht vertraut (`cross-origin request refused`), oder das Sicherheitstoken fehlte
  (`missing or invalid CSRF token`). Siehe
  [Anmelden oder Speichern scheitert mit Nicht erlaubt](#csrf-origin).

**Was du tun kannst:** Bitte einen Owner oder Administrator des Produkts oder Mandanten, dir eine
Rolle mit der fehlenden Berechtigung zu geben oder das Produkt bzw. den Mandanten wieder zu
aktivieren. Studio blendet Schaltflächen für Aktionen, die du nicht ausführen darfst, meist aus,
aber das letzte Wort hat immer der Server.

### Bitte melde dich erneut an {#reauthentication-required}

**Was passiert ist:** Die Aktion ist nur innerhalb weniger Minuten nach der Anmeldung erlaubt
(`reauthentication_required`, HTTP 403). Derzeit betrifft das das Festlegen eines ersten Passworts
für ein Konto, das sich bisher nur per Single Sign-on anmeldet.

**Was du tun kannst:** Wähle **Erneut anmelden**. Studio meldet dich ab, öffnet die Anmeldeseite
und bringt dich an dieselbe Stelle zurück; wiederhole die Aktion sofort (Standardzeitfenster:
5 Minuten). Hat dein Betreiber erste Passwörter ausgeschaltet, ist die Aktion nie möglich. Siehe
[Profil](help:profile).

### Nicht gefunden {#not-found}

**Was passiert ist:** Der Server antwortet so, als gäbe es das Element nicht (`not_found`,
HTTP 404).

**Typische Ursachen:** Das Element wurde gelöscht, die Adresse ist falsch geschrieben oder stammt
aus einer anderen Installation, oder du hast keine Beziehung zum Produkt oder Mandanten. Im
letzten Fall zeigt Axentra bewusst **Nicht gefunden** statt **Nicht erlaubt**, damit niemand
herausfinden kann, welche Produkte, Mandanten oder Konten existieren.

Wenn du einen vorhandenen Benutzer als Mitglied hinzufügst, bedeutet **Benutzer nicht gefunden**,
dass kein _für dich sichtbares_ Konto diese Adresse hat. Sende stattdessen eine Einladung (siehe
[Mitglieder und Einladungen](help:members-invitations)).

**Was du tun kannst:** Prüfe die Adresse, geh zurück zur Liste oder bitte jemanden mit Zugriff auf
das Produkt oder den Mandanten, dich hinzuzufügen.

### Modul nicht aktiviert {#module-disabled}

**Was passiert ist:** Die Aktion braucht ein Servermodul, das ausgeschaltet ist
(`module_disabled`).

**Was du tun kannst:** Bitte deinen Betreiber, das Modul in der Serverkonfiguration zu aktivieren.
Die [Modulreferenz](help:modules-reference) listet, wofür jedes Modul zuständig ist.

### Konflikt {#conflict}

**Was passiert ist:** Die Anfrage kollidiert mit vorhandenen Daten oder mit dem aktuellen Zustand
des Elements (`conflict`, HTTP 409). Die Servermeldung erklärt den Konflikt; Studio zeigt sie nach
dem übersetzten Text.

**Typische Ursachen und Lösungen:**

| Servermeldung (Beispiele)                                                                                     | Was du tun kannst                                                                                |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `a tenant with this slug exists in the product`, `a role with this key exists`, `a plan with this key exists` | Wähle einen anderen Kurznamen oder Schlüssel. Kurznamen und Schlüssel sind eindeutig.            |
| `an open invitation for this email exists`                                                                    | Verwende oder widerrufe zuerst die offene Einladung.                                             |
| `the tenant needs at least one owner`, `the product needs at least one owner`                                 | Gib einer anderen Person die Owner-Rolle, bevor du den letzten Owner herabstufst oder entfernst. |
| `the role is assigned 3 times; reassign those members first`                                                  | Gib diesen Mitgliedern eine andere Rolle und lösche dann die Rolle.                              |
| `subscriptions use this plan; deactivate it instead`, `the meter has recorded usage; deactivate it instead`   | Deaktivieren statt löschen.                                                                      |
| `only failed or dead jobs can be retried`, `the job is already succeeded`                                     | Der Job ist nicht mehr in einem Zustand, der die Aktion erlaubt; lade neu.                       |
| `the delivery is already queued or in progress`                                                               | Warte, bis die laufende Zustellung abgeschlossen ist.                                            |

### Bereits für eine andere Anfrage verwendet {#idempotency-conflict}

Manche Aktionen (einen Job einreihen, ein Ereignis veröffentlichen, eine Benachrichtigung senden,
Nutzung erfassen) tragen einen _Idempotenzschlüssel_, damit ein wiederholtes Absenden nicht doppelt
ausgeführt wird. Wurde derselbe Schlüssel bereits mit anderen Werten oder von einem anderen
Aufrufer verwendet, antwortet der Server mit `409`. Studio zeigt **Bereits für eine andere Anfrage
verwendet** und erzeugt entweder einen neuen Schlüssel für dich oder bietet **Neuen Schlüssel
verwenden** an. Sende erneut, um einen neuen Eintrag anzulegen. Siehe den Glossareintrag
[Idempotenzschlüssel](help:glossary#idempotency-key).

### In diesem Modus nicht verfügbar {#mode-not-supported}

**Was passiert ist:** Der Server läuft in einer Betriebsart, die die Aktion nicht unterstützt
(`mode_not_supported`).

**Typische Ursachen:** Produkte auf einem Server im Einzelproduktbetrieb anlegen oder archivieren,
oder das lokale Postfach der Benachrichtigungen öffnen, wenn der Server nicht den lokalen
Test-Mailanbieter verwendet.

**Was du tun kannst:** In Studio nichts; ein Betreiber müsste die Serverkonfiguration ändern.
Siehe [Produkte](help:products) und [Serverkonfiguration](help:server-configuration).

### Kein Zahlungsanbieter eingerichtet {#payment-provider-not-configured}

**Was passiert ist:** Eine Abrechnungsaktion, etwa ein Checkout für einen kostenpflichtigen Tarif,
braucht einen Zahlungsanbieter, und auf dem Server ist keiner eingerichtet
(`payment_provider_not_configured`).

**Was du tun kannst:** Bitte deinen Betreiber, den Zahlungsanbieter einzurichten. Siehe
[Tarife und Abonnements](help:plans-subscriptions).

### Zwischenzeitlich geändert {#precondition-failed}

**Was passiert ist:** Du hast ein Element bearbeitet, das jemand anderes gespeichert hat, nachdem
du es geöffnet hattest (`precondition_failed`, HTTP 412). Studio sendet die Version, von der du
ausgegangen bist; der Server weigert sich, die neuere Version zu überschreiben, damit keine
Änderung stillschweigend verloren geht.

**Was du tun kannst:** Lade das Element neu, sieh dir die Änderung der anderen Person an und nimm
deine Änderung erneut vor.

### Zu groß {#payload-too-large}

**Was passiert ist:** Die Anfrage oder Datei ist größer, als der Server annimmt
(`payload_too_large`, HTTP 413).

**Typische Grenzen:** Anfrage-Bodys standardmäßig 10 MiB (vom Betreiber festgelegt), ein Datensatz
höchstens 256 KiB JSON, und Dateien bis zur maximalen Dateigröße des Servers. Die Servermeldung
nennt die Grenze, zum Beispiel `files may be at most 10485760 bytes`. (Job-Nutzdaten und
Ereignisdaten, jeweils höchstens 64 KB, werden stattdessen mit **Bitte prüfe deine Eingaben**
abgelehnt.)

**Was du tun kannst:** Verwende eine kleinere Datei oder weniger Daten oder frag deinen Betreiber
nach der Grenze. Siehe [Dateien](help:files) und [Datensätze](help:records).

### Typ nicht zulässig {#unsupported-media-type}

**Was passiert ist:** Der Server akzeptiert den Inhaltstyp nicht (`unsupported_media_type`, HTTP
415). Meist wurde ein Datei-Upload blockiert: Ausführbare Dateien, HTML, SVG und Skriptdateien
werden anhand von Typ, Dateiendung und Inhalt gesperrt.

**Was du tun kannst:** Lade einen anderen Dateityp hoch oder packe die Datei in ein Archiv, sofern
dein Produkt das erlaubt. Ein Produkt kann so konfiguriert werden, dass gesperrte Dateien als
inaktive Anhänge gespeichert statt abgelehnt werden. Siehe [Dateien](help:files).

### Zu viele Anfragen {#rate-limited}

**Was passiert ist:** zu viele Anfragen in kurzer Zeit (`rate_limited`, HTTP 429).

**Typische Ursachen:** zu viele fehlgeschlagene Anmeldeversuche für ein Konto oder von einer
Netzwerkadresse (Standard: 10 Fehlversuche pro Konto und Minute) oder eine allgemeine
Anfragebegrenzung, die dein Betreiber eingeschaltet hat.

**Was du tun kannst:** Warte etwa eine Minute und versuche es dann erneut. Stößt du bei der
Anmeldung immer wieder an die Grenze, prüfe E-Mail-Adresse und Passwort oder verwende Single
Sign-on, falls verfügbar.

### Kontingent überschritten {#quota-exceeded}

**Was passiert ist:** Ein Kontingent oder Tariflimit ist aufgebraucht (`quota_exceeded`,
HTTP 429), zum Beispiel das Speicherkontingent des Mandanten (Bytes oder Anzahl der Dateien) oder
ein Nutzungskontingent.

**Was du tun kannst:** Lösche Dateien oder warte auf den nächsten Nutzungszeitraum, oder bitte
jemanden mit `tenants:update` (Speicherkontingent), `usage:manage` (Nutzungskontingente) oder
`billing:manage` (Tarife), das Limit zu erhöhen. Siehe [Nutzung](help:usage) und
[Dateien](help:files).

### Serverfehler {#internal}

**Was passiert ist:** Der Server oder ein Dienst dahinter ist bei der Bearbeitung der Anfrage
gescheitert (`internal`, HTTP 500 oder höher). Aus Sicherheitsgründen zeigt der Server nie interne
Details; die Anfrage-ID verbindet deine Meldung mit dem Protokolleintrag des Servers. Ein `502`,
`503` oder `504` von einem vorgeschalteten Reverse Proxy erscheint ebenfalls als **Serverfehler**.

**Was du tun kannst:** Versuche es nach einem Moment erneut. Deine Änderung wurde möglicherweise
nicht gespeichert; prüfe das also, bevor du zerstörerische Aktionen wiederholst. Scheitert es
weiterhin, melde es deinem Betreiber mit Anfrage-ID und Uhrzeit.

### Server nicht erreichbar {#network-error}

**Was passiert ist:** Studio hat überhaupt keine Antwort erhalten (`network_error`): Die
Verbindung ist gescheitert oder wurde unterbrochen.

**Was du tun kannst:** Prüfe deine Netzwerkverbindung und dein VPN. Funktionieren andere Websites,
ist der Axentra-Server vielleicht nicht verfügbar oder startet neu; prüfe den
[Systemzustand](help:health-monitoring), sobald er wieder antwortet, oder frag deinen Betreiber.

### Unerwarteter Fehler {#unknown}

**Was passiert ist:** Der Server hat mit einem Fehler geantwortet, den Studio nicht kennt
(`unknown`).

**Was du tun kannst:** Versuche es erneut. Passiert es immer wieder, melde es mit der Anfrage-ID,
dem **Fehlercode** und der **Servermeldung** aus **Technische Details**.

## Meldungen beim Start {#startup}

Bevor Studio etwas anzeigt, lädt es die Serverinformationen, prüft die API-Version und dann deine
Sitzung. Probleme in dieser Phase füllen den ganzen Bildschirm.

### Verbindung zum Axentra-Server wird hergestellt … {#connecting}

Das ist der normale Startbildschirm. Bleibt er lange stehen, antwortet der Server langsam oder ist
nicht erreichbar; Studio zeigt dann [Keine Verbindung zu Axentra](#api-unreachable).

### Keine Verbindung zu Axentra {#api-unreachable}

Studio konnte die Serverinformationen (`GET /v1/meta`) nicht laden. Unter der Erklärung siehst du
den Fehlertitel und, falls der Server geantwortet hat, die Anfrage-ID.

- **Server nicht erreichbar**: Der Server ist nicht verfügbar, startet neu oder wird vom Netzwerk
  blockiert.
- **Serverfehler** oder **Nicht gefunden**: Studio erreicht _etwas_, aber nicht die Axentra-API,
  zum Beispiel einen Reverse Proxy, der `/v1` nicht weiterleitet, oder eine falsche API-Adresse in
  der Konfigurationsdatei von Studio (`/config.json`, Einstellung `apiBaseUrl`).

**Was du tun kannst:** Wähle **Erneut versuchen**. Bleibt das Problem bestehen, sollte ein
Betreiber prüfen, ob der Server läuft und ob Studio auf die richtige API-Adresse zeigt (siehe
[Serverkonfiguration](help:server-configuration)).

### Inkompatible Serverversion {#incompatible-version}

Studio und Server sprechen verschiedene Versionen der Axentra-API. Der Bildschirm zeigt die
**API-Version des Servers**, die **Benötigte API-Version**, die Version des **Server** und die
**Studio-Version** sowie einen dieser Gründe:

- **Andere Hauptversion**: Studio und Server stammen aus verschiedenen Generationen.
- **Server zu alt**: Der Server ist älter, als dieses Studio voraussetzt. Aktualisiere den Server
  oder verwende ein älteres Studio.
- **Unlesbare Version**: Der Server hat eine Version gemeldet, die Studio nicht auswerten kann.

**Was du tun kannst:** Verwende ein Studio-Release, das zur API-Version des Servers passt, oder
aktualisiere den Server. Studio prüft die Version nur beim Laden der Seite: Lade die Seite nach
einem Server-Update neu.

### Axentra einrichten {#setup-required}

Ein frischer Server hat noch keinen Plattform-Administrator. Studio öffnet dann **Axentra
einrichten** statt der Anmeldeseite. Du brauchst ein einmaliges Einrichtungstoken, das ein
Betreiber auf dem Server ausgibt. Siehe [Ersteinrichtung](help:first-run-setup).

### Deine Sitzung konnte nicht geprüft werden {#session-check-failed}

Studio hat den Server gefragt, ob du angemeldet bist, und statt einer Antwort einen Fehler erhalten
(zum Beispiel **Serverfehler** oder **Server nicht erreichbar**). Wähle **Erneut versuchen**. Das
ist nicht dasselbe wie eine beendete Sitzung.

### Sitzung beendet {#session-ended}

Liefert eine Anfrage **Bitte melde dich an**, öffnet Studio die Anmeldeseite mit dem Hinweis
**Bitte melde dich an, um dort weiterzumachen, wo du aufgehört hast.** Nach der Anmeldung kehrst
du zur selben Seite zurück. Siehe [An- und Abmelden](help:signing-in).

### Modul auf diesem Server nicht aktiviert {#module-not-enabled}

Du hast einen Bereich geöffnet, dessen Servermodul ausgeschaltet ist. Die Seite nennt die
Modul-ID, die ein Betreiber aktivieren muss (zum Beispiel `storage` oder `billing`). In der
Seitenleiste tragen solche Bereiche die Kennzeichnung **Aus**. Siehe die
[Modulreferenz](help:modules-reference).

### Im Studio noch nicht verfügbar {#not-in-studio}

Das Modul ist auf dem Server aktiviert, aber dieses Studio-Release hat keine Seiten dafür.
Verwende die API direkt oder ein neueres Studio-Release.

### Seite nicht gefunden {#page-not-found}

Die Adresse passt zu keiner Seite in Studio: Vielleicht ist sie falsch geschrieben, oder das
Element wurde verschoben oder gelöscht. Wähle **Zur Startseite**.

### Etwas ist schiefgelaufen {#something-went-wrong}

Die Seite konnte nicht angezeigt werden, oft weil eine neuere Studio-Version bereitgestellt wurde,
während dein Tab offen war. Wähle **Seite neu laden**. Bleibt das Problem bestehen, melde es mit
der Adresse der Seite.

## Häufige Situationen {#situations}

### Ein Bereich zeigt Aus in der Seitenleiste {#menu-item-off}

Das Servermodul dahinter ist ausgeschaltet. Der Bereich lässt sich trotzdem öffnen und sagt dir,
welches Modul du aktivieren musst. Bereiche, die ein Produkt brauchen (die meisten), erscheinen
erst, nachdem du ein Produkt gewählt hast.

### Eine Schaltfläche oder ein Tab fehlt {#action-missing}

Studio blendet Aktionen und Tabs aus, die deine Berechtigungen nicht erlauben, zum Beispiel
**Neuer Mandant** ohne `tenants:create` oder den Tab **Mitglieder** ohne `members:read`. Schlag die
Berechtigung in der [Berechtigungsreferenz](help:permissions-reference) nach und bitte um eine
passende Rolle. Manche Aktionen sind auch wegen der Betriebsart des Servers ausgeblendet (zum
Beispiel **Neues Produkt** im Einzelproduktbetrieb).

### Eine Seite zeigt Nicht erlaubt, obwohl du sie öffnen kannst {#page-forbidden}

Die Seitenleiste zeigt jeden Bereich; ob du seine Daten lesen darfst, entscheidet sich beim Laden
der Seite. Ein Bereich ohne Leseberechtigung zeigt **Nicht erlaubt** mit der fehlenden
Berechtigung in der Servermeldung.

### Anmelden oder Speichern scheitert mit Nicht erlaubt {#csrf-origin}

Scheitern die Anmeldung oder jede Änderung mit **Nicht erlaubt** und lautet die Servermeldung
`cross-origin request refused` oder `missing or invalid CSRF token`, läuft Studio unter einer
Adresse, der der Server nicht vertraut, oder dein Browser blockiert das Sitzungscookie. Ein
Betreiber muss die Adresse von Studio zu den erlaubten Ursprüngen des Servers hinzufügen. Laufen
Studio und API unter verschiedenen Adressen, müssen beide zur selben Site gehören (zum Beispiel
`studio.example.com` und `api.example.com`). Siehe [Sicherheit](help:security#sessions-csrf).

### Die Anmeldung scheitert {#sign-in-fails}

**Anmeldung fehlgeschlagen** mit „E-Mail-Adresse oder Passwort ist falsch.“ erscheint bei einem
falschen Passwort _und_ bei einer unbekannten Adresse; der Server verrät nicht, was zutrifft. Nach
zu vielen Versuchen siehst du [Zu viele Anfragen](#rate-limited). Ein deaktiviertes Konto kann sich
überhaupt nicht anmelden. Siehe [An- und Abmelden](help:signing-in).

### Ein Einladungslink funktioniert nicht {#invitation-link}

- **Seite nicht gefunden** oder eine Seite der API: Der Link zeigt auf eine Adresse, unter der
  Studio nicht läuft. Bitte deinen Betrieb, `notify.invitation_accept_url` zu setzen, siehe
  [Mitglieder und Einladungen](help:members-invitations#delivery).
- **Diese Einladung kann nicht verwendet werden**: Die Einladung ist abgelaufen, wurde bereits
  verwendet oder widerrufen, oder der Link ist unvollständig. Bitte die Person, die dich eingeladen
  hat, um eine neue Einladung.
- **Einladung für eine andere E-Mail-Adresse**: Wähle **Abmelden und eingeladene Adresse
  verwenden**.

Siehe [Eine Einladung annehmen](help:members-invitations#accept).

### Ein einmal angezeigtes Geheimnis ist verloren {#secret-lost}

Geheimnisse von API-Schlüsseln, Signaturgeheimnisse von Webhooks und Einladungslinks werden nur
einmal angezeigt und lassen sich nicht erneut anzeigen. Erneuere das Geheimnis oder lege eine neue
Einladung an. Siehe [API-Schlüssel](help:api-keys), [Webhooks](help:webhooks) und
[Mitglieder und Einladungen](help:members-invitations).

### Probleme bestimmter Funktionen {#feature-problems}

Jeder Funktionsartikel hat einen eigenen Abschnitt zur Fehlerbehebung, zum Beispiel für Jobs, die
ausstehend bleiben, fehlschlagende Webhook-Zustellungen, abgelehnte Uploads oder Einladungen, die
nicht ankommen: [Jobs](help:jobs), [Zeitpläne](help:schedules), [Webhooks](help:webhooks),
[Dateien](help:files), [Benachrichtigungen](help:notifications),
[Tarife und Abonnements](help:plans-subscriptions).
