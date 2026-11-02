---
title: API-Schlüssel
summary: Erstelle API-Schlüssel für Dienste, die Axentra aufrufen, sende sie korrekt mit, rotiere sie ohne Ausfallzeit und widerrufe sie, einschließlich davon abgeleiteter Schlüssel.
keywords: API-Schlüssel, Schlüssel, API key, Token, Geheimnis, Secret, Zugangsdaten, Maschinenzugriff, Dienstkonto, Integration, rotieren, Rotation, erneuern, Übergangsfrist, widerrufen, Ablauf, axk, Bearer, X-API-Key
---

Ein **API-Schlüssel** erlaubt einer Maschine, etwa dem Backend deines Produkts, einem Worker oder
einem Importskript, die Axentra-API aufzurufen, ohne dass sich eine Person anmeldet. Jeder Schlüssel
gehört zu genau einem Produkt, hat eine ausdrückliche Liste von Berechtigungen und kann an einen
Mandanten gebunden werden. Ein Schlüssel hat nie Plattformberechtigungen.

Das Geheimnis des Schlüssels wird **einmal** angezeigt, wenn der Schlüssel erstellt oder rotiert
wird. Axentra speichert nur einen Hash davon, sodass niemand, nicht einmal ein Administrator, es
erneut anzeigen kann.

> [!IMPORTANT]
> Die Seite **API-Schlüssel** erfordert das Zugriffsmodul und `api_keys:read`. Schlüssel erstellen,
> rotieren und widerrufen erfordert `api_keys:manage` (Product owner und Product admin). Du kannst
> einem Schlüssel nur Berechtigungen geben, die du selbst auf Produktebene hast.

## Einen API-Schlüssel erstellen {#create}

1. Öffne [API-Schlüssel](app:apiKeys) und wähle **Neuer API-Schlüssel**.
2. Gib einen **Namen** ein, der sagt, wo der Schlüssel verwendet wird, zum Beispiel
   `billing-worker production`.
