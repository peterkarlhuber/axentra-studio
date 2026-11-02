---
title: Berechtigungsreferenz
summary: Jede integrierte Berechtigung von Axentra, welche integrierten Rollen sie haben und was sie in Studio ermöglicht.
keywords: Berechtigung, Berechtigungen, Berechtigungsliste, Katalog, Rollenmatrix, Geltungsbereich, Plattform, Produkt, Mandant, lesen, verwalten, Zugriffsrechte, Rechte, integrierte Rollen, Owner, Admin, Viewer, Support, Member
---

Eine _Berechtigung_ ist ein einzelnes Recht in der Form `resource:action`, zum Beispiel
`files:write`. Der Zugriff wird verweigert, solange keine Rolle und kein API-Schlüssel die
Berechtigung ausdrücklich gewährt. Diese Seite listet jede integrierte Berechtigung, zeigt, welche
integrierte Rolle sie hat, und sagt, was sie in Studio freischaltet. Wie Rollen angelegt und
vergeben werden, steht unter [Rollen und Berechtigungen](help:roles-permissions).

## Wie Berechtigungen funktionieren {#how-permissions-work}

Jede Berechtigung hat einen **Geltungsbereich**:

- **Plattform**: installationsweit. Wird nur von den Plattformrollen **Plattform-Administration**
  und **Plattform-Leserecht** gewährt, nie von Produkt- oder Mandantenrollen und nie von
  API-Schlüsseln.
- **Produkt**: betrifft ein Produkt als Ganzes (seine Mandanten, Rollen, Schlüssel, Jobs, Tarife …).
- **Mandant**: betrifft die Daten innerhalb eines Mandanten (Datensätze, Dateien, Mitglieder …).

Wer was hat:

- Eine **Mandantenrolle** gewährt Mandantenberechtigungen **nur in diesem Mandanten**.
- Eine **Produktrolle** gewährt Produktberechtigungen und Mandantenberechtigungen **in jedem
  Mandanten des Produkts**.
- Eine **Plattformrolle** gewährt ihre Berechtigungen in jedem Produkt.
- Wer nur Mitglied eines Mandanten ist, erhält trotzdem `product:read` für das Produkt, damit er
  es öffnen und seinen Mandanten auswählen kann, und sonst nichts auf Produktebene.
- Ein **API-Schlüssel** hat genau die Berechtigungen, die an ihm aufgeführt sind, in seinem Produkt
  (und, wenn er gebunden ist, nur in seinem Mandanten).

