---
title: Mandanten
summary: Lege Mandanten für deine Kunden an, benenne sie um, sperre, reaktiviere und lösche sie und verstehe, was jede Aktion für Zugriff und Daten bedeutet.
keywords: Mandant, Kunde, Organisation, Konto, Kundenkonto, Arbeitsbereich, Workspace, Tenant, sperren, reaktivieren, Mandant löschen, Kurzname, Slug
---

Ein **Mandant** ist ein Kunde oder eine Organisation innerhalb eines Produkts. Die Daten jedes
Mandanten (Datensätze, Dateien, Nutzung, Abonnements, Benachrichtigungen) sind strikt von allen
anderen Mandanten getrennt, auch in der Datenbank. Personen erhalten Zugriff auf einen Mandanten über
eine **Mitgliedschaft** mit einer Mandantenrolle, siehe
[Mitglieder und Einladungen](help:members-invitations).

Lege pro Kunde einen Mandanten an. Produktverantwortliche (Benutzer mit einer Produktrolle) arbeiten
mandantenübergreifend; Mandantenmitglieder sehen nur ihren eigenen Mandanten.

```diagram
hierarchy
```

> [!IMPORTANT]
> Die Seite **Mandanten** erfordert das Mandantenmodul. Um die Liste zu sehen, brauchst du
> `tenants:read`; ohne diese Berechtigung siehst du nur die Mandanten, in denen du Mitglied bist. Zum
> Anlegen brauchst du `tenants:create`, zum Umbenennen, Sperren und Reaktivieren `tenants:update`,
> zum Löschen `tenants:delete`. Product owner und Product admin haben alle diese Berechtigungen.

## Einen Mandanten finden {#find}

Öffne [Mandanten](app:tenants). Mit **Mandanten suchen** filterst du nach Name oder Kurzname, mit dem
Filter **Status** zeigst du nur **Aktiv** oder **Gesperrt** an. Die Spalte **Mitglieder** zählt die
Mitgliedschaften des Mandanten.

## Einen Mandanten anlegen {#create}

1. Öffne [Mandanten](app:tenants) und wähle **Neuer Mandant**.
2. Gib den **Namen** ein, zum Beispiel den Firmennamen des Kunden.
3. Prüfe den **Kurznamen**. Studio leitet ihn aus dem Namen ab; du kannst ihn ändern, bevor du den
   Mandanten anlegst.
4. Wähle **Mandant anlegen**.

Studio öffnet den neuen Mandanten. Er hat noch keine Mitglieder: Füge die erste Person des Kunden auf
dem Tab **Mitglieder** hinzu oder lade sie auf dem Tab **Einladungen** ein, meist mit der Rolle
**Owner**. Siehe [Mitglieder und Einladungen](help:members-invitations).

| Feld         | Was es bewirkt                                                                         | Erlaubte Werte / Standard                                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**     | Anzeigename in Studio und in Einladungs-E-Mails.                                       | 1–200 Zeichen. Später änderbar.                                                                                                                     |
| **Kurzname** | Stabile, URL-taugliche Kennung, die auch zur Bestätigung des Löschens eingetippt wird. | 2–63 Kleinbuchstaben, Ziffern und Bindestriche, beginnend mit einem Buchstaben oder einer Ziffer; eindeutig innerhalb des Produkts. Nicht änderbar. |
| **ID**       | Erzeugte Kennung (`ten_…`), die die API verwendet.                                     | Vom Server vergeben.                                                                                                                                |
| **Status**   | **Aktiv** oder **Gesperrt**.                                                           | Neue Mandanten sind **Aktiv**.                                                                                                                      |

> [!TIP]
> Über die API lässt sich ein Mandant in einem Schritt mit einem Inhaber anlegen (`owner_user_id`),
> und er kann ein eigenes `settings`-Objekt haben. Studio zeigt beides nicht an.

## Einen Mandanten umbenennen {#rename}

1. Öffne den Mandanten und bleib auf dem Tab **Details**.
2. Ändere unter **Mandant bearbeiten** den **Namen**.
3. Wähle **Änderungen speichern**.

Kurzname und ID ändern sich nie.

## Einen Mandanten sperren {#suspend}

Das Sperren blockiert jeden Zugriff auf einen Mandanten, ohne etwas zu löschen, zum Beispiel wenn ein
Kunde nicht bezahlt hat oder ein Vertrag ruht.

1. Öffne den Mandanten.
2. Wähle **Mandant sperren** und bestätige.

Solange ein Mandant gesperrt ist:

- können seine Mitglieder nicht auf ihn zugreifen; ihre Anfragen werden mit **Nicht erlaubt** abgelehnt;
- werden auch an den Mandanten gebundene API-Schlüssel und produktweite Schlüssel, die in ihm arbeiten,
  abgelehnt;
