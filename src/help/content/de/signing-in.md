---
title: An- und Abmelden
summary: Melde dich mit Passwort oder Single Sign-on an, erfahre, wann eine Sitzung endet, und behebe Anmeldeprobleme.
keywords: Login, einloggen, anmelden, Logout, ausloggen, abmelden, Passwort, Kennwort, SSO, Single Sign-on, OIDC, OpenID Connect, Identitätsanbieter, Keycloak, Entra ID, Google, Sitzung, abgelaufen, Zeitüberschreitung, Sprache, zurückkehren
---

Studio arbeitet mit deinem persönlichen Konto auf dem Axentra-Server. Wenn du dich anmeldest,
startet der Server eine **Sitzung** für deinen Browser; Studio handelt dann mit deinen Rollen, bis
die Sitzung endet. Je nach Serverkonfiguration meldest du dich mit E-Mail-Adresse und Passwort, per
**Single Sign-on** über den Identitätsanbieter deiner Organisation oder auf beide Arten an.

## Mit E-Mail und Passwort anmelden {#password}

1. Öffne Studio. Wenn du nicht angemeldet bist, erscheint die Seite **Anmelden**.
2. Gib deine **E-Mail-Adresse** und dein **Passwort** ein.
3. Wähle **Anmelden**.

**Erwartetes Ergebnis:** Studio öffnet die Seite, von der du gekommen bist, oder das Dashboard des
zuletzt verwendeten Produkts. Hast du noch kein Produkt, landest du unter **Produkte**.

Das Formular wird nur angezeigt, wenn der Server die Passwortanmeldung erlaubt. Konten, die per
Single Sign-on angelegt wurden, haben kein Passwort und können das Formular nicht verwenden; für ein
solches Konto kannst du in deinem [Profil](help:profile) ein Passwort festlegen, sofern der Server
das erlaubt.

## Mit Single Sign-on anmelden {#sso}

Hat der Betreiber einen Identitätsanbieter angebunden (OpenID Connect, zum Beispiel Keycloak,
Microsoft Entra ID, Google oder Auth0), zeigt die Anmeldeseite unter dem Passwortformular und dem
Wort **oder** für jeden Anbieter einen Button **Weiter mit …**.

1. Wähle **Weiter mit** _deinem Anbieter_.
2. Melde dich wie gewohnt bei deinem Identitätsanbieter an (einschließlich eines eventuell
   geforderten zweiten Faktors).
3. Der Anbieter schickt dich angemeldet zurück zu Studio.

Gut zu wissen:

- Die Mehr-Faktor-Authentifizierung übernimmt dein Identitätsanbieter, nicht Axentra.
- Bei deinem ersten Single Sign-on verknüpft Axentra die Anmeldung mit einem vorhandenen Konto mit
  derselben, **verifizierten** E-Mail-Adresse oder legt ein neues Konto an, wenn der Anbieter die
  Registrierung erlaubt oder eine offene [Einladung](help:members-invitations) für deine Adresse existiert.
- Ein neues Konto erhält von sich aus keinen Zugriff. Produkte und Mandanten siehst du erst, wenn dir
  jemand eine Rolle gibt oder du eine Einladung annimmst.

## Dort weitermachen, wo du aufgehört hast {#return-to}

Endet deine Sitzung während der Arbeit oder öffnest du im abgemeldeten Zustand einen Link zu einer
Studio-Seite, schickt dich Studio zur Anmeldeseite und merkt sich die Seite. Die Anmeldeseite zeigt
dann **Bitte melde dich an, um dort weiterzumachen, wo du aufgehört hast.** Nach der Anmeldung (per
Passwort oder Single Sign-on) bist du wieder auf dieser Seite, einschließlich ihrer Filter in der
Adresse.

Aus Sicherheitsgründen kehrt Studio nur zu eigenen Seiten zurück; jedes andere Ziel führt zur
Startseite.

> [!WARNING]
> Nicht gespeicherte Eingaben in einem offenen Formular gehen verloren, wenn die Sitzung endet.
> Speichere bei längeren Bearbeitungen zwischendurch.

## Wann eine Sitzung endet {#session-end}

| Die Sitzung endet …                                       | Standard                                      |
| --------------------------------------------------------- | --------------------------------------------- |
| Nach ihrer maximalen Lebensdauer, auch wenn du aktiv bist | 12 Stunden (`security.session_ttl_hours`)     |
| Nach einer Zeit ohne jede Anfrage                         | 120 Minuten (`security.session_idle_minutes`) |
| Wenn du dich abmeldest                                    | Sofort                                        |
| Wenn du oder ein Administrator sie widerruft              | Bei der nächsten Anfrage                      |
| Wenn dein Konto deaktiviert wird                          | Sofort, alle Sitzungen                        |
| Wenn du dein Passwort änderst                             | Alle deine **anderen** Sitzungen              |

