---
title: Häufige Fragen
summary: Kurze Antworten auf die Fragen, die am häufigsten zu Studio gestellt werden, mit Links zu den Details.
keywords: FAQ, häufige Fragen, Fragen, wie kann ich, warum, Hilfe, Antworten
---

Kurze Antworten auf häufige Fragen. Jede Antwort verweist auf den Artikel mit den Details.

## Kann ich in Studio Benutzerkonten anlegen? {#create-users}

Nein. Konten entstehen bei der [Ersteinrichtung](help:first-run-setup), wenn jemand eine Einladung
annimmt, oder bei der ersten Anmeldung per Single Sign-on. In Studio lädst du Personen in einen
Mandanten ein oder fügst vorhandene Konten als Mitglieder hinzu. Siehe
[Mitglieder und Einladungen](help:members-invitations).

## Wie mache ich jemanden zum Produktverantwortlichen? {#add-operator}

Axentra hat keine Einladungen auf Produktebene. Die Person braucht ein Konto, das du sehen kannst:
Lade sie zuerst in einen der Mandanten des Produkts ein; sobald sie angenommen hat, fügst du sie
auf der Produktseite unter **Mitglieder** hinzu. Ein Plattform-Administrator kann jedes vorhandene
Konto direkt hinzufügen. Siehe [Produkte](help:products).

## Was ist der Unterschied zwischen einer Produktrolle und einer Mandantenrolle? {#product-vs-tenant-role}

Eine Mandantenrolle (zum Beispiel **Member**) gilt nur in diesem einen Mandanten. Eine Produktrolle
(zum Beispiel **Product admin**) gilt für das Produkt als Ganzes _und_ für jeden Mandanten darin.
Vergib Produktrollen nur an Personen, die diese Reichweite brauchen. Siehe
[Rollen und Berechtigungen](help:roles-permissions).

## Was ist der Unterschied zwischen Owner und Admin eines Mandanten? {#owner-vs-admin}

