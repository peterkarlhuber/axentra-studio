---
title: Ersteinrichtung
summary: Lege mit einem einmaligen Einrichtungs-Token den ersten Plattform-Administrator eines neuen Axentra-Servers an.
keywords: Einrichtung, Installation, Ersteinrichtung, erster Start, Bootstrap, Einrichtungs-Token, Setup-Token, erster Admin, Plattform-Administrator, Onboarding, Axentra einrichten
---

Ein neuer Axentra-Server hat noch keinen Administrator. Solange das so ist, meldet der Server
„Einrichtung erforderlich“, und Studio zeigt statt der Anmeldeseite die Seite **Axentra einrichten**.
Dort legst du den ersten **Plattform-Administrator** an: das Konto mit voller Kontrolle über die
Installation. Dafür brauchst du ein **Einrichtungs-Token** von der Person, die den Server betreibt.

## Bevor du beginnst {#before-you-start}

> [!IMPORTANT]
>
> - Der Axentra-Server läuft, und Studio kann ihn erreichen.
> - Noch niemand hat die Einrichtung abgeschlossen. Die Seite ist nur verfügbar, bis der erste
>   Plattform-Administrator existiert.
> - Jemand mit Shell-Zugriff auf den Server kann den Befehl `axentra` ausführen.

## Ein Einrichtungs-Token erzeugen {#setup-token}

Das Einrichtungs-Token belegt, dass du den neuen Server übernehmen darfst. Es wird auf dem Server
selbst erzeugt, sodass nur jemand, der den Server kontrolliert, es weitergeben kann.

1. Führe auf dem Server (oder im Container des Servers) aus:

   ```bash
   axentra admin setup-token
   ```

2. Der Befehl gibt ein Token aus, das mit `axsetup_` beginnt. Kopiere es.

| Eigenschaft   | Wert                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gültigkeit    | Standardmäßig 60 Minuten (Betreibereinstellung `security.setup_token_ttl_minutes`, mindestens 5).                                                                          |
| Verwendung    | Einmalig. Ein verwendetes Token funktioniert nicht mehr.                                                                                                                   |
| Verfügbarkeit | Nur solange kein Plattform-Administrator existiert. Gibt es bereits einen, meldet der Befehl „setup is already complete (a platform admin exists)“ und erzeugt kein Token. |

Solange die Einrichtung noch offen ist, kannst du jederzeit ein neues Token erzeugen; ältere, nicht
verwendete Token bleiben bis zu ihrem Ablauf gültig.

> [!CAUTION]
> Das Einrichtungs-Token gewährt demjenigen, der es zuerst verwendet, volle Kontrolle über den Server.
> Gib es nur der Person, die den ersten Administrator anlegt, und zwar über einen privaten Kanal.
> Erzeuge lieber ein neues Token, statt ein altes per E-Mail weiterzuleiten.

## Den ersten Administrator anlegen {#create-admin}