Die Werte legt der Serverbetreiber fest. Deine aktiven Sitzungen (Browser und Geräte) sind in deinem
[Profil](help:profile) aufgeführt, wo du sie auch beenden kannst.

Manche sicherheitsrelevanten Aktionen erfordern eine **kürzlich erfolgte** Anmeldung. Antwortet der
Server mit **Bitte melde dich erneut an**, meldet Studio dich ab; nach der erneuten Anmeldung bist du
wieder auf derselben Seite und kannst die Aktion wiederholen.

> [!NOTE]
> Single Sign-on **startet** nur eine Axentra-Sitzung. Wenn du dich von Studio abmeldest, wirst du
> nicht bei deinem Identitätsanbieter abgemeldet, und eine Abmeldung oder Sperre beim Anbieter beendet
> keine laufende Axentra-Sitzung; diese endet regulär nach Ablauf oder wenn ein Administrator das
> Konto deaktiviert.

## Abmelden {#sign-out}

1. Öffne das Benutzermenü oben rechts (deine Initialen und dein Name).
2. Wähle **Abmelden**.

Studio beendet die Sitzung auf dem Server, verwirft alle geladenen Daten und zeigt die Anmeldeseite.
Melde dich an einem gemeinsam genutzten Computer immer ab.

## Die Sprache vor der Anmeldung wählen {#language}

