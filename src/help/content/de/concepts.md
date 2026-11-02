---
title: Grundbegriffe
summary: Die Bausteine von Axentra in einfachen Worten, von Plattform und Produkt bis zu Mandant, Rolle, Berechtigung und API-Schlüssel.
keywords: Begriffe, Terminologie, Grundlagen, Modell, Hierarchie, Plattform, Produkt, Mandant, Kunde, Organisation, Benutzer, Mitglied, Betreiber, Einladung, Rolle, Berechtigung, Modul, API-Schlüssel, Einzelprodukt, Mehrproduktbetrieb, Modus
---

Dieser Artikel erklärt die Begriffe, denen du überall in Studio begegnest, und wie sie
zusammenhängen. Lies ihn einmal, bevor du loslegst; im [Glossar](help:glossary) findest du später
kurze Definitionen zum Nachschlagen.

```diagram
hierarchy
```

## Plattform (Installation) {#platform}

Die **Plattform** ist ein Axentra-Server mit seiner Datenbank. Benutzerkonten gibt es einmal pro
Plattform; sie können zu mehreren Produkten gehören. Plattformweite Seiten in Studio sind
**Produkte**, **Audit-Protokoll**, **Systemzustand**, **Monitoring** und **Einstellungen**.

### Plattformrollen {#platform-roles}

Ein Benutzer kann eine Plattformrolle haben, die für **jedes Produkt** des Servers gilt:

| Plattformrolle                              | Was sie erlaubt                                                                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Plattform-Administration (`platform_admin`) | Volle Kontrolle über die Installation: Produkte anlegen und archivieren, alle Benutzer und ihre Plattformrollen verwalten, alles lesen. |
| Plattform-Leserecht (`platform_viewer`)     | Lesezugriff auf die gesamte Installation.                                                                                               |

Der erste Plattform-Administrator wird bei der [Ersteinrichtung](help:first-run-setup) angelegt.
Weitere Plattformrollen vergibst du auf der Seite eines Benutzers (siehe [Benutzer](help:users)).
Der letzte Plattform-Administrator kann weder deaktiviert werden noch die Rolle verlieren.

## Produkt {#product}