Studio blendet Schaltflächen, Tabs und Dialoge aus, die deine Berechtigungen nicht erlauben.
Bereiche in der Seitenleiste bleiben sichtbar; fehlt dir die Leseberechtigung, zeigt die Seite
**Nicht erlaubt** mit der fehlenden Berechtigung (siehe
[Fehlerbehebung](help:troubleshooting#forbidden)).

> [!TIP]
> Öffne in Studio [Berechtigungen](app:permissions), um den vollständigen Katalog deines Produkts
> zu sehen, einschließlich der Berechtigungen, die das Produkt selbst deklariert hat, mit den
> Beschreibungen des Servers.

## Plattformberechtigungen {#platform-permissions}

| Berechtigung        | Beschreibung des Servers                         | Was sie in Studio ermöglicht                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `products:create`   | Produkte anlegen (Mehrproduktbetrieb)            | **Neues Produkt** auf der Seite Produkte (nur im Mehrproduktbetrieb)                                                                                                                                                                       |
| `products:archive`  | Produkte archivieren und wiederherstellen        | Archivieren und Wiederherstellen auf der Produktseite (nur im Mehrproduktbetrieb)                                                                                                                                                          |
| `users:read`        | Alle Benutzer der Installation auflisten         | Die Detailseite jedes Benutzers öffnen, auch außerhalb deiner Produkte; alle Benutzer über die API auflisten                                                                                                                               |
| `users:manage`      | Benutzer deaktivieren und ihre Sitzungen beenden | **Benutzer deaktivieren** / **Benutzer aktivieren** und **Überall abmelden** auf der Seite eines Benutzers sowie deren Liste **Aktive Sitzungen**. Eine **Plattformrolle** zu ändern erfordert zusätzlich, Plattform-Administrator zu sein |
| `platform:settings` | Installationseinstellungen lesen                 | Die Seite [Einstellungen](app:settings); der Status des Abrechnungsanbieters und die Speichereinstellungen auf Produktseiten                                                                                                               |
| `platform:audit`    | Installationsweite Audit-Ereignisse lesen        | Das [Audit-Protokoll](app:audit) über alle Produkte, einschließlich Plattformereignissen wie Anmeldungen                                                                                                                                   |

## Produktberechtigungen {#product-permissions}

| Berechtigung             | Beschreibung des Servers                                                              | Was sie in Studio ermöglicht                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product:read`           | Das Produkt und seine Übersicht ansehen                                               | Das Produkt und sein Dashboard öffnen                                                                                                                                                                                |
| `product:manage`         | Produktdetails und -einstellungen bearbeiten                                          | Name, Beschreibung und Einstellungen auf der Produktseite bearbeiten (einschließlich der Speicherrichtlinie); erlaubt auch das Lesen der Seite [Einstellungen](app:settings) und des Status des Abrechnungsanbieters |
| `product_members:read`   | Produktverantwortliche ansehen                                                        | Der Tab **Mitglieder** der Produktseite                                                                                                                                                                              |
| `product_members:manage` | Produktverantwortliche hinzufügen, ändern und entfernen                               | Produktmitglieder hinzufügen, ändern und entfernen (innerhalb der [Rollenobergrenze](help:security#role-ceiling))                                                                                                    |
| `permissions:manage`     | Eigene Berechtigungen des Produkts über die API deklarieren und stilllegen            | In Studio nichts zum Anklicken (die Seite Berechtigungen ist schreibgeschützt); erlaubt das Lesen des Berechtigungskatalogs. Deklarieren ist über die API möglich                                                    |
| `product_users:read`     | Benutzer ansehen, die zu den Mandanten des Produkts gehören                           | Die Seite [Benutzer](app:users) des Produkts und die Detailseiten der Benutzer                                                                                                                                       |
| `tenants:read`           | Mandanten auflisten                                                                   | Die Liste [Mandanten](app:tenants) und die Mandantenseiten; Mandantenauswahl in anderen Bereichen                                                                                                                    |
| `tenants:create`         | Mandanten anlegen                                                                     | **Neuer Mandant** (Seite Mandanten und Dashboard)                                                                                                                                                                    |
| `tenants:update`         | Mandanten bearbeiten und sperren                                                      | Einen Mandanten bearbeiten, sperren und reaktivieren; das Speicherkontingent eines Mandanten festlegen                                                                                                               |
| `tenants:delete`         | Mandanten mit all ihren Daten löschen                                                 | Einen Mandanten löschen (unwiderruflich)                                                                                                                                                                             |
| `roles:read`             | Rollen ansehen                                                                        | Die Seite [Rollen](app:roles) und der Berechtigungskatalog; Studio kann damit anzeigen, welche Rollen du vergeben kannst                                                                                             |
| `roles:manage`           | Eigene Rollen anlegen, bearbeiten und löschen                                         | **Neue eigene Rolle**, eigene Rollen bearbeiten und löschen                                                                                                                                                          |
| `api_keys:read`          | API-Schlüssel ansehen (nie ihre Geheimnisse)                                          | Die Liste [API-Schlüssel](app:apiKeys) und der Berechtigungskatalog                                                                                                                                                  |
| `api_keys:manage`        | API-Schlüssel anlegen, erneuern und widerrufen                                        | **Neuer API-Schlüssel**, **Geheimnis erneuern**, **Schlüssel widerrufen**                                                                                                                                            |
| `audit:read`             | Die Audit-Ereignisse des Produkts lesen                                               | Das [Audit-Protokoll](app:audit) für dieses Produkt                                                                                                                                                                  |
| `collections:read`       | Statistiken der Datensatzsammlungen ansehen                                           | Sammlungsstatistiken in der [Datenübersicht](app:dataOverview)                                                                                                                                                       |
| `jobs:read`              | Hintergrundjobs und Ereignisse ansehen                                                | [Jobs](app:jobs), [Zeitpläne](app:schedules), [Ereignisse](app:events) einschließlich der Live-Ansicht                                                                                                               |
| `jobs:manage`            | Jobs einreihen, wiederholen und abbrechen                                             | **Job einreihen**, Jobs wiederholen und abbrechen; Zeitpläne anlegen, bearbeiten und löschen                                                                                                                         |
| `webhooks:read`          | Webhooks und Zustellungen ansehen                                                     | [Webhooks](app:webhooks) und ihre Zustellungen                                                                                                                                                                       |
| `webhooks:manage`        | Webhooks anlegen, bearbeiten und löschen                                              | Webhooks anlegen, bearbeiten, löschen; das Signaturgeheimnis erneuern, einen Test senden, erneut zustellen                                                                                                           |
| `usage:manage`           | Zähler und Kontingente definieren                                                     | Zähler anlegen und bearbeiten; Nutzungskontingente von Mandanten festlegen                                                                                                                                           |
| `billing:manage`         | Tarife, Preise und Abonnements verwalten                                              | Tarife anlegen und bearbeiten; Abonnements von Mandanten anlegen und ändern                                                                                                                                          |
| `notify:manage`          | Benachrichtigungsvorlagen verwalten und Tests senden                                  | [Benachrichtigungen](app:notifications): Vorlagen, Nachrichtenprotokoll, Statistik, das lokale Postfach                                                                                                              |
| `notify:send_external`   | Benachrichtigungen an E-Mail-Adressen senden, die keine Mitglieder des Mandanten sind | Einen Test an jede beliebige E-Mail-Adresse senden, nicht nur an Mandantenmitglieder                                                                                                                                 |

## Mandantenberechtigungen {#tenant-permissions}

Hat eine Produktrolle eine Mandantenberechtigung, gilt sie in jedem Mandanten des Produkts.

| Berechtigung         | Beschreibung des Servers                                                | Was sie in Studio ermöglicht                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant:read`        | Den Mandanten ansehen                                                   | Den Mandanten öffnen, zu dem du gehörst                                                                                                                     |
| `members:read`       | Mitglieder und Einladungen des Mandanten ansehen                        | Die Tabs **Mitglieder** und **Einladungen** eines Mandanten; die Seite [Einladungen](app:invitations)                                                       |
| `members:manage`     | Mitglieder des Mandanten einladen, ändern und entfernen                 | Mitglieder hinzufügen, einladen, Rollen ändern, Mitglieder entfernen, Einladungen widerrufen (innerhalb der [Rollenobergrenze](help:security#role-ceiling)) |
| `records:read`       | Datensätze lesen                                                        | [Datensätze](app:records) des Mandanten                                                                                                                     |
| `records:write`      | Datensätze anlegen, ändern und löschen                                  | Datensätze anlegen, bearbeiten und löschen                                                                                                                  |
| `files:read`         | Dateien auflisten und herunterladen                                     | [Dateien](app:files) des Mandanten, Download                                                                                                                |
| `files:write`        | Dateien hochladen und löschen                                           | Dateien hochladen, bearbeiten und löschen                                                                                                                   |
| `events:publish`     | Ereignisse veröffentlichen und Jobs für den Mandanten einreihen         | **Ereignis veröffentlichen** auf der Seite Ereignisse                                                                                                       |
| `usage:read`         | Nutzung und Kontingente ansehen                                         | [Nutzung](app:usage) des Mandanten, Kontingente, Nutzungs-Widgets auf dem Dashboard                                                                         |
| `usage:record`       | Nutzung erfassen                                                        | Nutzung erfassen und Reservierungen für einen Mandanten verbuchen oder freigeben                                                                            |
| `billing:read`       | Abonnement und Leistungen ansehen                                       | [Tarife](app:plans), [Abonnements](app:subscriptions) und die Abrechnung eines Mandanten                                                                    |
| `notify:send`        | Benachrichtigungen senden                                               | Testbenachrichtigungen an Mandantenmitglieder senden; die Nachrichten des Mandanten sehen                                                                   |
| `notify:preferences` | Benachrichtigungseinstellungen verwalten                                | Deine eigenen Benachrichtigungseinstellungen für einen Mandanten                                                                                            |
| `search:query`       | Den Suchindex des Mandanten durchsuchen                                 | In Studio noch nichts; über die API verfügbar                                                                                                               |
| `search:index`       | Dokumente im Suchindex des Mandanten hinzufügen, ersetzen und entfernen | In Studio noch nichts; über die API verfügbar                                                                                                               |

## Integrierte Rollen {#built-in-roles}

| Rolle (Schlüssel)                               | Ebene     | Zweck                                                                                                   |
| ----------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| **Plattform-Administration** (`platform_admin`) | Plattform | Jede Berechtigung überall; von der Rollenobergrenze ausgenommen                                         |
| **Plattform-Leserecht** (`platform_viewer`)     | Plattform | Jede Leseberechtigung, dazu `platform:settings`, `platform:audit` und `search:query`                    |
| **Product owner** (`product_owner`)             | Produkt   | Volle Kontrolle über das Produkt, einschließlich Produktverantwortlicher und Owner-Rang                 |
| **Product admin** (`product_admin`)             | Produkt   | Alles außer der Verwaltung von Produktverantwortlichen und dem Deklarieren von Produktberechtigungen    |
| **Support** (`product_support`)                 | Produkt   | Liest alles und verwaltet Mandantenmitglieder bis zu den eigenen Berechtigungen (in der Praxis: Viewer) |
| **Product viewer** (`product_viewer`)           | Produkt   | Nur Lesezugriff auf das Produkt                                                                         |
| **Owner** (`tenant_owner`)                      | Mandant   | Alle Mandantenberechtigungen, dazu der Owner-Rang                                                       |
| **Admin** (`tenant_admin`)                      | Mandant   | Alle Mandantenberechtigungen, ohne Owner-Rang                                                           |
| **Member** (`member`)                           | Mandant   | Arbeitet mit den Daten des Mandanten                                                                    |
| **Viewer** (`viewer`)                           | Mandant   | Nur Lesezugriff auf den Mandanten                                                                       |

## Rollenmatrix {#role-matrix}

✓ = Die Rolle hat die Berechtigung. Abkürzungen: **PA** Plattform-Administration, **PV**
Plattform-Leserecht, **PO** Product owner, **PAd** Product admin, **Sup** Support, **PVi** Product
viewer, **TO** Owner, **TA** Admin, **M** Member, **V** Viewer.

| Berechtigung             | PA  | PV  | PO  | PAd | Sup | PVi | TO  | TA  | M   | V   |
| ------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `products:create`        | ✓   |     |     |     |     |     |     |     |     |     |
| `products:archive`       | ✓   |     |     |     |     |     |     |     |     |     |
| `users:read`             | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `users:manage`           | ✓   |     |     |     |     |     |     |     |     |     |
| `platform:settings`      | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `platform:audit`         | ✓   | ✓   |     |     |     |     |     |     |     |     |
| `product:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `product_members:read`   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `product_members:manage` | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `permissions:manage`     | ✓   |     | ✓   |     |     |     |     |     |     |     |
| `product_users:read`     | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `tenants:create`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:update`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenants:delete`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `roles:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `roles:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `api_keys:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `api_keys:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `audit:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `collections:read`       | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:read`              | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `jobs:manage`            | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `webhooks:read`          | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |     |     |     |     |
| `webhooks:manage`        | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `usage:manage`           | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `billing:manage`         | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:manage`          | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `notify:send_external`   | ✓   |     | ✓   | ✓   |     |     |     |     |     |     |
| `tenant:read`            | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `members:manage`         | ✓   |     | ✓   | ✓   | ✓   |     | ✓   | ✓   |     |     |
| `records:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `records:write`          | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `files:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `files:write`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `events:publish`         | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `usage:read`             | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `usage:record`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `billing:read`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `notify:send`            | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `notify:preferences`     | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   | ✓   |     |
| `search:query`           | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   | ✓   |
| `search:index`           | ✓   |     | ✓   | ✓   |     |     | ✓   | ✓   |     |     |

> [!NOTE]
> **Owner** und **Admin** eines Mandanten haben dieselben Berechtigungen. Der Unterschied ist der
> Owner-Rang: Nur ein Owner (oder ein Produktverantwortlicher oder Plattform-Administrator) kann
> jemanden zum Owner machen oder einen Owner ändern oder entfernen. Siehe
> [Rollenobergrenze](help:security#role-ceiling).

## Berechtigungen, die ein Produkt selbst deklariert {#product-defined}

Neben dem integrierten Katalog kann ein Produkt eigene Berechtigungen deklarieren, benannt als
`<namespace>.<resource>:<action>`, zum Beispiel `crm.deals:approve`. Diese stehen auf der Seite
[Berechtigungen](app:permissions) unter **Produktberechtigungen**, und du kannst sie wie integrierte
Berechtigungen in eigenen Rollen und API-Schlüsseln vergeben.

- **Product owner**, **Product admin** und **Plattform-Administration** haben alle davon;
  **Owner** und **Admin** eines Mandanten haben die mandantenbezogenen.
- **Product viewer**, **Support** und **Plattform-Leserecht** haben die nur lesenden.
- **Member** und **Viewer** haben nur die, die das Produkt für sie aufführt (Spalte **Zusätzlich
  gewährt an**).
- Eine _stillgelegte_ Berechtigung hat keine Wirkung mehr, selbst wo sie noch aufgeführt ist.

## API-Schlüssel und Berechtigungen {#api-keys}

Ein [API-Schlüssel](help:api-keys) hat nur die Berechtigungen, die beim Anlegen ausgewählt wurden,
und nur in seinem Produkt (und Mandanten, wenn er gebunden ist). Du kannst einem Schlüssel nur
Berechtigungen geben, die du selbst auf Produktebene hast. Plattformberechtigungen stehen für
Schlüssel nie zur Verfügung.

## Fehlerbehebung {#troubleshooting}

| Situation                                                                    | Was du tun kannst                                                                                                                                          |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nicht erlaubt** mit `missing permission …`                                 | Such die Berechtigung oben und bitte um eine Rolle, die sie hat.                                                                                           |
| Ein Mandantenmitglied sieht das Produkt, aber keine Produktseiten            | Erwartet: Mandantenmitglieder erhalten auf Produktebene nur `product:read`. Gearbeitet wird im eigenen Mandanten.                                          |
| Eine Rolle lässt sich nicht auswählen (**„… (über deinen Berechtigungen)“**) | Die Rolle enthält Berechtigungen, die dir fehlen, oder es ist eine Owner-Rolle. Siehe [Rollenobergrenze](help:security#role-ceiling).                      |
| Eine Berechtigung fehlt im Rolleneditor                                      | Mandantenrollen bieten nur Mandantenberechtigungen an; Plattformberechtigungen werden nie angeboten; stillgelegte Produktberechtigungen sind ausgeblendet. |
| Das Rollenfeld ist ein einfaches Textfeld                                    | Du kannst keine Rollen lesen (`roles:read`); Studio kann sie nicht auflisten. Gib den Rollenschlüssel ein; der Server prüft ihn.                           |