Die Anmeldeseite und die Einrichtungsseite haben unter dem Formular eine Sprachauswahl. Deine Wahl
gilt sofort und wird in diesem Browser gespeichert. Nach der Anmeldung kannst du die Sprache im
Benutzermenü (**Sprache**) oder unter **Einstellungen** ändern; dann wird sie auch in deinem Konto
gespeichert und gilt in anderen Browsern ebenfalls. Siehe [die Oberfläche](help:interface#language).

## Einstellungen {#settings}

Diese Servereinstellungen wirken sich auf die Anmeldung aus. Nur der Serverbetreiber kann sie ändern;
Studio zeigt die wirksamen Werte unter **Einstellungen**.

| Einstellung                      | Was sie bewirkt                                                                                    | Standard |
| -------------------------------- | -------------------------------------------------------------------------------------------------- | -------- |
| `security.password_login`        | Erlaubt die Anmeldung mit E-Mail und Passwort. Ist sie aus, wird nur Single Sign-on angeboten.     | an       |
| `security.login_rate_per_minute` | Erlaubte fehlgeschlagene Anmeldungen pro Konto und Minute (pro Netzwerkadresse: dreimal so viele). | 10       |
| `security.session_ttl_hours`     | Maximale Lebensdauer einer Sitzung.                                                                | 12       |
| `security.session_idle_minutes`  | Zeitlimit bei Inaktivität.                                                                         | 120      |
| `[[oidc]]`-Anbieter              | Single-Sign-on-Anbieter, die als **Weiter mit …** angezeigt werden.                                | keine    |

## Details für Administratoren {#details}

- Die Sitzung liegt in einem `HttpOnly`-Cookie; Studio speichert nie Token im Browserspeicher.
  Ändernde Anfragen benötigen zusätzlich ein CSRF-Token, das Studio im Arbeitsspeicher hält.
- Die Adresse von Studio muss die `security.public_url` des Servers sein oder in
  `security.allowed_origins` stehen; andernfalls werden Anmeldung und ändernde Anfragen mit `403`
  abgelehnt.
- Anmeldungen, fehlgeschlagene Anmeldungen (`identity.login` mit dem Ergebnis `denied`) und
  Abmeldungen werden ins [Audit-Protokoll](help:audit) geschrieben.
- Fehlgeschlagene Anmeldungen werden pro Konto gedrosselt. Wer eine Adresse kennt, kann deshalb die
  Passwortanmeldung für dieses Konto bis zu einer Minute lang blockieren.
- Single Sign-on verwendet den Authorization Code Flow mit PKCE. Die beim Anbieter zu registrierende
  Redirect-URI lautet `<public URL of the API>/v1/auth/oidc/<provider id>/callback`. Konfiguration:
  [Serverkonfiguration](help:server-configuration).

## Fehler beim Single Sign-on {#sso-errors}

Schlägt das Single Sign-on fehl, schickt dich der Server zurück zur Anmeldeseite, und Studio zeigt
**Single Sign-on nicht abgeschlossen** mit dem Grund an:

| Grund (Code)                                                                | Bedeutung                                                                                                                                    | Was zu tun ist                                                                                         |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Zu lange gedauert oder in einem anderen Browser gestartet (`login_expired`) | Die Anmeldung muss innerhalb von 10 Minuten im selben Browser abgeschlossen werden.                                                          | Beginne erneut auf der Anmeldeseite.                                                                   |
| Abgebrochen oder abgelehnt (`access_denied`)                                | Du hast beim Anbieter abgebrochen, oder die Zustimmung wurde verweigert.                                                                     | Beginne erneut und bestätige beim Anbieter.                                                            |
| Anbieter nicht erreichbar (`provider_unavailable`)                          | Axentra konnte den Anbieter nicht erreichen oder nicht validieren.                                                                           | Versuche es später; der Betreiber prüft die Anbieterkonfiguration.                                     |
| Antwort konnte nicht verifiziert werden (`login_failed`)                    | Das Token des Anbieters hat eine Prüfung nicht bestanden.                                                                                    | Versuche es erneut; tritt der Fehler weiter auf, prüft der Betreiber das Serverlog.                    |
| E-Mail nicht verifiziert (`email_not_verified`)                             | Der Anbieter hat deine Adresse nicht als verifiziert bestätigt. Häufig bei Microsoft Entra ID, das oft keinen `email_verified`-Claim sendet. | Der Betreiber konfiguriert den Anbieter so, dass er ihn sendet.                                        |
| Domain nicht erlaubt (`domain_not_allowed`)                                 | Deine E-Mail-Domain steht nicht auf der Positivliste des Anbieters.                                                                          | Verwende ein Konto in einer erlaubten Domain.                                                          |
| Kein Konto (`signup_disabled`)                                              | Für dich existiert kein Konto, und die Registrierung ist ausgeschaltet.                                                                      | Bitte einen Administrator um eine [Einladung](help:members-invitations) und melde dich dann erneut an. |
| Konto deaktiviert (`account_disabled`)                                      | Dein Konto ist deaktiviert.                                                                                                                  | Wende dich an einen Administrator.                                                                     |
| Zu viele Versuche (`rate_limited`)                                          | Aus deinem Netzwerk wurden zu viele Anmeldungen gestartet.                                                                                   | Warte eine Minute.                                                                                     |
| Einladung hier nicht angenommen (`invitation_requires_post`)                | Ein Single-Sign-on-Link enthielt ein Einladungs-Token in seiner Adresse, das der Server ablehnt.                                             | Öffne den Einladungslink aus deiner E-Mail noch einmal und melde dich über die Anmeldeseite an.        |

## Fehlerbehebung {#troubleshooting}

| Meldung                                                                   | Ursache                                                                                                                                                                                              | Was zu tun ist                                                                                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Anmeldung fehlgeschlagen** – „E-Mail-Adresse oder Passwort ist falsch.“ | Falsche Adresse oder falsches Passwort, das Konto ist deaktiviert, oder das Konto hat kein Passwort (per Single Sign-on angelegt). Aus Sicherheitsgründen sagt der Server nicht, was davon zutrifft. | Prüfe die Eingabe; versuche Single Sign-on; bitte einen Administrator, das Konto auf der Seite [Benutzer](help:users) zu prüfen. |
| **Zu viele Anfragen**                                                     | Mehr als die erlaubten Fehlversuche innerhalb einer Minute (standardmäßig 10 pro Konto).                                                                                                             | Warte eine Minute und versuche es erneut.                                                                                        |
| **Keine Anmeldemethode verfügbar**                                        | Auf dem Server sind weder Passwortanmeldung noch Single Sign-on aktiviert.                                                                                                                           | Der Betreiber muss die Authentifizierung konfigurieren.                                                                          |
| Single Sign-on kehrt mit einem Fehler zurück                              | Siehe [Fehler beim Single Sign-on](help:signing-in#sso-errors).                                                                                                                                      |                                                                                                                                  |
| Du wirst immer wieder zur Anmeldeseite geschickt                          | Der Browser blockiert das Sitzungscookie.                                                                                                                                                            | Erlaube Cookies für die Adresse von Studio; bitte den Betreiber, die Konfiguration zu prüfen.                                    |
| **Nicht erlaubt** direkt bei der Anmeldung                                | Die Adresse von Studio ist weder die öffentliche URL des Servers noch in `security.allowed_origins` eingetragen.                                                                                     | Der Betreiber trägt die Adresse von Studio in `security.allowed_origins` ein.                                                    |
| **Deine Sitzung konnte nicht geprüft werden**                             | Der Server konnte nicht nach deiner Sitzung gefragt werden (Netzwerk- oder Serverfehler).                                                                                                            | Wähle **Erneut versuchen**; prüfe nach der erneuten Anmeldung den **Systemzustand**.                                             |
| **Bitte melde dich erneut an**                                            | Die Aktion erfordert eine kürzlich erfolgte Anmeldung.                                                                                                                                               | Melde dich erneut an und wiederhole die Aktion.                                                                                  |
| Nach der Anmeldung siehst du keine Produkte                               | Dein Konto hat noch keine Rolle.                                                                                                                                                                     | Bitte einen Administrator, dich hinzuzufügen oder dir eine Einladung zu senden.                                                  |