3. Wähle optional eine **Mandantenbindung** (siehe [mandantengebundene Schlüssel](#tenant-scope)).
   Belasse **Gesamtes Produkt** für einen Schlüssel, der in jedem Mandanten funktioniert.
4. Wähle optional einen **Ablauf**: **Nie** (Standard), **In 30 Tagen**, **In 90 Tagen**, **In 365
   Tagen** oder **An einem Datum…** und dann ein **Ablaufdatum** (siehe [Ablauf](#expiry)).
5. Wähle die **Berechtigungen** aus, die der Dienst braucht, und keine weiteren. Die Checkliste
   funktioniert wie unter [Rollen und Berechtigungen](help:roles-permissions#checklist) beschrieben.
6. Wähle **Schlüssel anlegen**.
7. Kopiere das Geheimnis aus **Geheimnis des API-Schlüssels** in deinen Secret-Manager.
8. Hake **Ich habe das Geheimnis sicher gespeichert** an und wähle **Fertig**.

> [!CAUTION]
> Der Geheimnisdialog lässt sich nicht mit Escape oder durch Klicken außerhalb schließen, und das
> Geheimnis kann nicht erneut angezeigt werden. Geht es verloren, [rotiere den Schlüssel](#rotate),
> um ein neues Geheimnis zu erhalten.

| Feld                 | Was es bewirkt                                           | Erlaubte Werte / Standard                                                                                                   |
| -------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Name**             | Bezeichnung in der Liste und im Audit-Protokoll.         | 1–200 Zeichen. Nicht eindeutig.                                                                                             |
| **Mandantenbindung** | Bindet den Schlüssel an einen Mandanten.                 | **Gesamtes Produkt** (Standard) oder ein Mandant. Wird angezeigt, wenn das Mandantenmodul aktiviert ist.                    |
| **Berechtigungen**   | Was der Schlüssel tun darf.                              | 1–100 Berechtigungen mit dem Geltungsbereich Produkt oder Mandant, einschließlich aktiver vom Produkt festgelegter.         |
| **Ablauf**           | Zeitpunkt, ab dem der Schlüssel nicht mehr funktioniert. | **Nie** (Standard), 30, 90 oder 365 Tage nach dem Anlegen oder das Ende eines gewählten Tages (nach heute, deine Zeitzone). |

### Ablauf {#expiry}

Ein Schlüssel mit Ablauf funktioniert ab diesem Zeitpunkt nicht mehr: Er wird wie ein widerrufener
Schlüssel abgelehnt und als **Abgelaufen** angezeigt. Wähle einen Ablauf für Schlüssel, die nur eine
Zeit lang gebraucht werden, zum Beispiel für eine Migration oder den Test eines Partners; dauerhaft
laufende Dienste nutzen meist Schlüssel ohne Ablauf und [erneuern](#rotate) ihr Geheimnis
regelmäßig.

Der Ablauf lässt sich nach dem Anlegen nicht ändern, und das Erneuern behält ihn bei: Lege vor dem
Ablauf einen neuen Schlüssel an und stelle den Dienst um. Schlüssel, die ein Dienst mit einem
anderen Schlüssel anlegt, überleben den anlegenden Schlüssel nie (siehe [abgeleitete
Schlüssel](#derived-keys)); in Studio angelegte Schlüssel gehören zu deinem Konto, deshalb gilt
diese Regel für sie nicht.

### Mandantengebundene Schlüssel {#tenant-scope}

Ein Schlüssel mit **Mandantenbindung** funktioniert nur innerhalb dieses Mandanten: Dort kann er seine
Mandantenberechtigungen nutzen, seine Produktberechtigungen haben überhaupt keine Wirkung. Jeder andere
Mandant antwortet mit **Nicht gefunden**. Wird der Mandant gelöscht, wird der Schlüssel mitgelöscht;
solange der Mandant gesperrt ist, wird der Schlüssel abgelehnt.

## Den Schlüssel mit einer Anfrage senden {#use}

Ein Schlüssel sieht so aus: `axk_<26 characters>_<secret>`. Die Liste zeigt nur den ersten Teil (das
**Präfix**, zum Beispiel `axk_01jdk7x3m9q2w8v5r4t6y0z1ab_`), das den Schlüssel identifiziert, mit dem
sich die API aber nicht aufrufen lässt. Sende den vollständigen Schlüssel in einem dieser Header:

```http
GET /v1/products/prd_01EXAMPLE/tenants HTTP/1.1
Host: api.example.com
Authorization: Bearer axk_01jdk7x3m9q2w8v5r4t6y0z1ab_EXAMPLEsecretEXAMPLEsecretEXAMPLEsec
```

```bash
curl -H "X-API-Key: $AXENTRA_API_KEY" https://api.example.com/v1/products/prd_01EXAMPLE/tenants
```

Anfragen mit einem Schlüssel brauchen weder CSRF-Token noch Cookie. Halte den Schlüssel aus Browsern
und Quellcode heraus; lade ihn aus einer Umgebungsvariablen oder einem Secret-Manager. Siehe
[API-Grundlagen](help:api-basics).

## Die Schlüsselliste lesen {#list}

| Spalte                     | Bedeutung                                                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**                   | Der Name und das Präfix des Schlüssels.                                                                                                              |
| **Status**                 | **Aktiv**, **Abgelaufen** (Ablaufzeitpunkt überschritten) oder **Widerrufen** (widerrufen oder nach Ende der Übergangsfrist durch Rotation ersetzt). |
| **Geltungsbereich**        | **Gesamtes Produkt** oder **Mandant** mit der Mandanten-ID.                                                                                          |
| **Berechtigungen**         | Anzahl der Berechtigungen.                                                                                                                           |
| **Zuletzt verwendet**      | Letzte erfolgreiche Anfrage; höchstens einmal pro Minute aktualisiert.                                                                               |
| **Läuft ab**, **Erstellt** | Zeitstempel.                                                                                                                                         |

Aktive Schlüssel stehen oben, die neuesten zuerst. Abgelaufene und widerrufene Schlüssel bleiben zur
Nachverfolgung in der Liste.

## Einen Schlüssel rotieren {#rotate}

Beim Rotieren wird ein Schlüssel durch einen neuen ersetzt, zum Beispiel turnusmäßig oder nachdem ein
Geheimnis offengelegt wurde.

1. Öffne in der Zeile des Schlüssels das Aktionsmenü (**…**) und wähle **Geheimnis erneuern**.
2. Wähle eine **Übergangsfrist für das alte Geheimnis**.
3. Wähle **Geheimnis erneuern** und speichere das neue Geheimnis wie beim Erstellen eines Schlüssels.

Der Ersatz ist ein **neuer Schlüssel** mit neuer ID und neuem Präfix sowie demselben Namen, denselben
Berechtigungen, derselben Mandantenbindung und demselben Ablauf. Stillgelegte Produktberechtigungen
werden weggelassen. Der alte Schlüssel wird widerrufen, wenn die Übergangsfrist endet.

```diagram
key-rotation
```

### Übergangsfrist {#grace-period}

| Option                                      | Wirkung                                                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Keine – das alte Geheimnis endet sofort** | Der alte Schlüssel wird sofort widerrufen. Dienste, die ihn noch verwenden, schlagen fehl, bis sie das neue Geheimnis erhalten.    |
| **1 Stunde**, **24 Stunden**, **7 Tage**    | Alter und neuer Schlüssel funktionieren beide bis zum Ende der Frist. Beide stehen als **Aktiv** mit demselben Namen in der Liste. |

> [!TIP]
> Rotation ohne Ausfallzeit: Rotiere mit **24 Stunden**, verteile das neue Geheimnis an alle Dienste,
> prüfe, dass sich **Zuletzt verwendet** beim neuen Schlüssel bewegt und beim alten stehen bleibt, und
> widerrufe dann den alten Schlüssel, um die Übergangsfrist vorzeitig zu beenden.

Schlüssel, die ein Dienst _mit_ dem alten Schlüssel erstellt hat, werden durch die Rotation nicht
widerrufen und funktionieren weiter.

## Einen Schlüssel widerrufen {#revoke}

1. Öffne das Aktionsmenü des Schlüssels (**…**) und wähle **Schlüssel widerrufen**.
2. Tippe zur Bestätigung den Namen des Schlüssels ein und wähle **Schlüssel widerrufen**.

Der Schlüssel funktioniert sofort und dauerhaft nicht mehr. Wird ein Schlüssel in seiner
Übergangsfrist widerrufen, endet die Übergangsfrist sofort.

> [!CAUTION]
> Beim Widerrufen werden auch alle Schlüssel widerrufen, die **mit diesem Schlüssel erstellt** wurden,
> und die mit jenen erstellten, alle auf einmal. Die Bestätigung listet sie nicht auf; die
> widerrufenen abgeleiteten Schlüssel findest du im Eintrag des Widerrufs im
> [Audit-Protokoll](help:audit).

## Abgeleitete Schlüssel und Ablauf {#derived-keys}

Ein Dienst, dessen Schlüssel `api_keys:manage` hat, kann über die API weitere Schlüssel erstellen.
Solche **abgeleiteten Schlüssel**:

- haben höchstens die Berechtigungen des Schlüssels, der sie erstellt;
- überdauern ihn nie: Ohne eigenen Ablauf erben sie den Ablauf des erstellenden Schlüssels, und ein
  späterer Ablauf wird abgelehnt;
- werden zusammen mit ihm widerrufen (siehe [Widerrufen](#revoke)), aber nicht beim Rotieren.

In Studio erstellte Schlüssel werden von deinem Benutzerkonto erstellt, nicht von einem Schlüssel,
daher gelten diese Regeln für sie nicht. Schlüssel gehören zum Produkt, nicht zu der Person, die sie
erstellt hat: sie funktionieren weiter, wenn diese Person ausscheidet oder deaktiviert wird.

## Gut zu wissen {#good-to-know}

- Ein archiviertes Produkt oder ein gesperrter Mandant lässt alle zugehörigen Schlüssel mit **Nicht
  erlaubt** fehlschlagen, bis es wiederhergestellt bzw. er reaktiviert ist.
- Wird eine Berechtigung aus einem Produkt entfernt (stillgelegt), verliert sie stillschweigend bei
  jedem Schlüssel ihre Wirkung.
- Gib jedem Dienst einen eigenen Schlüssel, damit du einen rotieren oder widerrufen kannst, ohne
  andere zu beeinträchtigen.

## Fehlerbehebung {#troubleshooting}

**Nicht erlaubt: „you cannot grant permissions you do not hold: …“.** Du hast eine Berechtigung
ausgewählt, die du selbst nicht hast. Entferne sie oder bitte einen Product owner, den Schlüssel zu
erstellen. Dasselbe gilt für die Rotation: Wer rotiert, muss alle Berechtigungen des Schlüssels haben.

**Bitte prüfe deine Eingaben: „an API key needs at least one permission“ / „unknown permissions“.**
Wähle mindestens eine Berechtigung aus; möglicherweise wurde eine Produktberechtigung zwischenzeitlich
stillgelegt.

**Bitte prüfe deine Eingaben: „only active keys can be rotated“.** Der Schlüssel ist abgelaufen oder
widerrufen. Erstelle stattdessen einen neuen Schlüssel.

**Bitte prüfe deine Eingaben: „expires_at must not be later than the expiry of the creating key“.**
Nur über die API: Ein abgeleiteter Schlüssel kann seinen übergeordneten Schlüssel nicht überdauern.

**Bitte melde dich an (401), wenn der Dienst die API aufruft.** Der Schlüssel ist falsch,
unvollständig, widerrufen oder abgelaufen. Prüfe, ob der vollständige Schlüssel (nicht nur das Präfix)
gesendet wird und der Status **Aktiv** ist.

**Nicht erlaubt (403) bei einem gültigen Schlüssel.** Dem Schlüssel fehlt die Berechtigung für diese
Anfrage, das Produkt ist archiviert, oder der Mandant ist gesperrt.

**Nicht gefunden (404) bei einem gültigen Schlüssel.** Der Schlüssel gehört zu einem anderen Produkt,
oder er ist an einen anderen Mandanten gebunden.