1. Öffne Studio im Browser. **Axentra einrichten** erscheint automatisch.
2. Wähle optional deine Sprache mit der Sprachauswahl unter dem Formular.
3. Fülle das Formular aus:

   | Feld                     | Was du eingibst                                                                                 |
   | ------------------------ | ----------------------------------------------------------------------------------------------- |
   | **Einrichtungs-Token**   | Das Token vom Server, zum Beispiel `axsetup_EXAMPLE…`.                                          |
   | **Vollständiger Name**   | Dein Name, wie andere Administratoren ihn sehen.                                                |
   | **E-Mail-Adresse**       | Die Adresse, mit der du dich anmelden wirst.                                                    |
   | **Passwort**             | Ein langes, einmaliges Passwort (siehe [Passwortregeln](help:first-run-setup#password-policy)). |
   | **Passwort wiederholen** | Dasselbe Passwort noch einmal.                                                                  |

4. Wähle **Administrator anlegen**.

**Erwartetes Ergebnis:** Studio meldet **Einrichtung abgeschlossen** („Du bist jetzt als
Plattform-Administration angemeldet.“) und öffnet Studio. Im Mehrproduktbetrieb ohne vorhandenes
Produkt landest du unter **Produkte** mit dem Hinweis, das erste Produkt anzulegen; im
Einzelproduktbetrieb landest du im Dashboard des einen Produkts des Servers.

## Passwortregeln {#password-policy}

Der Server prüft das Passwort und lehnt es ab, wenn es gegen eine dieser Regeln verstößt:

| Regel                    | Standard                                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| Mindestlänge             | 12 Zeichen (Betreibereinstellung `security.password_min_length`, mindestens 8).                    |
| Höchstlänge              | 1024 Zeichen.                                                                                      |
| Nicht die E-Mail-Adresse | Das Passwort darf nicht der E-Mail-Adresse entsprechen (ohne Beachtung der Groß-/Kleinschreibung). |
| Nicht trivial            | Mindestens 4 verschiedene Zeichen.                                                                 |

Passwörter werden als Argon2id-Hashes gespeichert; niemand, auch nicht der Betreiber, kann sie
zurücklesen.

## Nach der Einrichtung {#after-setup}

- Die Einrichtungsseite ist nicht mehr erreichbar; `/setup` führt zur Anmeldeseite.
- Dein Konto hat die Rolle **Plattform-Administration**. Das Ereignis `identity.setup.complete` steht
  im [Audit-Protokoll](help:audit).
- Deine Sitzung funktioniert wie jede andere Anmeldesitzung (siehe
  [Anmelden](help:signing-in#session-end)).

Nächste Schritte:

1. Lege dein erstes Produkt und deinen ersten Mandanten an: [erste Schritte](help:first-steps).
2. Gib einer zweiten vertrauenswürdigen Person die Rolle Plattform-Administration, damit die
   Installation nicht von einem einzigen Konto abhängt (siehe [Benutzer](help:users)). Diese Person
   braucht zuerst ein Konto, zum Beispiel über [Single Sign-on](help:signing-in#sso).
3. Soll der Server ausschließlich Single Sign-on verwenden, kann der Betreiber die Passwortanmeldung
   später abschalten (`security.password_login = false`).

## Fehlerbehebung {#troubleshooting}

| Meldung                                                                                                                                                                                | Ursache                                                                                                                   | Was zu tun ist                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Einrichtungs-Token nicht akzeptiert**                                                                                                                                                | Das Token ist falsch eingegeben, abgelaufen (standardmäßig älter als 60 Minuten) oder bereits verwendet.                  | Erzeuge mit `axentra admin setup-token` ein neues Token und füge es ohne Leerzeichen ein.                |
| **Die Einrichtung ist bereits abgeschlossen**                                                                                                                                          | Jemand hat zwischenzeitlich einen Plattform-Administrator angelegt.                                                       | Melde dich mit diesem Konto an oder bitte seinen Inhaber um Zugriff. Studio führt dich zur Anmeldeseite. |
| **Die Passwörter stimmen nicht überein.**                                                                                                                                              | **Passwort** und **Passwort wiederholen** unterscheiden sich.                                                             | Gib beide erneut ein.                                                                                    |
| **Bitte prüfe deine Eingaben** mit der Servermeldung „the password must have at least … characters“, „the password must not equal the email address“ oder „the password is too simple“ | Die [Passwortregeln](help:first-run-setup#password-policy) wurden nicht eingehalten.                                      | Wähle ein längeres Passwort mit mehr verschiedenen Zeichen.                                              |
| **Bitte prüfe deine Eingaben** mit „invalid email address“                                                                                                                             | Die E-Mail-Adresse ist ungültig.                                                                                          | Korrigiere die Adresse.                                                                                  |
| **Konflikt** mit der Servermeldung „a user with this email address exists“                                                                                                             | Ein Konto mit dieser E-Mail-Adresse existiert bereits (zum Beispiel eines, das von Bibliothekscode angelegt wurde).       | Verwende eine andere Adresse oder wende dich an den Betreiber.                                           |
| **Zu viele Anfragen**                                                                                                                                                                  | Zu viele Einrichtungsversuche aus deinem Netzwerk innerhalb einer Minute (das Anmeldelimit, standardmäßig 10 pro Minute). | Warte eine Minute und versuche es erneut.                                                                |
| Studio zeigt die Anmeldeseite statt der Einrichtungsseite                                                                                                                              | Es existiert bereits ein Plattform-Administrator.                                                                         | Melde dich an oder bitte einen vorhandenen Administrator um ein Konto.                                   |
| **Keine Verbindung zu Axentra**                                                                                                                                                        | Studio kann den Server nicht erreichen.                                                                                   | Prüfe den Server und die API-Adresse von Studio gemeinsam mit dem Betreiber.                             |