Ein **Produkt** ist eine Anwendung, die auf der Plattform läuft, zum Beispiel „Example CRM“. Jedes
Produkt hat eigene Mandanten, Rollen, API-Schlüssel, Daten, Tarife und Vorlagen, isoliert von allen
anderen Produkten. Die meisten Seiten in Studio gehören zu einem Produkt; die Adresse beginnt dann
mit `/p/<product id>/`, und der [Produktwechsler](help:interface#product-switcher) zeigt, um welches
es sich handelt.

Wer ein Produkt als Ganzes verwaltet, gehört zu den **Produktverantwortlichen**. Diese haben eine Produktrolle:

| Integrierte Produktrolle             | Kurz gesagt                                                                                                                               |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Produktinhaber (Product owner)       | Volle Kontrolle über das Produkt. Wer ein Produkt anlegt, wird sein Inhaber.                                                              |
| Produktadministrator (Product admin) | Verwaltet Mandanten, Rollen, Schlüssel und Daten; kann keine Produktverantwortlichen verwalten und keine Produktberechtigungen festlegen. |
| Support                              | Liest alles im Produkt und verwaltet Mandantenmitglieder im Rahmen der eigenen Berechtigungen.                                            |
| Produktbetrachter (Product viewer)   | Nur Lesezugriff auf das Produkt.                                                                                                          |

Eine Produktrolle, die Mandantenberechtigungen enthält, gewährt diese in **jedem** Mandanten des
Produkts. Siehe [Produkte](help:products).

## Mandant {#tenant}

Ein **Mandant** ist ein Kunde oder eine Organisation innerhalb eines Produkts, zum Beispiel „Acme
Ltd“. Die Daten verschiedener Mandanten sind strikt getrennt, auch innerhalb der Datenbank
(Row-Level Security). Ein Mandant ist **aktiv** oder **gesperrt**; das Sperren blockiert seine
Mitglieder und seine mandantengebundenen API-Schlüssel, ohne Daten zu löschen. Siehe
[Mandanten](help:tenants).

## Benutzer {#user}

Ein **Benutzer** ist eine Person mit einem Konto auf der Plattform, meist identifiziert über eine
E-Mail-Adresse. Dasselbe Konto kann Mitglied mehrerer Mandanten und Produktverantwortlicher mehrerer Produkte sein.
Ein Benutzer ist **aktiv** oder **deaktiviert**; das Deaktivieren beendet sofort alle Sitzungen.

Konten werden nicht in Studio angelegt. Konten entstehen bei der [Ersteinrichtung](help:first-run-setup),
bei einer Anmeldung per [Single Sign-on](help:signing-in#sso) oder durch den Code deines Produkts
(wenn Axentra als Bibliothek eingesetzt wird). Siehe [Benutzer](help:users).

## Mitglied {#member}

Ein **Mitglied** ist ein Benutzer mit einer **Mandantenrolle** in einem Mandanten. Erst die
Mitgliedschaft gibt einer Person Zugriff auf die Daten eines Mandanten. Integrierte Mandantenrollen:

| Integrierte Mandantenrolle | Kurz gesagt                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| Inhaber (Owner)            | Volle Kontrolle über den Mandanten.                                      |
| Administrator (Admin)      | Verwaltet Mitglieder und Daten des Mandanten.                            |
| Mitglied (Member)          | Arbeitet mit den Daten des Mandanten. Die Standardrolle für Einladungen. |
| Betrachter (Viewer)        | Nur Lesezugriff auf den Mandanten.                                       |

Verwechsle Mandantenmitglieder nicht mit **Produktverantwortlichen** (Produktmitgliedern), die eine
Produktrolle haben. Siehe [Mitglieder und Einladungen](help:members-invitations).

## Einladung {#invitation}

Eine **Einladung** fordert eine Person über ihre E-Mail-Adresse auf, einem Mandanten mit einer
bestimmten Rolle beizutreten. Die Einladung enthält ein Einmal-Token, ist 7 Tage gültig und kann widerrufen
werden. Die eingeladene Person nimmt sie an, während sie mit einem Konto angemeldet ist, das **dieselbe
E-Mail-Adresse** hat. Für Produktverantwortliche gibt es keine Einladungen. Siehe
[Mitglieder und Einladungen](help:members-invitations).

## Rolle {#role}

Eine **Rolle** ist ein benanntes Bündel von Berechtigungen. Axentra bringt integrierte Rollen mit
(siehe oben), die sich nicht ändern lassen. Ein Produkt kann **eigene Rollen** mit einem
**Geltungsbereich** ergänzen:

- Geltungsbereich **Mandant**: wird Mandantenmitgliedern zugewiesen und enthält nur Mandantenberechtigungen.
- Geltungsbereich **Produkt**: wird Produktverantwortlichen zugewiesen und darf Produkt- und Mandantenberechtigungen enthalten.

Siehe [Rollen und Berechtigungen](help:roles-permissions).

## Berechtigung {#permission}

Eine **Berechtigung** ist ein einzelnes Recht in der Form `resource:action`, zum Beispiel
`tenants:create` oder `records:write`. Der Zugriff wird verweigert, solange keine Rolle und kein
API-Schlüssel die Berechtigung ausdrücklich gewährt. Jede Berechtigung hat einen Geltungsbereich:

| Geltungsbereich | Bedeutung                                                               | Beispiele                                           |
| --------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| Plattform       | Installationsweit; nur Plattformrollen gewähren sie, nie API-Schlüssel. | `products:create`, `users:manage`                   |
| Produkt         | Betrifft ein Produkt als Ganzes.                                        | `tenants:create`, `api_keys:manage`, `roles:manage` |
| Mandant         | Betrifft Daten innerhalb eines Mandanten.                               | `members:manage`, `records:read`, `files:write`     |

Produkte können außerdem **eigene Berechtigungen** mit einem Namensraum und einem Punkt festlegen,
zum Beispiel `crm.deals:approve`. Die vollständige Liste steht in der
[Berechtigungsreferenz](help:permissions-reference).

### Rollenobergrenze {#role-ceiling}

Dass du Mitglieder verwalten darfst, heißt nicht, dass du jede Rolle vergeben kannst. Du kannst eine
Rolle nur zuweisen, wenn du **jede Berechtigung dieser Rolle** selbst hast; Inhaberrollen erfordern
zusätzlich den Inhaberrang. Plattform-Administratoren sind davon ausgenommen. Studio kennzeichnet
Rollen oberhalb deiner Stufe als nicht auswählbar. Dieselbe Regel gilt für API-Schlüssel: Ein
Schlüssel kann nur Berechtigungen erhalten, die du selbst hast.

## Modul {#modules}

Ein **Modul** ist ein Funktionsblock des Servers, den der Betreiber in der Serverkonfiguration ein-
oder ausschaltet. `identity`, `tenancy`, `access`, `data` und `audit` sind immer aktiviert. Zu den
optionalen Modulen gehören `storage` (Dateien), `events` (Jobs, Zeitpläne, Ereignisse, Webhooks),
`usage`, `billing` und `notify` (Benachrichtigungen).

In Studio bleibt ein Eintrag der Seitenleiste, dessen Modul nicht aktiviert ist, sichtbar und zeigt
**Aus**. Öffnest du ihn, erscheint **Modul auf diesem Server nicht aktiviert** zusammen mit der
Modul-ID, die der Betreiber aktivieren muss. Die Karte **Server** im Dashboard listet alle Module und
ihren Zustand. Siehe [Modulreferenz](help:modules-reference).

## API-Schlüssel {#api-key}

Ein **API-Schlüssel** erlaubt einer Maschine (dem Backend deines Produkts, einer Integration, einem
Skript), die API ohne Benutzer aufzurufen. Jeder Schlüssel gehört zu genau einem Produkt, hat eine
ausdrückliche Liste von Berechtigungen und kann optional an einen Mandanten gebunden werden. Sein
Geheimnis wird **einmal** angezeigt; Axentra speichert nur einen Hash. Siehe
[API-Schlüssel](help:api-keys).

## Datensätze und Dateien {#records-files}

- **Datensätze** sind JSON-Dokumente, die in benannten Sammlungen innerhalb eines Mandanten
  gespeichert sind, zum Beispiel in einer Sammlung `contacts`. Siehe [Datensätze](help:records) und
  die [Datenübersicht](help:data-overview).
- **Dateien** sind hochgeladene Binärobjekte (Dokumente, Bilder) mit Metadaten, pro Mandant
  gespeichert (Modul `storage`). Siehe [Dateien](help:files).

## Ereignisse und Jobs {#events-jobs}

Mit dem Modul `events` führt Axentra Arbeit im Hintergrund aus und teilt anderen Systemen mit, was
passiert ist:

- **Jobs**: Einheiten von Hintergrundarbeit mit Status, Wiederholungen und Ergebnissen. Siehe [Jobs](help:jobs).
- **Zeitpläne**: Jobs, die nach einem Cron-Zeitplan laufen. Siehe [Zeitpläne](help:schedules).
- **Ereignisse**: Aufzeichnungen über Geschehenes, zum Beispiel „ein Kontakt wurde angelegt“. Siehe
  [Ereignisse](help:events).
- **Webhooks**: HTTP-Aufrufe, die Ereignisse an deine Endpunkte zustellen, signiert mit einem
  Geheimnis. Siehe [Webhooks](help:webhooks).

## Nutzung und Abrechnung {#usage-billing}

- **Nutzung** (Modul `usage`) zählt den Verbrauch pro Mandant mit **Zählern**, zum Beispiel
  API-Aufrufe oder Speicher, und kann **Kontingente** durchsetzen. Siehe [Nutzung](help:usage).
- **Abrechnung** (Modul `billing`) definiert **Tarife** mit Preisen und Leistungen und weist
  sie Mandanten als **Abonnements** zu. Studio verarbeitet nie Kartendaten. Siehe
  [Tarife und Abonnements](help:plans-subscriptions).

## Audit-Protokoll {#audit-log}

Jede Änderung und jeder abgelehnte Versuch wird in derselben Transaktion wie die Änderung ins
**Audit-Protokoll** geschrieben: wer (Akteur), was (Aktion, zum Beispiel `tenancy.tenant.create`),
woran (Ziel), wann und mit welchem Ergebnis (erlaubt oder abgelehnt). Siehe
[Audit-Protokoll](help:audit).

## Einzel- und Mehrproduktbetrieb {#single-multi-product}

Der Server läuft in einem von zwei **Modi**, die der Betreiber festlegt:

|                                   | Einzelprodukt                                                        | Mehrere Produkte                                        |
| --------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Produkte                          | Genau eines, beim ersten Start aus der Serverkonfiguration angelegt. | Beliebig viele, angelegt von Plattform-Administratoren. |
| Produkte anlegen oder archivieren | Nicht möglich (`mode_not_supported`).                                | Mit `products:create` und `products:archive`.           |
| Produktwechsler                   | Eine feste Beschriftung **Produkt** mit dem Namen des Produkts.      | Ein Menü mit deinen Produkten.                          |

Alles andere (Mandanten, Rollen, API-Pfade, Berechtigungen) funktioniert in beiden Modi gleich. Der
Wechsel von Einzel- zu Mehrproduktbetrieb ist eine Konfigurationsänderung ohne Datenmigration. Die
Karte **Server** im Dashboard zeigt den aktuellen **Modus**.

## Anfrage-ID {#request-id}

Jede API-Anfrage erhält eine eindeutige **Anfrage-ID**. Studio zeigt sie zusammen mit
Fehlermeldungen an; gib sie an deinen Betreiber weiter, der damit den passenden Logeintrag und die
Audit-Ereignisse findet.

## Fehlerbehebung {#troubleshooting}

| Du siehst                                                    | Bedeutung und Lösung                                                                                                                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nicht erlaubt**                                            | Deinen Rollen fehlt die Berechtigung. Wende dich an jemanden mit einer höheren Rolle oder sieh unter [Rollen und Berechtigungen](help:roles-permissions) nach.                            |
| Eine Rolle wird als „(über deinen Berechtigungen)“ angezeigt | Die [Rollenobergrenze](help:concepts#role-ceiling) verhindert die Vergabe. Jemand, der alle Berechtigungen dieser Rolle hat, muss sie zuweisen.                                           |
| **Nicht gefunden** für etwas, das existiert                  | Axentra antwortet mit „nicht gefunden“, wenn du überhaupt keinen Zugriff hast, damit nicht verraten wird, was existiert. Prüfe, ob du im richtigen Produkt bist und dort eine Rolle hast. |
| **In diesem Modus nicht verfügbar**                          | Der Server läuft im Einzelproduktbetrieb; Produkte können weder angelegt noch archiviert werden.                                                                                          |
