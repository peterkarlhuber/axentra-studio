---
title: Mitglieder und Einladungen
summary: Gib Personen Zugriff auf einen Mandanten, indem du sie als Mitglieder hinzufügst oder per E-Mail einlädst, und verstehe die Rollenobergrenze, die festlegt, welche Rollen du vergeben kannst.
keywords: Mitglied, Mitgliedschaft, einladen, Einladung, Einladungslink, Einladungs-Token, Einladung annehmen, Rollenobergrenze, Inhaber, Owner, Benutzer hinzufügen, Onboarding, Team
---

Ein **Mitglied** ist ein Benutzer mit einer Rolle in einem Mandanten, zum Beispiel **Owner**,
**Admin**, **Member** oder **Viewer**. Die Rolle entscheidet, was die Person in diesem Mandanten tun
kann. Du gibst jemandem auf eine von zwei Arten Zugriff:

- **Hinzufügen**: ein vorhandenes Konto direkt aufnehmen, wenn du dieses Konto bereits sehen kannst.
- **Einladen**: eine Person per E-Mail einladen. Die Person nimmt die Einladung nach der Anmeldung an und
  wird Mitglied mit der Rolle, die du gewählt hast.

Die Verantwortlichen eines ganzen Produkts werden dagegen beim Produkt verwaltet, siehe
[Produkte](help:products#members).

> [!IMPORTANT]
> Um die Tabs **Mitglieder** und **Einladungen** eines Mandanten zu sehen, brauchst du im Mandanten
> `members:read`; Hinzufügen, Einladen, Rollen ändern, Entfernen und Widerrufen erfordern
> `members:manage`. Owner und Admin eines Mandanten haben beides; Produktverantwortliche mit
> **Support** haben `members:manage`, können aber nur Rollen innerhalb ihrer eigenen Berechtigungen
> vergeben (siehe [Rollenobergrenze](#role-ceiling)). Beide Seiten erfordern das Mandantenmodul.

## Integrierte Mandantenrollen {#tenant-roles}

| Rolle                      | Darf                                                                                                                                                |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner** (`tenant_owner`) | Alles im Mandanten, einschließlich andere Personen zu Ownern zu machen.                                                                             |
| **Admin** (`tenant_admin`) | Dieselben Berechtigungen wie Owner, kann aber keine Owner zuweisen, ändern oder entfernen.                                                          |
| **Member** (`member`)      | Arbeitet mit den Daten: liest und schreibt Datensätze und Dateien, veröffentlicht Ereignisse, erfasst Nutzung, versendet Benachrichtigungen, sucht. |
| **Viewer** (`viewer`)      | Liest den Mandanten, seine Mitglieder, Datensätze, Dateien, Nutzung und Abrechnung und sucht.                                                       |

Eigene Mandantenrollen deines Produkts erscheinen in denselben Listen, mit ihrem Schlüssel in
Klammern. Siehe [Rollen und Berechtigungen](help:roles-permissions).

## Einen vorhandenen Benutzer hinzufügen {#add}

1. Öffne den Mandanten unter [Mandanten](app:tenants) und wähle den Tab **Mitglieder**.
2. Wähle **Mitglied hinzufügen**.
3. Gib die **E-Mail-Adresse** ein und wähle eine **Rolle**.
4. Wähle **Mitglied hinzufügen**.

Das funktioniert nur für Konten, die du sehen kannst: Plattform-Administratoren sehen jedes Konto;
Benutzer mit `product_users:read` (Product owner, Product admin, Support und Product viewer) sehen
alle, die bereits zum Produkt gehören; alle anderen sehen nur die Mitglieder des Mandanten selbst. Bei
jeder anderen Adresse zeigt der Dialog **Benutzer nicht gefunden** und bietet **Stattdessen
einladen** an, womit eine Einladung mit derselben E-Mail-Adresse und Rolle erstellt wird.

> [!NOTE]
> Axentra antwortet gleich mit „nicht gefunden“, ob ein Konto nicht existiert oder für dich nur nicht
> sichtbar ist. So lässt sich die Liste der Konten auf dem Server nicht ausforschen.

## Eine Rolle ändern oder ein Mitglied entfernen {#change-role}

- Um eine Rolle zu ändern, wähle in der Spalte **Rolle** des Mitglieds eine neue. Die Änderung gilt
  sofort.
- Um ein Mitglied zu entfernen, wähle das Papierkorbsymbol in der Zeile und bestätige **Mitglied
  entfernen?**. Die Person verliert jeden Zugriff, den diese Mitgliedschaft gewährt hat. Das Konto und
  ihre anderen Mitgliedschaften bleiben bestehen.

Ein Mandant behält immer mindestens einen **Owner**: Der letzte Owner kann weder entfernt werden noch
eine andere Rolle erhalten. Mache zuerst jemand anderen zum Owner.

## Jemanden per E-Mail einladen {#invite}

1. Öffne den Mandanten und wähle den Tab **Einladungen**, oder öffne [Einladungen](app:invitations)
   und wähle den Mandanten.
2. Wähle **Mitglied einladen**.
3. Gib die **E-Mail-Adresse** ein und wähle eine **Rolle**. Studio wählt **Member** vor oder die erste
   Rolle, die du vergeben darfst.
4. Wähle **Einladung senden**.

Der Dialog **Einladung erstellt** zeigt dann den **Einladungslink** (sofern verfügbar) und das
**Einladungs-Token**.

> [!CAUTION]
> Link und Token werden nur einmal angezeigt. Axentra speichert nur einen Hash des Tokens, sodass
> niemand es erneut anzeigen kann. Wer das Token hat und sich mit der eingeladenen Adresse anmeldet,
> kann dem Mandanten beitreten. Gib es nur an die eingeladene Person weiter. Geht es verloren,
> widerrufe die Einladung und erstelle eine neue.

### Wie die Einladung die Person erreicht {#delivery}

- **Benachrichtigungsmodul aktiviert:** Axentra stellt eine Einladungs-E-Mail mit dem Annahmelink an
  die Adresse in die Warteschlange, und Studio zeigt denselben Link an, damit du ihn auch selbst
  verschicken kannst. Der Link verwendet die Produkteinstellung `invitation_accept_url`, sofern
  gesetzt (siehe [Produkteinstellungen](help:products#settings)), sonst die Servereinstellung
  `notify.invitation_accept_url` (siehe
  [Serverkonfiguration](help:server-configuration#user-visible-settings)), sonst
  `/accept-invitation` unter der öffentlichen URL des Servers. Studio bedient `/accept-invitation`
  und leitet auf seine Seite **Einladung annehmen** weiter, daher funktioniert der Standard, wenn
  Studio unter der Adresse der API läuft. Hat Studio eine eigene Adresse (zum Beispiel
  `https://studio.example.com` neben `https://api.example.com`), zeigt der Standard auf die API:
  Setze `notify.invitation_accept_url` (oder die Produkteinstellung) auf
  `https://<your Studio address>/invitations/accept`.
- **Benachrichtigungsmodul deaktiviert:** Es wird keine E-Mail verschickt, und es gibt keinen Link.
  Gib das **Einladungs-Token** weiter; die Person gibt es auf der Studio-Seite **Einladung annehmen**
  ein.

### Gültigkeit und Status einer Einladung {#expiry}

| Status         | Bedeutung                                                                      |
| -------------- | ------------------------------------------------------------------------------ |
| **Ausstehend** | Offen und gültig; kann angenommen oder widerrufen werden.                      |
| **Angenommen** | Verwendet; die Person ist Mitglied.                                            |
| **Widerrufen** | Mit **Einladung widerrufen** zurückgezogen; das Token funktioniert nicht mehr. |
| **Abgelaufen** | Nicht innerhalb von **7 Tagen** nach der Erstellung angenommen.                |

Die Gültigkeit von 7 Tagen ist fest. Um sie zu verlängern, widerrufe die Einladung (falls sie noch
aussteht) und lade erneut ein. Pro E-Mail-Adresse und Mandant kann es immer nur eine offene Einladung
geben.

### Eine Einladung widerrufen {#revoke}

Wähle das Papierkorbsymbol neben einer **ausstehenden** Einladung und bestätige **Einladung
widerrufen?**. Link und Token funktionieren sofort nicht mehr.

## Eine Einladung annehmen {#accept}

So geht die eingeladene Person vor:

1. Öffne den Einladungslink. Bist du nicht angemeldet, weist **Anmelden** darauf hin, dass du dich
   für eine Einladung anmeldest, und bringt dich danach zu ihr zurück, auch nach Single Sign-on.
2. Melde dich mit dem Konto an, dessen E-Mail-Adresse die eingeladene Adresse ist. Noch kein Konto?
   Bietet die Anmeldeseite Single Sign-on an, melde dich dort mit der eingeladenen Adresse an: Der
   Server legt dein Konto an, weil für sie eine Einladung offen ist. Eine Registrierung mit Passwort
   gibt es nicht; wende dich an die Person, die dich eingeladen hat, oder an eine Administration.
3. Prüfe das unter **Angemeldet als** angezeigte Konto und wähle **Einladung annehmen**. Nach einer
   Anmeldung mit Passwort passiert vor deiner Bestätigung nichts. Studio entfernt das Token aus der
   Adresszeile, sobald die Seite es gelesen hat, damit es nicht im Browserverlauf bleibt; das Feld
   **Einladungs-Token** ist ausgefüllt. Hast du nur das Token, öffne **Einladung annehmen** unter
   `/invitations/accept` und füge es ein.

Mit Single Sign-on nimmt der Server die Einladung an, sobald du angemeldet bist. Studio prüft, dass
du jetzt Mitglied des Mandanten bist, und zeigt sofort **Einladung angenommen**, ohne zweite
Bestätigung. Konnte der Server sie nicht annehmen (etwa weil du dich mit einer anderen Adresse
angemeldet hast), bittet die Seite wie in Schritt 3 um deine Bestätigung und erklärt, was nicht
geklappt hat.

**Einladung angenommen** nennt Mandant, Produkt und deine Rolle; **Mandant öffnen** bringt dich
dorthin. Warst du bereits Mitglied des Mandanten, bleibt deine bisherige Rolle unverändert.

> [!IMPORTANT]
> Eine Einladung kann nur ein angemeldeter Benutzer annehmen, dessen Konto genau die eingeladene
> E-Mail-Adresse hat (Groß-/Kleinschreibung spielt keine Rolle). Benutzer ohne E-Mail-Adresse können
> keine Einladungen annehmen; füge sie stattdessen direkt hinzu.

## Rollenobergrenze: welche Rollen du vergeben kannst {#role-ceiling}

Mit `members:manage` kannst du nicht mehr vergeben, als du selbst hast. Der Server setzt diese Regeln
durch, und Studio zeigt sie vorab an:

1. **Berechtigungen.** Du kannst eine Rolle nur vergeben (hinzufügen, einladen oder darauf ändern),
   wenn du im selben Mandanten jede Berechtigung dieser Rolle hast. Ein Mitglied ändern oder
   entfernen kannst du nur, wenn auch seine _aktuelle_ Rolle innerhalb deiner Berechtigungen liegt.
2. **Inhaberrang.** Die Rolle **Owner** kann nur von einem Owner des Mandanten, von
   Produktverantwortlichen, von einem produktweiten API-Schlüssel oder von einem
   Plattform-Administrator vergeben, geändert oder entfernt werden.
3. **Letzter Owner.** Der letzte Owner eines Mandanten (und der letzte **Product owner** eines
   Produkts) kann weder entfernt noch herabgestuft werden.

| Du bist                               | Du kannst vergeben                            | Du kannst nicht                                                 |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Plattform-Administrator               | Jede Rolle                                    | Keine Einschränkung                                             |
| Product owner oder Product admin      | Jede Mandantenrolle, einschließlich **Owner** | (Product admins können keine Produktverantwortlichen verwalten) |
| Produktverantwortlich mit **Support** | **Viewer**                                    | **Member**, **Admin**, **Owner**                                |
| **Owner** des Mandanten               | Jede Rolle des Mandanten                      | Den letzten Owner entfernen                                     |
| **Admin** des Mandanten               | **Admin**, **Member**, **Viewer**             | Einen **Owner** vergeben, herabstufen oder entfernen            |
| Eigene Rolle mit `members:manage`     | Rollen, deren Berechtigungen sie enthält      | Stärkere Rollen                                                 |

In Studio erscheinen Rollen, die du nicht vergeben kannst, als **„… (über deinen Berechtigungen)“**
und sind deaktiviert; Mitglieder, die du nicht ändern kannst, zeigen **Über deiner eigenen Rolle**,
ohne Rollenauswahl und ohne Entfernen-Button.

> [!NOTE]
> Studio kann die Obergrenze nur berechnen, wenn du die Rollen des Produkts lesen kannst
> (`roles:read`). Ohne diese Berechtigung ist die Rolle ein Freitextfeld, und der Server begründet
> eine Ablehnung mit **Nicht erlaubt**.

## Fehlerbehebung {#troubleshooting}

**Benutzer nicht gefunden.** Das Konto existiert nicht, oder du darfst es nicht sehen. Verwende
**Stattdessen einladen**.

**Konflikt: „an open invitation for this email exists“.** Für diese Adresse gibt es im Mandanten
bereits eine ausstehende Einladung. Verwende sie oder widerrufe sie und lade erneut ein.

**Nicht erlaubt: „you cannot assign the role …: it has permissions you do not hold“.** Die Rolle liegt
über deiner Stufe. Wähle eine schwächere Rolle oder wende dich an einen Owner. Siehe
[Rollenobergrenze](#role-ceiling).

**Nicht erlaubt: „only owners can assign the role tenant_owner“.** Nur Owner, Produktverantwortliche
und Plattform-Administratoren können Owner verwalten.

**Konflikt: „the tenant needs at least one owner“.** Du hast versucht, den letzten Owner zu entfernen
oder herabzustufen.

**Bitte prüfe deine Eingaben: „unknown tenant role …“.** Der Rollenschlüssel existiert in diesem
Produkt nicht (zum Beispiel wegen eines Tippfehlers im Freitext-Rollenfeld), oder es handelt sich um
eine Produktrolle.

**Beim Annehmen: Diese Einladung kann nicht verwendet werden.** Der Server antwortet gleich für
eine Einladung, die abgelaufen (nach 7 Tagen), bereits angenommen oder widerrufen ist, und für einen
unvollständigen oder falsch eingegebenen Link oder Token, damit niemand Einladungen ausprobieren
kann. Bitte die Person, die dich eingeladen hat, um eine neue Einladung.

**Beim Annehmen: Einladung für eine andere E-Mail-Adresse.** Du bist mit einem Konto für eine andere
Adresse angemeldet. Wähle **Abmelden und eingeladene Adresse verwenden**: Nachdem du dich mit der
eingeladenen Adresse angemeldet hast, bringt Studio dich zur Einladung zurück. Oder bitte um eine
Einladung an deine eigene Adresse.

**Beim Annehmen: Dein Konto hat keine E-Mail-Adresse.** Solche Konten können keine Einladungen
annehmen. Melde dich mit der eingeladenen Adresse an oder bitte die Person, die dich eingeladen hat,
dein Konto direkt zum Mandanten hinzuzufügen.

**Beim Annehmen: Der Mandant ist nicht aktiv.** Der Mandant, zu dem du eingeladen wurdest, oder
sein Produkt ist gesperrt oder geschlossen, deshalb kann gerade niemand beitreten. Die Einladung
bleibt unbenutzt. Sobald der Mandant wieder aktiv ist, öffne den Link erneut. Der Server lehnt mit
„the invitation cannot be accepted: the tenant is not active“ ab.

**Beim Annehmen: Die Einladung ist nicht mehr gültig.** Die Person, die dich eingeladen hat, darf
die Rolle nicht mehr vergeben, zum Beispiel weil sich ihre eigene Rolle oder Mitgliedschaft nach
dem Versand geändert hat. Bitte sie oder eine andere Administratorin bzw. einen anderen
Administrator des Mandanten um eine neue Einladung. Der Server lehnt mit „the invitation is no
longer valid: its sender can no longer grant this role“ ab.

**Beim Annehmen: Der Server ist nicht erreichbar.** Es wurde nichts verändert. Prüfe deine
Verbindung und wähle **Erneut versuchen**.

**Der Einladungslink öffnet „Seite nicht gefunden“ oder eine Seite der API.** Der Link zeigt auf eine
Adresse, unter der Studio nicht läuft. Setze die Servereinstellung `notify.invitation_accept_url`
(oder die Produkteinstellung `invitation_accept_url`) auf die Annahmeseite von Studio, siehe
[Zustellung](#delivery). Bis dahin schick das Token und lass es unter `/invitations/accept`
einfügen.

**Die eingeladene Person kann sich nicht anmelden.** Die Person hat noch kein Konto. Studio kann keine Konten
anlegen, und es gibt keine Registrierung mit Passwort. Eine eingeladene Person erhält ein Konto, indem
sie sich per Single Sign-on mit der eingeladenen, verifizierten E-Mail-Adresse anmeldet; ohne Single
Sign-on wende dich an einen Plattform-Administrator. Siehe [Anmelden](help:signing-in).

**Der Einladungsdialog zeigt nur ein Token.** Das Benachrichtigungsmodul ist deaktiviert, daher wurde
kein Link erzeugt. Gib das Token weiter.
