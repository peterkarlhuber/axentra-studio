---
title: Eine Kundenorganisation einrichten
summary: Einen neuen Kunden von Anfang bis Ende einrichten - Mandant, Administrator und Mitarbeitende mit passenden Rollen, angenommene Einladungen, ein API-Schlüssel für die Integration und eine Prüfung im Audit-Protokoll.
keywords: Onboarding, Kundeneinrichtung, neuer Kunde, Mandant einrichten, einladen, Einladung, Einladung annehmen, Owner, Admin, Member, Viewer, Integration, API-Schlüssel, Audit, Checkliste, Offboarding, Kunde verlässt
---

Ein neuer Kunde, „Acme Ltd“, hat sich für dein Produkt angemeldet. In diesem Tutorial bereitest du
alles vor, was er braucht: einen eigenen Mandanten, seinen Administrator und seine Mitarbeitenden
mit passenden Rollen, einen API-Schlüssel für seine Integration und eine Prüfung im
Audit-Protokoll, dass alles wie geplant gelaufen ist. Außerdem erfährst du, was der Kunde auf
seiner Seite tun muss, um eine Einladung anzunehmen.

Dieses Tutorial baut auf den [ersten Schritten](help:first-steps) auf. Plane etwa 30 Minuten ein,
plus die Zeit, die der Kunde zum Annehmen braucht.

## Bevor du anfängst {#before-you-start}

> [!IMPORTANT]
> Du brauchst diese Berechtigungen im Produkt (die integrierten Rollen **Product owner** und
> **Product admin** haben sie alle; ein Plattform-Administrator hat sie ohnehin):
>
> | Aufgabe                                 | Berechtigung                                                                         |
> | --------------------------------------- | ------------------------------------------------------------------------------------ |
> | Mandanten anlegen                       | `tenants:create`                                                                     |
> | Mitglieder einladen, hinzufügen, ändern | `members:manage`                                                                     |
> | Den **Owner** des Kunden einladen       | Owner-Rang: Produktverantwortliche, Owner des Mandanten oder Plattform-Administrator |
> | API-Schlüssel anlegen                   | `api_keys:manage` und jede Berechtigung, die du dem Schlüssel gibst                  |
> | Audit-Protokoll prüfen                  | `audit:read`                                                                         |

Hol vorab beim Kunden ein:

- die E-Mail-Adresse seines **Administrators** und jedes Mitarbeitenden,
- was jede Person tun können soll,
- was seine Integration über die API erledigen muss.

## Schritt 1: Die Rollen planen {#plan-roles}

Lege die Rollen fest, bevor du jemanden einlädst; spätere Änderungen sind möglich, werden aber
leichter vergessen.

| Person                                | Empfohlene Mandantenrolle | Warum                                                                                  |
| ------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| Hauptadministrator des Kunden         | **Owner**                 | Volle Kontrolle über den Mandanten, kann alle Mitglieder verwalten, auch andere Owner. |
| Stellvertretender Administrator       | **Admin**                 | Verwaltet Mitglieder und Daten, kann aber keine Owner zuweisen oder entfernen.         |
| Mitarbeitende, die mit Daten arbeiten | **Member**                | Liest und schreibt Daten, sieht Mitglieder; kann keine Mitglieder verwalten.           |
| Prüfer, Mitarbeitende mit Lesezugriff | **Viewer**                | Liest nur Daten.                                                                       |

Passt keine davon, kann ein Produktverantwortlicher mit `roles:manage` zuerst eine eigene
Mandantenrolle anlegen. Siehe [Rollen und Berechtigungen](help:roles-permissions).

> [!TIP]
> Vergib **Owner** nur an eine oder zwei Personen. Ein zweiter Owner verhindert eine Blockade, wenn der erste geht.

## Schritt 2: Den Mandanten anlegen {#create-tenant}

1. Öffne [Mandanten](app:tenants) und wähle **Neuer Mandant**.
2. **Name**: `Acme Ltd`. Behalte den abgeleiteten **Kurzname** `acme-ltd` oder gib die Kurzbezeichnung
   des Kunden ein. Der Kurzname muss im Produkt eindeutig sein und kann nicht wiederverwendet
   werden, solange der Mandant existiert.
