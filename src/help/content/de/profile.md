---
title: Dein Profil
summary: Konto und Mitgliedschaften ansehen, Anzeigenamen und Passwort ändern und Browser abmelden, die du nicht mehr verwendest.
keywords: Profil, Konto, mein Konto, Anzeigename, Name, Passwort, Passwort ändern, Passwort festlegen, Sitzungen, Geräte, abmelden, überall abmelden, Single Sign-on, SSO
---

In deinem **Profil** verwaltest du dein eigenes Konto: den Namen, den andere sehen, dein Passwort
und die Browser, in denen du angemeldet bist. Es zeigt außerdem, zu welchen Produkten du mit
welcher Rolle gehörst. Jeder angemeldete Benutzer hat ein Profil; eine Berechtigung ist nicht
nötig.

Öffne es im Benutzermenü oben rechts über **Profil** ([öffnen](app:profile)). Sprache und
Darstellung findest du auf der Seite [Einstellungen](help:settings#preferences) und im selben
Benutzermenü.

## Dein Konto prüfen {#account}

Die Karte **Konto** zeigt:

| Feld               | Bedeutung                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **E-Mail-Adresse** | Die Adresse, mit der du dich anmeldest. Du kannst sie nicht selbst ändern                                  |
| **Benutzer-ID**    | Deine ID (`usr_…`), zum Beispiel um das [Audit-Protokoll](help:audit#filter) nach **Akteur-ID** zu filtern |
| **Plattformrolle** | `platform_admin` oder `platform_viewer`, falls du eine hast, sonst **Keine**                               |
| **Produkte**       | Jedes Produkt, zu dem du gehörst, mit deiner Produktrolle (zum Beispiel **Acme CRM · product_admin**)      |

Mandantenmitgliedschaften stehen nicht hier, sondern auf den Seiten der Mandanten. Für eine andere
Rolle wende dich an einen Product owner oder einen Plattform-Administrator; siehe
[Rollen und Berechtigungen](help:roles-permissions).

## Deinen Anzeigenamen ändern {#name}

1. Ändere unter **Anzeigename** im Feld **Name** deinen Namen (bis zu 200 Zeichen).
2. Wähle **Änderungen speichern**. Die Schaltfläche ist nur aktiv, wenn sich der Name vom
   gespeicherten unterscheidet.

Der Name erscheint im Benutzermenü, in Mitgliederlisten und als **Akteur** deiner Aktionen im
Audit-Protokoll. Frühere Audit-Ereignisse behalten den Namen, den du beim Festhalten hattest.

## Dein Passwort ändern {#password}

1. Gib unter **Passwort ändern** dein **Aktuelles Passwort** ein.
2. Gib das neue Passwort zweimal ein (**Neues Passwort** und **Neues Passwort wiederholen**).
3. Wähle **Passwort ändern**.

> [!WARNING]
> Eine Passwortänderung **meldet dich sofort in allen anderen Browsern und auf allen anderen Geräten
> ab**. Der Browser, den du gerade verwendest, bleibt angemeldet. Nutze das, wenn du vermutest, dass
> jemand anderes dein Passwort kennt.

Für das neue Passwort gilt:

- mindestens so lang wie das Minimum des Servers (Standard 12 Zeichen, siehe
  `password_min_length` unter [Einstellungen](help:settings#settings-tree)) und höchstens
  1024 Zeichen lang,
- nicht deine E-Mail-Adresse,
- mindestens 4 verschiedene Zeichen.

### Ein erstes Passwort festlegen (Single-Sign-on-Benutzer) {#set-password}

Hast du dich bisher nur per Single Sign-on angemeldet, heißt die Karte **Passwort festlegen** und
hat kein Feld **Aktuelles Passwort**. Mit einem Passwort kannst du dich zusätzlich mit E-Mail und
Passwort anmelden.

Zu deiner Sicherheit lässt sich ein erstes Passwort nur **kurz nach deiner Anmeldung** festlegen
(Standard: innerhalb von 5 Minuten; der Betreiber legt das mit `security.fresh_login_minutes`
fest). Ist deine Anmeldung älter, zeigt Studio **Bitte melde dich erneut an**:

1. Wähle **Erneut anmelden**. Studio meldet dich ab und öffnet die Anmeldeseite.
2. Melde dich an. Du kommst zurück zu deinem Profil.
3. Gib innerhalb der nächsten Minuten unter **Neues Passwort** das neue Passwort zweimal ein und
   wähle **Passwort festlegen**.

> [!NOTE]
> Der Betreiber kann das ausschalten (`security.first_password = "disabled"`). Dann können
> Benutzer, die sich per Single Sign-on anmelden, überhaupt kein Passwort festlegen, und der Server
> lehnt mit **Nicht erlaubt** ab.

## Sehen, wo du angemeldet bist {#sessions}

**Deine Sitzungen** listet jeden Browser und jedes Gerät mit einer aktiven Sitzung:

| Spalte            | Bedeutung                                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gerät**         | Browser und Betriebssystem (aus dem User-Agent des Browsers) und die IP-Adresse. **Diese Sitzung** kennzeichnet den Browser, den du gerade verwendest |
| **Anmeldeart**    | `password` oder `oidc:<provider>` bei Single Sign-on                                                                                                  |
| **Zuletzt aktiv** | Die letzte Anfrage dieser Sitzung                                                                                                                     |
| **Läuft ab**      | Wann die Sitzung spätestens endet                                                                                                                     |

Eine Sitzung endet, wenn sie ihre maximale Lebensdauer erreicht (Standard 12 Stunden), nach einer
Zeit ohne Aktivität (Standard 120 Minuten), wenn du dich abmeldest, wenn sie beendet wird, wenn du
dein Passwort änderst (alle anderen Sitzungen) oder wenn ein Administrator dein Konto deaktiviert.

### Einen nicht mehr genutzten Browser abmelden {#revoke-session}

1. Suche den Browser unter **Deine Sitzungen**.
2. Wähle **Sitzung beenden** (das Papierkorbsymbol am Ende der Zeile).

Dieser Browser wird mit seiner nächsten Anfrage abgemeldet. Deine aktuelle Sitzung hat keine
Schaltfläche zum Beenden; verwende dafür **Abmelden** im Benutzermenü.

### Überall sonst abmelden {#sign-out-elsewhere}

Um alle Sitzungen außer der aktuellen zu beenden, wähle **Alle anderen Sitzungen abmelden** im Kopf
von **Deine Sitzungen**. Die Schaltfläche erscheint, sobald mindestens eine andere Sitzung
existiert.

> [!TIP]
> Auf einem gemeinsam genutzten oder verlorenen Computer angemeldet? Beende diese Sitzung hier.
> Glaubst du, dass jemand anderes dein Passwort kennt, ändere es: Das meldet auch alle anderen
> Sitzungen ab.

Administratoren können die Sitzungen anderer Benutzer auf der Seite [Benutzer](help:users) beenden.

## Fehlerbehebung {#troubleshooting}

- **Nicht erlaubt** nach **Passwort ändern**: Das Passwort unter **Aktuelles Passwort** ist falsch. Der Server
  hält den Versuch im Audit-Protokoll als **Abgelehnt** fest.
- **Bitte prüfe deine Eingaben**: Das neue Passwort verletzt eine der Regeln oben (zu kurz, gleich
  deiner E-Mail-Adresse, zu einfach). **Technische Details** in der Meldung zeigen den Grund des
  Servers, zum Beispiel „the password must have at least 12 characters“.
- **Die neuen Passwörter stimmen nicht überein.**: **Neues Passwort** und **Neues Passwort
  wiederholen** unterscheiden sich.
- **Bitte melde dich erneut an** beim Festlegen eines ersten Passworts: Deine Anmeldung ist zu alt.
  Folge den Schritten unter [Ein erstes Passwort festlegen](#set-password).
- **Nicht erlaubt** beim Festlegen eines ersten Passworts: Der Server erlaubt keine Passwörter für
  Single-Sign-on-Benutzer, oder dein Konto hat keine E-Mail-Adresse. Melde dich weiter per Single
  Sign-on an.
- Du wurdest unerwartet abgemeldet: Deine Sitzung ist abgelaufen, war zu lange inaktiv oder wurde
  beendet (zum Beispiel, weil du dein Passwort anderswo geändert hast). Melde dich erneut an; Studio
  bringt dich zurück zur Seite, auf der du warst.