- verlieren auch Produktverantwortliche den Zugriff auf die Daten und die Seite des Mandanten; der
  Mandant bleibt mit dem Status **Gesperrt** in der Liste [Mandanten](app:tenants);
- behalten Plattform-Administratoren vollen Zugriff und Personen mit Plattform-Leserecht Lesezugriff;
- werden keine Daten gelöscht.

## Einen Mandanten reaktivieren {#reactivate}

1. Öffne den gesperrten Mandanten.
2. Wähle **Mandant reaktivieren**.

Mitglieder und Schlüssel funktionieren sofort wieder.

> [!WARNING]
> Nur Plattform-Administratoren (und Personen mit Plattform-Leserecht, nur lesend) können die Seite
> eines gesperrten Mandanten öffnen. Ein Product owner oder Product admin, der kein
> Plattform-Administrator ist, erhält dort **Nicht erlaubt** und kommt in Studio nicht an **Mandant
> reaktivieren** heran. Bitte einen Plattform-Administrator darum oder reaktiviere über die API mit
> `tenants:update`:
>
> ```http
> PATCH /v1/products/prd_01EXAMPLE/tenants/ten_01EXAMPLE
> Content-Type: application/json
>
> {"status": "active"}
> ```

## Einen Mandanten löschen {#delete}

> [!CAUTION]
> Das Löschen eines Mandanten lässt sich nicht rückgängig machen. Der Mandant wird zusammen mit seinen
> Datensätzen, Dateien, Mitgliedschaften, Einladungen, mandantengebundenen API-Schlüsseln, Nutzungs-,
> Abonnement-, Benachrichtigungs- und Suchdaten entfernt. Wenn du unsicher bist,
> [sperre](#suspend) den Mandanten stattdessen.

1. Öffne den Mandanten.
2. Wähle **Mandant löschen**.
3. Tippe zur Bestätigung den **Kurznamen** des Mandanten ein (nicht seinen Namen) und wähle dann
   **Mandant löschen**.

Studio kehrt zur Mandantenliste zurück. Das Audit-Protokoll behält den Eintrag über das Löschen.
Gespeicherte Dateiinhalte entfernt die regelmäßige Speicherwartung des Servers aus dem
Speicher-Backend.

## Die Daten eines Mandanten durchsuchen {#records}

**Datensätze ansehen** auf der Mandantenseite öffnet [Datensätze](app:records), gefiltert auf diesen
Mandanten. Der Button erscheint, wenn das Datensatzmodul aktiviert ist und du im Mandanten
`records:read` hast. Siehe [Datensätze](help:records).

## Gut zu wissen {#good-to-know}

- Ein Benutzer kann Mitglied mehrerer Mandanten sein, im selben oder in verschiedenen Produkten, mit
  jeweils einer anderen Rolle.
- Produktverantwortliche brauchen keine Mitgliedschaft, denn ihre Produktrolle deckt bereits jeden
  Mandanten ab.
- Auswahllisten auf anderen Seiten (zum Beispiel **Mandantenbindung** bei API-Schlüsseln oder die
  Seite **Einladungen**) listen die ersten 200 Mandanten nach Namen.

## Fehlerbehebung {#troubleshooting}

**Konflikt: „a tenant with this slug exists in the product“.** Wähle einen anderen Kurznamen.
Kurznamen gelöschter Mandanten können wiederverwendet werden.

**Bitte prüfe deine Eingaben: „slug must be 2-63 lowercase letters, digits or dashes“.** Entferne
Großbuchstaben, Leerzeichen und Sonderzeichen aus dem Kurznamen.

**Nicht erlaubt beim Öffnen eines Mandanten.** Der Mandant ist gesperrt (siehe
[Reaktivieren](#reactivate)), das Produkt ist archiviert, oder dir fehlt darin `tenant:read`.

**Nicht gefunden beim Öffnen eines Mandanten.** Der Mandant wurde gelöscht, oder du hast überhaupt
keine Beziehung zu ihm (Axentra antwortet in beiden Fällen gleich, damit sich Mandanten-IDs nicht
ausprobieren lassen).

**Zwischenzeitlich geändert.** Jemand anderes hat den Mandanten geändert, während du ihn bearbeitet
hast. Lade die Seite neu und wiederhole deine Änderung.

**Der Löschen-Button bleibt deaktiviert.** Tippe den Kurznamen genau so ein, wie er im Dialog
angezeigt wird, zum Beispiel `acme`, nicht den Anzeigenamen.

**Kein Button Neuer Mandant.** Dir fehlt `tenants:create`. Wende dich an einen Product owner oder
Product admin.