3. Wähle **Mandant anlegen**.

**Erwartetes Ergebnis:** „Mandant ‚Acme Ltd‘ angelegt“; die Seite des Mandanten öffnet sich mit dem
Status **Aktiv** und ohne Mitglieder. Notiere die **ID** des Mandanten (`ten_…`) aus dem Tab
**Details**.

## Schritt 3: Den Administrator des Kunden einladen {#invite-admin}

1. Öffne auf der Seite des Mandanten **Einladungen** und wähle **Mitglied einladen**.
2. **E-Mail-Adresse**: die Adresse des Administrators, zum Beispiel `admin@acme.example`.
3. **Rolle**: **Owner**.
4. Wähle **Einladung senden**.

**Erwartetes Ergebnis:** **Einladung erstellt** mit dem **Einladungs-Token** und, wenn das Modul
`notify` aktiviert ist, einem **Einladungslink**. Beide werden nur einmal angezeigt.

### Wie die Einladung zum Kunden gelangt {#delivery}

- **Mit dem Modul `notify`** schickt Axentra die Einladung samt Link per E-Mail an die Adresse. Du
  musst nichts senden; den Link kannst du trotzdem als Reserve kopieren.
- **Ohne das Modul** kopierst du das **Einladungs-Token** und schickst es selbst über einen
  vertrauenswürdigen Kanal, zusammen mit der Anleitung aus
  [Schritt 5](help:tutorial-onboard-customer#accept-invitation).

> [!NOTE]
> Der Einladungslink wird aus der Produkteinstellung `invitation_accept_url` gebildet (in den
> **Einstellungen (JSON)** des Produkts), zum Beispiel
> `{"invitation_accept_url": "https://app.example.com/accept-invitation?token={token}"}`. Ohne diese
> Einstellung zeigt der Link auf `/accept-invitation` unter der öffentlichen Adresse der API. Lass
> ihn auf die Seite deines Produkts zeigen, die Einladungen annimmt, oder auf die Studio-eigene
> Seite `https://studio.example.com/invitations/accept?token={token}`, wenn deine Kunden Studio
> verwenden.

**Prüfen:** Der Tab **Einladungen** zeigt die Einladung mit dem Status **Ausstehend** und einem
Ablaufdatum 7 Tage in der Zukunft.

## Schritt 4: Die Mitarbeitenden hinzufügen {#add-staff}

Wähle für jede weitere Person einen Weg:

- **Die Person hat bereits ein Konto, das du sehen kannst** (zum Beispiel als Mitglied eines
  anderen Mandanten dieses Produkts): Öffne **Mitglieder**, wähle **Mitglied hinzufügen**, gib die
  **E-Mail-Adresse** ein, wähle die **Rolle** und bestätige. Die Person hat sofort Zugriff.
- **Andernfalls**: Lade sie wie in Schritt 3 ein, mit der Rolle aus Schritt 1. Antwortet
  **Mitglied hinzufügen** mit **Benutzer nicht gefunden**, wähle **Stattdessen einladen**; Studio
  legt eine Einladung mit derselben Rolle an.

Axentra verrät nicht, ob zu einer Adresse ein Konto existiert: Das Einladen funktioniert für jede
Adresse gleich.

## Schritt 5: Der Kunde nimmt an {#accept-invitation}

Das tut die eingeladene Person. Schick ihr diese Anleitung.

1. **Ein Konto mit genau der eingeladenen E-Mail-Adresse haben.**
   - Bietet dein Server **Single Sign-on** an, meldet sich die Person mit **Weiter mit …** an. Für
     eine bestätigte E-Mail-Adresse mit offener Einladung wird automatisch ein Konto angelegt.
   - Bei **nur Passwortanmeldung** muss das Konto bereits existieren. Axentra bietet über die API
     keine Selbstregistrierung: Konten für die Passwortanmeldung legt der Code deines Produkts an.
     Siehe [Benutzer](help:users).
2. **Den Einladungslink öffnen.** Ist die Person nicht angemeldet, landet sie bei **Anmelden** und
   nach der Anmeldung wieder bei der Einladung. Mit einem Token statt eines Links öffnet sie nach
   der Anmeldung **Einladung annehmen** (Adresse `/invitations/accept`) und fügt das
   **Einladungs-Token** ein.
3. Wähle **Einladung annehmen**.

**Erwartetes Ergebnis:** „Einladung angenommen. Du hast jetzt Zugriff.“ Die Person sieht jetzt das
Produkt und den Mandanten entsprechend ihrer Rolle. Es kann einen Moment dauern, bis der Zugriff
überall sichtbar ist.

**Prüfen (du):** Im Tab **Mitglieder** des Mandanten steht die Person mit der Rolle **Owner**. Unter
**Einladungen** ist der Status **Angenommen**.

> [!WARNING]
> Einladungen sind an die Adresse gebunden. Meldet sich die Person mit einer anderen Adresse an,
> scheitert das Annehmen mit **Nicht erlaubt**. Eine angenommene, widerrufene oder abgelaufene
> Einladung lässt sich nicht noch einmal verwenden: Lege eine neue an.

## Schritt 6: Rollen bei Bedarf anpassen {#change-role}

Wähle im Tab **Mitglieder** in der Liste **Rolle** des Mitglieds eine neue Rolle; Studio bestätigt
mit „Rolle geändert“. Um den Zugriff zu entziehen, wähle **Mitglied entfernen**. Mitglieder, deren
Rolle über deiner eigenen liegt (gekennzeichnet mit „Über deiner eigenen Rolle“), kannst du weder
ändern noch entfernen.

## Schritt 7: Den API-Schlüssel für die Integration anlegen {#integration-key}

Die Integration des Kunden (zum Beispiel sein ERP-Abgleich) erhält einen eigenen Schlüssel, der an
seinen Mandanten gebunden ist.

1. Öffne [API-Schlüssel](app:apiKeys) und wähle **Neuer API-Schlüssel**.
2. **Name**: Sag, wer ihn wo verwendet, zum Beispiel `acme erp-sync production`.
3. **Mandantenbindung**: **Acme Ltd**. Ein an einen Mandanten gebundener Schlüssel kann andere
   Mandanten weder sehen noch ändern.
4. **Berechtigungen**: nur, was die Integration braucht, zum Beispiel `records:read` und
   `records:write` für einen Datenabgleich, dazu `events:publish`, wenn sie Ereignisse
   veröffentlicht.
5. Wähle **Schlüssel anlegen**, kopiere das **Geheimnis des API-Schlüssels**, bestätige **Ich habe
   das Geheimnis sicher gespeichert** und wähle **Fertig**.

Übergib das Geheimnis dem technischen Ansprechpartner des Kunden über einen sicheren Kanal (zum
Beispiel einen gemeinsamen Secret-Manager), nie per einfacher E-Mail. Die Integration sendet es als
`Authorization: Bearer axk_…`. Teste es wie in den [ersten Schritten](help:first-steps#try-api-key).

> [!CAUTION]
> Das Geheimnis kann nicht erneut angezeigt werden. Geht es verloren oder wird es bekannt, verwende
> **Geheimnis erneuern** (mit Übergangsfrist für einen Wechsel ohne Ausfall) oder **Schlüssel
> widerrufen**. Siehe [API-Schlüssel](help:api-keys).

## Schritt 8: Das Audit-Protokoll prüfen {#check-audit}

1. Öffne das [Audit-Protokoll](app:audit).
2. Setze **Produkt** auf dein Produkt. Gib optional `tenancy.*` unter **Aktion** ein, um nur
   Mandanten- und Mitgliederereignisse zu sehen, oder gib die Mandanten-ID unter **Mandanten-ID**
   ein (auf kleinen Bildschirmen unter **Weitere Filter**).
3. Wähle **Filter anwenden**.

**Erwartetes Ergebnis**, neueste zuerst:

| Aktion                      | Akteur                       | Bedeutung                                                                       |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `access.api_key.create`     | du                           | Der Integrationsschlüssel wurde angelegt.                                       |
| `tenancy.invitation.accept` | der Administrator des Kunden | Die Einladung wurde angenommen.                                                 |
| `tenancy.member.set`        | du                           | Ein Mitglied wurde hinzugefügt oder eine Rolle geändert (bei Schritt 4 oder 6). |
| `tenancy.invitation.create` | du                           | Eines pro Einladung.                                                            |
| `tenancy.tenant.create`     | du                           | Der Mandant wurde angelegt.                                                     |

Alle mit dem Ergebnis **Erfolgreich**. Ein Annahmeversuch mit dem falschen Konto erscheint als
`tenancy.invitation.accept` mit dem Ergebnis **Abgelehnt**.

## Checkliste für das Onboarding {#checklist}

1. Mandant angelegt, ID notiert.
1. Administrator als **Owner** eingeladen, Einladung angenommen, sichtbar unter **Mitglieder**.
1. Mitarbeitende mit den geplanten Rollen hinzugefügt oder eingeladen; alle Einladungen **Angenommen**.
1. Integrationsschlüssel angelegt, an den Mandanten gebunden, minimale Berechtigungen, Geheimnis sicher übergeben.
1. Das Audit-Protokoll zeigt die erwarteten Ereignisse.
1. Optional: Abonnement zugewiesen (siehe [Tarife und Abonnements](help:plans-subscriptions)).

## Wenn der Kunde geht {#offboarding}

- Zuerst **Mandant sperren**: Mitglieder und mandantengebundene Schlüssel verlieren den Zugriff,
  es werden keine Daten gelöscht, und du kannst den Mandanten wieder aktivieren.
- **Widerrufe** den Integrationsschlüssel.
- **Mandant löschen** nur, wenn die Daten weg müssen; das löscht den Mandanten mit all seinen Daten
  und lässt sich nicht rückgängig machen. Siehe [Mandanten](help:tenants).

## Fehlerbehebung {#troubleshooting}

| Problem                                                 | Ursache und Lösung                                                                                                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Owner** lässt sich nicht auswählen                    | Dir fehlt der Owner-Rang oder ein Teil der Berechtigungen der Rolle (Rollenobergrenze). Frag einen Product owner oder einen Plattform-Administrator.                                                   |
| **Konflikt** beim Einladen                              | Für diese Adresse gibt es in diesem Mandanten bereits eine offene Einladung. Verwende oder widerrufe sie.                                                                                              |
| **Benutzer nicht gefunden** bei **Mitglied hinzufügen** | Kein für dich sichtbares Konto hat diese Adresse. Verwende **Stattdessen einladen**.                                                                                                                   |
| Der Kunde erhält keine E-Mail                           | Das Modul `notify` ist aus, oder die Zustellung ist fehlgeschlagen. Schick Link oder Token selbst; prüfe die [Benachrichtigungen](help:notifications).                                                 |
| Der Link öffnet „Seite nicht gefunden“                  | Die Produkteinstellung `invitation_accept_url` fehlt oder ist falsch (siehe [Zustellung](help:tutorial-onboard-customer#delivery)). Schick das Token und lass es unter `/invitations/accept` einfügen. |
| Das Annehmen scheitert mit **Nicht erlaubt**            | Die Person ist mit einem Konto angemeldet, dessen E-Mail-Adresse von der eingeladenen abweicht. Melde dich mit dem richtigen Konto an oder lade die tatsächliche Adresse ein.                          |
| Das Annehmen scheitert mit **Nicht gefunden**           | Die Einladung wurde bereits angenommen, widerrufen oder ist älter als 7 Tage. Lege eine neue Einladung an.                                                                                             |
| Single Sign-on scheitert mit „kein Konto“               | Keine offene Einladung für die bestätigte Adresse, und die Registrierung ist aus. Prüfe die eingeladene Adresse; siehe [Anmelden](help:signing-in#sso-errors).                                         |
| Die Integration erhält `403`                            | Dem Schlüssel fehlt eine Berechtigung, oder der Mandant ist gesperrt.                                                                                                                                  |
| Keine Ereignisse im Audit-Protokoll                     | Prüfe den Filter **Produkt** und ob du `audit:read` hast.                                                                                                                                              |