Beide haben dieselben Berechtigungen. Nur ein **Owner** (oder jemand mit Befugnis auf Produkt- oder
Plattformebene) kann jemanden zum Owner machen oder einen Owner ändern oder entfernen. Jeder
Mandant behält mindestens einen Owner. Siehe [Rollenobergrenze](help:security#role-ceiling).

## Warum kann ich manche Rollen nicht auswählen? {#roles-greyed-out}

Studio kennzeichnet Rollen, die du nicht vergeben darfst, mit **„… (über deinen
Berechtigungen)“**: Solche Rollen enthalten Berechtigungen, die du selbst nicht hast, oder es ist eine
Owner-Rolle und du bist kein Owner. Niemand kann mehr Rechte vergeben, als er selbst hat. Siehe
[Rollenobergrenze](help:security#role-ceiling).

## Ich habe das Geheimnis eines API-Schlüssels verloren. Kann ich es noch einmal sehen? {#lost-secret}

Nein. Geheimnisse werden genau einmal angezeigt, und der Server bewahrt nur einen Hash auf.
Verwende **Geheimnis erneuern**, um ein neues zu erhalten; eine Übergangsfrist hält das alte
Geheimnis funktionsfähig, während du deine Dienste umstellst. Siehe [API-Schlüssel](help:api-keys).

## Was passiert mit den Daten, wenn ich einen Mandanten sperre? {#suspend-data}

Es wird nichts gelöscht. Mitglieder und API-Schlüssel verlieren den Zugriff, bis der Mandant wieder
aktiviert wird; Plattform-Administratoren können ihn weiterhin ansehen. Das Löschen eines
Mandanten dagegen entfernt den Mandanten mit all seinen Daten und lässt sich nicht rückgängig
machen. Siehe [Mandanten](help:tenants).

## Warum sehe ich „Nicht gefunden“ für etwas, das existiert? {#not-found-exists}

Hast du keine Beziehung zu einem Produkt oder Mandanten, antwortet Axentra genau so, als gäbe es
ihn nicht, damit niemand herausfinden kann, welche Produkte, Mandanten oder Konten es gibt. Bitte
jemanden mit Zugriff, dich hinzuzufügen. Siehe [Nicht gefunden](help:troubleshooting#not-found).

## Warum ist ein Bereich in der Seitenleiste mit „Aus“ markiert? {#area-off}

Das Servermodul dahinter ist ausgeschaltet. Ein Betreiber kann es in der Serverkonfiguration
aktivieren. Siehe die [Modulreferenz](help:modules-reference).

## Warum fehlt bei mir eine Schaltfläche? {#button-missing}

Studio blendet Aktionen aus, die deine Berechtigungen nicht erlauben, und manche Aktionen hängen
von der Betriebsart des Servers ab (zum Beispiel gibt es **Neues Produkt** nur im
Mehrproduktbetrieb). Schlag die Berechtigung in der
[Berechtigungsreferenz](help:permissions-reference) nach.

## Warum wurde ich abgemeldet? {#signed-out}

Sitzungen enden nach einer maximalen Lebensdauer, nach einer Zeit der Inaktivität, wenn sie
beendet werden, wenn dein Konto deaktiviert wird und wenn dein Passwort in einer anderen Sitzung
geändert wurde. Melde dich erneut an; Studio bringt dich zurück zur Seite, auf der du warst. Siehe
[Sicherheit](help:security#sessions).

## Kann ich in Studio bezahlen oder eine Kreditkarte hinterlegen? {#payment}

Nein. Studio fragt nie nach Karten- oder Bankdaten. Kostenpflichtige Tarife laufen über die
gehostete Checkout-Seite des Zahlungsanbieters. Siehe
[Tarife und Abonnements](help:plans-subscriptions).

## Kann ich Datensätze in Studio bearbeiten? {#edit-records}

Ja, mit der Berechtigung `records:write` in diesem Mandanten. Speichern ersetzt das gesamte
JSON-Objekt des Datensatzes. Siehe [Datensätze](help:records).

## Warum sehen die Zeiten von Zeitplänen anders aus, als ich sie eingegeben habe? {#utc}

Zeitpläne laufen in UTC (ohne Sommerzeit). Studio zeigt die nächste und die letzte Ausführung in
deiner eigenen Zeitzone. Siehe [Zeitpläne](help:schedules).

## Wo ändere ich die Serverkonfiguration? {#server-config}

Nicht in Studio. Die Seite **Einstellungen** zeigt die wirksame Konfiguration; Änderungen nimmt ein
Betreiber auf dem Server vor. Siehe [Einstellungen](help:settings) und
[Serverkonfiguration](help:server-configuration).

## Warum sind manche Texte auf Englisch, obwohl ich eine andere Sprache verwende? {#english-texts}

Beschreibungen der integrierten Rollen und Berechtigungen und die **Servermeldung** in den
Fehlerdetails kommen vom Server und sind immer auf Englisch. Alles andere in Studio ist übersetzt.

## Wie melde ich ein Problem? {#report-problem}

Öffne **Technische Details** in der Fehlermeldung und kopiere die **Anfrage-ID** (`req_…`). Schick
sie zusammen mit der Uhrzeit und deinem Vorgehen an deinen Betreiber. Siehe
[die Anfrage-ID](help:troubleshooting#request-id).

## Funktioniert Studio auf dem Smartphone? {#mobile}

Ja. Auf schmalen Bildschirmen wird die Seitenleiste zu einer ausklappbaren Leiste hinter
**Navigation öffnen**, und weniger wichtige Tabellenspalten werden ausgeblendet. Siehe
[Tastatur und Barrierefreiheit](help:keyboard-accessibility#zoom).

## Kann ich Studio nur mit der Tastatur oder einem Screenreader bedienen? {#accessibility}

Ja. Jede Funktion lässt sich mit der Tastatur bedienen, und Studio ist darauf ausgelegt, WCAG 2.1
AA zu erfüllen. Siehe [Tastatur und Barrierefreiheit](help:keyboard-accessibility).
