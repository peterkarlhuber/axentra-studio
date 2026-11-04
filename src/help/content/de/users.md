---
title: Benutzer
summary: Finde die Personen mit Zugriff auf ein Produkt, prüfe Profil und Sitzungen, melde sie ab, deaktiviere Konten und vergib Plattformrollen.
keywords: Benutzer, Konto, Person, Personen, Benutzer deaktivieren, sperren, überall abmelden, Sitzungen, Plattformrolle, Plattform-Administrator, Plattform-Leserecht, keine E-Mail
---

Ein **Benutzer** ist das Konto einer Person auf dem Axentra-Server. Konten gelten installationsweit:
Ein Konto kann in einem Produkt produktverantwortlich und in mehreren anderen Mitglied von Mandanten
sein. Was ein Benutzer tun darf, ergibt sich aus drei Quellen:

- einer **Plattformrolle** (installationsweit, selten),
- einer **Produktrolle**, wenn der Benutzer zu den Produktverantwortlichen eines Produkts gehört
  (siehe [Produkte](help:products#members)),
- einer **Mandantenrolle** in jedem Mandanten, in dem der Benutzer Mitglied ist (siehe
  [Mitglieder und Einladungen](help:members-invitations)).

Die Seite [Benutzer](app:users) listet die Benutzer des aktuellen Produkts: seine
Produktverantwortlichen und die Mitglieder seiner Mandanten.

> [!IMPORTANT]
> Die Seite **Benutzer** erfordert `product_users:read` (Product owner, Product admin, Support und
> Product viewer; Plattform-Administration und Plattform-Leserecht). Benutzer deaktivieren, ihre
> Sitzungen beenden und ihre Sitzungen sehen erfordert die Plattformberechtigung `users:manage`, die
> nur Plattform-Administratoren haben. Plattformrollen ändern nur Plattform-Administratoren.

## Einen Benutzer finden {#find}

Öffne [Benutzer](app:users). Mit **Benutzer suchen** filterst du nach Name oder E-Mail-Adresse, mit
dem Filter **Status** zeigst du **Aktiv** oder **Deaktiviert** an. Wähle einen Namen, um die Seite des
Benutzers zu öffnen.

Studio legt keine Konten an. Konten entstehen, wenn der erste Administrator die Ersteinrichtung
abschließt, wenn sich jemand zum ersten Mal per Single Sign-on anmeldet (sofern die Einstellungen des
Identitätsanbieters die Registrierung erlauben oder eine Einladung für diese E-Mail-Adresse offen ist)
oder durch Produktcode, der Axentra einbettet. Siehe [Anmelden](help:signing-in).

## Die Benutzerseite {#profile}

Die Karte **Profil** zeigt:

| Feld                               | Bedeutung                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| **Name**, **E-Mail-Adresse**       | Aus dem Konto. Benutzer bearbeiten ihren eigenen Namen in ihrem Profil.              |
| **Status**                         | **Aktiv** oder **Deaktiviert**.                                                      |
| **Sprache**                        | Die Oberflächensprache des Benutzers.                                                |
| **Plattformrolle**                 | **Keine Plattformrolle**, **Plattform-Leserecht** oder **Plattform-Administration**. |
| **Passwort-Anmeldung**             | **Passwort gesetzt** oder **Kein Passwort (nur Single Sign-on)**.                    |
| **Letzte Anmeldung**, **Erstellt** | Zeitstempel.                                                                         |

Die Benutzerseite listet die Mitgliedschaften des Benutzers nicht auf. Um zu sehen oder zu ändern, was
ein Benutzer in einem Mandanten tun darf, öffne den Tab **Mitglieder** des Mandanten; bei
Produktverantwortlichen den Tab **Mitglieder** des Produkts.

### Benutzer ohne E-Mail-Adresse {#no-email}

Manche Konten haben keine E-Mail-Adresse, zum Beispiel wenn ein Identitätsanbieter keine bestätigt hat
und der Server solche Registrierungen erlaubt. Studio zeigt dann statt der Adresse die ID des
Benutzers. Solche Benutzer:

- melden sich nur per Single Sign-on an, nie mit Passwort;
- können keine Einladungen annehmen, weil Einladungen an eine Adresse gebunden sind;
- können trotzdem direkt zu Mandanten hinzugefügt werden, und zwar von jemandem, der sie sehen kann
  (zum Beispiel von einem Plattform-Administrator).

## Einen Benutzer überall abmelden {#sign-out}

1. Öffne die Seite des Benutzers.
2. Wähle **Überall abmelden** und bestätige.

Alle Sitzungen des Benutzers enden sofort, auf jedem Gerät. Der Benutzer kann sich erneut anmelden.
Nutze das, wenn ein Gerät verloren gegangen ist oder eine Sitzung kompromittiert sein könnte. **Aktive
Sitzungen** auf derselben Seite listet jede Sitzung mit Gerät, **Anmeldeart**, **Zuletzt aktiv** und
**Läuft ab**.

## Einen Benutzer deaktivieren {#disable}

1. Öffne die Seite des Benutzers.
2. Wähle **Benutzer deaktivieren**.
3. Tippe zur Bestätigung die E-Mail-Adresse des Benutzers ein (oder die ID bei Benutzern ohne
   Adresse) und wähle **Benutzer deaktivieren**.

Ein deaktivierter Benutzer kann sich weder per Passwort noch per Single Sign-on anmelden, und alle
seine Sitzungen enden sofort. Mitgliedschaften, Plattformrolle und Audit-Verlauf bleiben erhalten,
sodass **Benutzer aktivieren** den bisherigen Zugriff wiederherstellt.

> [!WARNING]
> API-Schlüssel, die ein Benutzer erstellt hat, funktionieren nicht mehr, sobald er deaktiviert wird
> oder die Berechtigungen verliert, die die Schlüssel verwenden: Anfragen werden mit
> `api_key_creator_lost_access` abgelehnt (siehe
> [API-Schlüssel](help:api-keys#creator-permissions)). Die Schlüssel werden nicht widerrufen und
> funktionieren wieder, wenn der Zugriff zurückkommt. Wenn jemand ausscheidet, erstelle
> Ersatzschlüssel als jemand, der bleibt, stelle die Dienste um und widerrufe die alten Schlüssel.

Du kannst dich nicht selbst deaktivieren, und der letzte aktive Plattform-Administrator kann nicht
deaktiviert werden.

## Eine Plattformrolle ändern {#platform-role}

Plattformrollen gelten für **jedes Produkt** auf dem Server, unabhängig von Mitgliedschaften.

| Plattformrolle               | Bedeutung                                                                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Keine Plattformrolle**     | Zugriff nur über Produkt- und Mandantenmitgliedschaften.                                                                                                            |
| **Plattform-Leserecht**      | Nur Lesezugriff auf jedes Produkt, einschließlich archivierter Produkte und gesperrter Mandanten, auf die Einstellungen und das installationsweite Audit-Protokoll. |
| **Plattform-Administration** | Volle Kontrolle über die gesamte Installation: alle Produkte und Benutzer, Produkte anlegen und archivieren, keine Rollenobergrenze.                                |

1. Öffne die Seite des Benutzers. Die Karte **Plattformrolle** sehen nur Plattform-Administratoren.
2. Wähle die neue **Plattformrolle**.
3. Wähle **Plattformrolle ändern** und bestätige. Um **Plattform-Administration** zu vergeben, musst
   du die E-Mail-Adresse (oder ID) des Benutzers eintippen.

> [!CAUTION]
> Ein Plattform-Administrator kann auf dem Server alles tun, einschließlich Mandanten löschen und
> Schlüssel in jedem Produkt anlegen. Vergib diese Rolle an so wenige Personen wie möglich. Der letzte
> Plattform-Administrator kann die Rolle nicht verlieren.

## Fehlerbehebung {#troubleshooting}

**Nicht erlaubt auf der Seite Benutzer.** Dir fehlt in diesem Produkt `product_users:read`.
Mandanten-Owner und -Mitglieder haben diese Berechtigung nicht; sie sehen ihre Kolleginnen und
Kollegen auf dem Tab **Mitglieder** des Mandanten.

**Keine Buttons Benutzer deaktivieren oder Überall abmelden.** Diese erfordern `users:manage`, das nur
Plattform-Administratoren haben.

**Konflikt: „you cannot disable yourself“.** Wende dich an einen anderen Plattform-Administrator.

**Konflikt: „the last platform admin cannot be disabled“ / „the last platform admin cannot lose
the role“.** Mache zuerst einen anderen Benutzer zum Plattform-Administrator.

**Nicht erlaubt: „only platform admins can change platform roles“.** Wende dich an einen
Plattform-Administrator.

**Ein Benutzer fehlt in der Liste.** Der Benutzer gehört weder zu den Produktverantwortlichen dieses
Produkts noch ist er Mitglied eines seiner Mandanten. Füge ihn hinzu oder lade ihn ein, siehe
[Mitglieder und Einladungen](help:members-invitations).

**Ein deaktivierter Benutzer erscheint weiterhin in Mandanten.** Das Deaktivieren entfernt keine
Mitgliedschaften. Entferne sie auf dem Tab **Mitglieder** des Mandanten, wenn der Zugriff nach einer
erneuten Aktivierung nicht zurückkehren soll.
