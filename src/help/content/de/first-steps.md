---
title: Erste Schritte
summary: Eine geführte erste Sitzung in Studio – lege ein Produkt und einen Mandanten an, lade ein Mitglied ein, erstelle einen API-Schlüssel und prüfe, ob jeder Schritt funktioniert hat.
keywords: Einstieg, Schnellstart, Tutorial, Anleitung, Anfänger, erstes Produkt, erster Mandant, erster API-Schlüssel, erste Einladung, Hello World, Rundgang
---

In diesem Tutorial baust du eine kleine, aber echte Arbeitsstruktur auf: ein Produkt, einen Kunden
(Mandanten) in diesem Produkt, eine Einladung für eine Person und einen API-Schlüssel, den eine
Maschine verwenden kann. Nach jedem Schritt prüfst du das Ergebnis, damit du weißt, dass es
funktioniert hat. Das dauert etwa 15 Minuten.

Unterwegs lernst du die wichtigsten Begriffe kennen. Ist dir einer neu, sieh unter
[Grundbegriffe](help:concepts) nach.

## Bevor du beginnst {#before-you-start}

> [!IMPORTANT]
>
> - Du bist in Studio angemeldet, idealerweise als **Plattform-Administrator** (zum Beispiel mit dem
>   Konto aus der [Ersteinrichtung](help:first-run-setup)).
> - Um ein Produkt anzulegen, brauchst du die Plattformberechtigung `products:create` und einen
>   Server im **Mehrproduktbetrieb**. Im Einzelproduktbetrieb existiert das Produkt bereits:
>   Überspringe [Schritt 1](help:first-steps#create-product).
> - Für [Schritt 4](help:first-steps#create-api-key) und seine Prüfung brauchst du eine
>   Kommandozeile mit `curl`.

Verwende Beispielnamen. Dieses Tutorial verwendet das Produkt „Example CRM“ und den Mandanten „Acme Ltd“.

## Schritt 1: Ein Produkt anlegen {#create-product}

Ein **Produkt** ist deine Anwendung auf dem Axentra-Server. Alles Weitere in diesem Tutorial liegt
darin.

1. Öffne [Produkte](app:products).
2. Wähle **Neues Produkt**.
3. Gib als **Name** `Example CRM` ein. Studio leitet den **Kurznamen** `example-crm` ab; behalte ihn.
4. Ergänze optional eine **Beschreibung**.
5. Wähle **Produkt anlegen**.

**Erwartetes Ergebnis:** Studio meldet „Produkt ‚Example CRM‘ angelegt“ und öffnet die Seite des
Produkts.

**Prüfe es:** Öffne den Tab **Mitglieder**. Dein Konto ist mit der Rolle **Product owner** aufgeführt:
Wer ein Produkt anlegt, wird sein Inhaber. Das Produkt erscheint außerdem oben im Produktwechsler.

Wähle jetzt **Dashboard öffnen**. Das Dashboard von „Example CRM“ öffnet sich; alle Kennzahlen zeigen
`0`, außer **Benutzer** (du als Produktverantwortlicher) und **Audit-Ereignisse (24 h)**.

## Schritt 2: Einen Mandanten anlegen {#create-tenant}

Ein **Mandant** ist eine Kundenorganisation deines Produkts. Seine Daten sind strikt von allen
anderen Mandanten getrennt.

1. Öffne [Mandanten](app:tenants) oder wähle im Dashboard **Neuer Mandant**.
2. Wähle **Neuer Mandant**.
3. Gib als **Name** `Acme Ltd` ein. Studio leitet den **Kurznamen** `acme-ltd` ab.
4. Wähle **Mandant anlegen**.

**Erwartetes Ergebnis:** Studio meldet „Mandant ‚Acme Ltd‘ angelegt“ und öffnet die Seite des
Mandanten mit den Tabs **Details**, **Mitglieder** und **Einladungen**. Der Status ist **Aktiv**.

**Prüfe es:** Zurück im Dashboard zeigt **Mandanten** jetzt `1`. Notiere dir die **ID** des
Mandanten auf dem Tab **Details** (sie beginnt mit `ten_`); du brauchst sie in Schritt 4.

> [!NOTE]
> Ein neuer Mandant hat keine Mitglieder. Du fügst sie im nächsten Schritt hinzu.

## Schritt 3: Ein Mitglied einladen {#invite-member}

Personen treten einem Mandanten über eine **Einladung** bei (oder werden direkt hinzugefügt, wenn sie
bereits ein Konto haben, das du sehen kannst).

1. Öffne auf der Seite des Mandanten den Tab **Einladungen**.
2. Wähle **Mitglied einladen**.
3. Gib die **E-Mail-Adresse** einer Kollegin oder eines Kollegen ein, zum Beispiel `maria@example.com`.
4. Belasse die **Rolle** bei **Member** oder wähle eine andere Rolle. Rollen oberhalb deiner eigenen
   Berechtigungen sind nicht auswählbar.
5. Wähle **Einladung senden**.

**Erwartetes Ergebnis:** Der Dialog **Einladung erstellt** zeigt das Geheimnis der Einladung,
gekennzeichnet mit **Wird nur einmal angezeigt**: bei aktiviertem Modul `notify` einen
**Einladungslink** (Axentra verschickt die Einladung dann auch per E-Mail), andernfalls nur das
**Einladungs-Token**.

6. Kopiere den Link oder das Token und schicke es über einen vertrauenswürdigen Kanal an die
   eingeladene Person; wähle dann **Fertig**.

**Prüfe es:** Der Tab **Einladungen** listet die Einladung mit dem Status **Ausstehend** und einem
Ablaufdatum in sieben Tagen.

> [!IMPORTANT]
> Die eingeladene Person nimmt die Einladung an, während sie mit einem Konto angemeldet ist, das genau
> die eingeladene E-Mail-Adresse hat. Wie das funktioniert, auch für Personen ohne Konto, steht unter
> [Eine Kundenorganisation einrichten](help:tutorial-onboard-customer#accept-invitation).

## Schritt 4: Einen API-Schlüssel erstellen {#create-api-key}

Ein **API-Schlüssel** erlaubt einer Maschine, zum Beispiel der Acme-Integration, die API aufzurufen.
Jeder Schlüssel hat eine ausdrückliche Liste von Berechtigungen; gib ihm nur, was er braucht.

1. Öffne [API-Schlüssel](app:apiKeys) oder wähle im Dashboard **Neuer API-Schlüssel**.
2. Wähle **Neuer API-Schlüssel**.
3. Gib als **Name** `acme-integration test` ein.
4. Wähle unter **Mandantenbindung** den Mandanten **Acme Ltd**. Der Schlüssel erreicht dann nur die
   Daten dieses Mandanten.
5. Wähle unter **Berechtigungen** nur `tenant:read` aus.
6. Wähle **Schlüssel anlegen**.

**Erwartetes Ergebnis:** Der Dialog **Geheimnis für „acme-integration test“** zeigt das **Geheimnis
des API-Schlüssels**, das mit `axk_` beginnt. Kopiere es jetzt: Es wird nur dieses eine Mal angezeigt.

7. Aktiviere **Ich habe das Geheimnis sicher gespeichert** und wähle dann **Fertig**.

**Prüfe es:** Der Schlüssel ist mit dem Status **Aktiv**, dem Geltungsbereich **Mandant** und
**1 Berechtigung** aufgeführt.

### Den Schlüssel ausprobieren {#try-api-key}

Rufe die API mit dem Schlüssel auf. Ersetze die Adresse, die Produkt-ID (aus der Karte **Server** im
Dashboard, **Produkt-ID**) und die Mandanten-ID:

```bash
curl -s https://axentra.example.com/v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE \
  -H "Authorization: Bearer axk_EXAMPLE_SECRET"
```

**Erwartetes Ergebnis:** eine JSON-Beschreibung des Mandanten:

```json
{
  "id": "ten_01EXAMPLE",
  "product_id": "prd_01EXAMPLE",
  "slug": "acme-ltd",
  "name": "Acme Ltd",
  "status": "active"
}
```

Die echte Antwort enthält noch ein paar Felder mehr. Lade in Studio **API-Schlüssel** neu:
**Zuletzt verwendet** zeigt jetzt eine Uhrzeit.

Schlägt der Aufruf fehl, sieh unter [Fehlerbehebung](help:first-steps#troubleshooting) nach. Um die
API kennenzulernen, lies [API-Grundlagen](help:api-basics).

## Schritt 5: Das Audit-Protokoll ansehen {#check-audit}

Alles, was du gerade getan hast, wurde aufgezeichnet.

1. Öffne [Audit-Protokoll](app:audit).
2. Wähle unter **Produkt** „Example CRM“ und wende den Filter an.

**Erwartetes Ergebnis:** Du siehst, die neuesten zuerst, `access.api_key.create`,
`tenancy.invitation.create`, `tenancy.tenant.create` und (im Mehrproduktbetrieb)
`tenancy.product.create`, jeweils mit dir als Akteur und dem Ergebnis **Erfolgreich**. Wähle einen
Eintrag aus, um seine Details zu sehen.

## Was du aufgebaut hast {#summary}

```diagram
hierarchy
```

Du hast ein Produkt mit einem Mandanten, einer offenen Einladung und einem mandantengebundenen
API-Schlüssel, und du weißt, wo du jedes davon überprüfen kannst. Als Nächstes:

- Richte einen echten Kunden von Anfang bis Ende ein: [Eine Kundenorganisation einrichten](help:tutorial-onboard-customer).
- Definiere eigene Rollen: [Rollen und Berechtigungen](help:roles-permissions).
- Räume den Testschlüssel auf: Öffne unter **API-Schlüssel** die Aktionen des Schlüssels und wähle
  **Schlüssel widerrufen**.

## Fehlerbehebung {#troubleshooting}

| Problem                                               | Ursache und Lösung                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Neues Produkt** fehlt                               | Du bist kein Plattform-Administrator, oder der Server läuft im Einzelproduktbetrieb. Verwende das vorhandene Produkt.          |
| **Konflikt** beim Anlegen des Produkts oder Mandanten | Der Kurzname ist bereits vergeben (Produkte: auf dem Server; Mandanten: im Produkt). Wähle einen anderen Kurznamen.            |
| **Bitte prüfe deine Eingaben** beim Kurznamen         | Kurznamen haben 2 bis 63 Zeichen: Kleinbuchstaben, Ziffern und Bindestriche, beginnend mit einem Buchstaben oder einer Ziffer. |
| **Konflikt** beim Einladen                            | Für diese Adresse existiert im Mandanten bereits eine offene Einladung. Widerrufe sie oder verwende sie.                       |
| **Nicht erlaubt** beim Anlegen des Schlüssels         | Du hast eine Berechtigung ausgewählt, die du selbst nicht hast.                                                                |
| `curl` antwortet mit `401`                            | Das Geheimnis ist unvollständig oder falsch, oder der Schlüssel wurde widerrufen. Erstelle einen neuen Schlüssel.              |
| `curl` antwortet mit `404`                            | Die Produkt- oder Mandanten-ID ist falsch, oder der Schlüssel ist an einen anderen Mandanten gebunden.                         |
| `curl` antwortet mit `403`                            | Dem Schlüssel fehlt die Berechtigung (`tenant:read`), oder der Mandant ist gesperrt.                                           |
| Das Audit-Protokoll zeigt nichts                      | Du brauchst `audit:read` für das Produkt (oder eine Plattformrolle). Prüfe den Filter **Produkt**.                             |
