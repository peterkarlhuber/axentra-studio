---
title: Produkte
summary: Lege Produkte an, konfiguriere, archiviere und stelle sie wieder her, verwalte Produktverantwortliche und verstehe den Einzelproduktbetrieb.
keywords: Produkt, Anwendung, App, Projekt, Produktverantwortliche, Betreiber, Produktmitglieder, archivieren, wiederherstellen, Produkteinstellungen, Einzelproduktbetrieb, Mehrproduktbetrieb, Kurzname, Slug
---

Ein **Produkt** ist eine Anwendung, die auf deinem Axentra-Server läuft, zum Beispiel ein CRM oder
ein Buchungsdienst. Jedes Produkt hat eigene Mandanten, Benutzer, Rollen, API-Schlüssel und Daten,
und zwischen Produkten wird nichts geteilt. Personen, die ein Produkt betreiben (statt es als Kunde zu
nutzen), sind seine **Produktverantwortlichen**: sie haben eine Produktrolle wie **Product owner** und
stehen auf dem Tab **Mitglieder** des Produkts.

Öffne die Produktliste über [Produkte](app:products) in der Seitenleiste. **Dashboard öffnen** bringt
dich in ein Produkt; jede andere Seite der Seitenleiste arbeitet dann innerhalb dieses Produkts.

> [!IMPORTANT]
> Alle, die zu einem Produkt gehören, sehen es in der Liste. Plattform-Administratoren und Personen
> mit Plattform-Leserecht sehen jedes Produkt, auch archivierte. Produkte anzulegen, zu archivieren
> und wiederherzustellen erfordert die Plattformberechtigungen `products:create` und
> `products:archive` (Plattform-Administratoren) und ist nur im Mehrproduktbetrieb möglich. Siehe
> [Einzelproduktbetrieb](#single-product-mode).

## Ein Produkt anlegen {#create}

1. Öffne [Produkte](app:products) und wähle **Neues Produkt**.
2. Gib einen **Namen** ein.
3. Prüfe den **Kurznamen**. Studio leitet ihn aus dem Namen ab; du kannst ihn ändern, bevor du das
   Produkt anlegst.
4. Gib optional eine **Beschreibung** ein.
5. Wähle **Produkt anlegen**.

Studio öffnet die Seite des neuen Produkts. Du wirst sein **Product owner** und kannst deshalb sofort
auf dem Tab **Mitglieder** weitere Produktverantwortliche hinzufügen.

> [!NOTE]
> Der Kurzname lässt sich später nicht ändern. Wähle einen, den du gern in URLs, Logs und
> Konfigurationsdateien siehst.

### Produktfelder {#fields}

| Feld             | Was es bewirkt                                                         | Erlaubte Werte / Standard                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**         | Anzeigename in Studio und in E-Mails, zum Beispiel Einladungs-E-Mails. | 1–200 Zeichen. Später änderbar.                                                                                                             |
| **Kurzname**     | Stabile, URL-taugliche Kennung.                                        | 2–63 Kleinbuchstaben, Ziffern und Bindestriche, beginnend mit einem Buchstaben oder einer Ziffer; eindeutig auf dem Server. Nicht änderbar. |
| **Beschreibung** | Freitext, der in der Produktliste angezeigt wird.                      | Bis zu 2.000 Zeichen. Optional.                                                                                                             |
| **ID**           | Erzeugte Kennung (`prd_…`), die die API verwendet.                     | Vom Server vergeben.                                                                                                                        |
| **Status**       | **Aktiv** oder **Archiviert**.                                         | Siehe [Ein Produkt archivieren](#archive).                                                                                                  |

## Produkteinstellungen ändern {#settings}

Der Tab **Einstellungen** eines Produkts enthält Name, Beschreibung und **Einstellungen (JSON)**: ein
JSON-Objekt mit produktspezifischer Konfiguration. Der Code deines Produkts kann es lesen, und einige
Axentra-Module verwenden Schlüssel darin.

1. Öffne das Produkt unter [Produkte](app:products) und wähle den Tab **Einstellungen**.
2. Ändere **Name**, **Beschreibung** oder **Einstellungen (JSON)**.
3. Wähle **Änderungen speichern**.

Änderungen gelten sofort für alle Mandanten des Produkts.

| Schlüssel in Einstellungen (JSON) | Verwendet von      | Was er bewirkt                                                                                                                                                                                                  |
| --------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invitation_accept_url`           | Benachrichtigungen | Link in Einladungs-E-Mails. `{token}` wird durch das Einladungs-Token ersetzt; fehlt es, wird `?token=…` angehängt. Muss mit `http://` oder `https://` beginnen. Siehe [Einladungen](help:members-invitations). |
| `default_locale`                  | Benachrichtigungen | Ersatzsprache für Benachrichtigungsvorlagen, zum Beispiel `"en"`.                                                                                                                                               |
| `storage`                         | Dateien            | Speicherkontingente und die Richtlinie für Upload-Inhaltstypen. Bearbeite die Richtlinie stattdessen auf dem Tab **Dateien**. Siehe [Dateien](help:files).                                                      |

```json
{
  "invitation_accept_url": "https://studio.example.com/invitations/accept?token={token}",
  "default_locale": "en"
}
```

> [!WARNING]
> **Änderungen speichern** ersetzt das gesamte Einstellungsobjekt. Löschst du einen Schlüssel aus dem
> Text, wird er aus dem Produkt entfernt. Das Objekt darf bis zu etwa 32.000 Zeichen lang sein.

> [!IMPORTANT]
> Einstellungen zu ändern erfordert `product:manage` (Product owner und Product admin). Ohne diese
> Berechtigung zeigt der Tab **Du kannst diese Einstellungen ansehen, aber nicht ändern.** Ein
> archiviertes Produkt lässt sich in Studio nicht bearbeiten; stelle es zuerst wieder her.

Der Tab **Dateien** (nur bei aktiviertem Dateimodul) enthält die Speicherrichtlinie des Produkts. Diese
ist unter [Dateien](help:files) beschrieben.

## Produktverantwortliche verwalten {#members}

Der Tab **Mitglieder** listet die Produktverantwortlichen des Produkts: Benutzer mit einer
Produktrolle. Deren Mandantenberechtigungen gelten in **jedem** Mandanten des Produkts.
Mandantenmitglieder verwaltest du dagegen beim jeweiligen Mandanten, siehe
[Mitglieder und Einladungen](help:members-invitations).

| Integrierte Produktrolle              | Darf                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Product owner** (`product_owner`)   | Alles im Produkt, einschließlich der Verwaltung von Produktverantwortlichen und der Festlegung von Produktberechtigungen. |
| **Product admin** (`product_admin`)   | Verwaltet Mandanten, Rollen, API-Schlüssel und Daten; kann keine Produktverantwortlichen verwalten.                       |
| **Support** (`product_support`)       | Liest alles und verwaltet Mandantenmitglieder im Rahmen der eigenen Berechtigungen (in der Praxis: Betrachter).           |
| **Product viewer** (`product_viewer`) | Nur Lesezugriff auf das Produkt.                                                                                          |

Eigene Produktrollen erscheinen ebenfalls in der Liste. Siehe
[Rollen und Berechtigungen](help:roles-permissions).

### Produktverantwortliche hinzufügen {#add-operator}

1. Öffne den Tab **Mitglieder** und wähle **Mitglied hinzufügen**.
2. Gib die **E-Mail-Adresse** der Person ein und wähle eine **Rolle**.
3. Wähle **Mitglied hinzufügen**.

> [!IMPORTANT]
> Der Tab **Mitglieder** erfordert `product_members:read`; Produktverantwortliche hinzuzufügen, zu
> ändern und zu entfernen erfordert `product_members:manage` (Product owner und
> Plattform-Administratoren).

> [!NOTE]
> Für Produktverantwortliche gibt es keine Einladungen. Die Person muss bereits ein Konto haben, das du
> sehen kannst: Plattform-Administratoren sehen jedes Konto, Benutzer mit `product_users:read` sehen
> die Benutzer dieses Produkts (Mitglieder seiner Mandanten und seine Produktverantwortlichen). Für
> alle anderen antwortet der Server mit **Benutzer nicht gefunden**. Lade die Person zuerst in einen
> der Mandanten des Produkts ein oder bitte einen Plattform-Administrator, sie hinzuzufügen.

Um die Rolle einer oder eines Produktverantwortlichen zu ändern, wähle in der Spalte **Rolle** eine
neue. Zum Entfernen wählst du das Papierkorbsymbol in der Zeile und bestätigst. Rollen oberhalb deiner
eigenen Stufe werden angezeigt, sind aber nicht auswählbar (siehe
[Rollenobergrenze](help:members-invitations#role-ceiling)).

## Ein Produkt archivieren {#archive}

Das Archivieren nimmt ein Produkt außer Betrieb, ohne etwas zu löschen.

1. Öffne das Produkt unter [Produkte](app:products).
2. Wähle **Archivieren**.
3. Tippe zur Bestätigung den Namen des Produkts ein und wähle **Archivieren**.

Solange ein Produkt archiviert ist:

- sehen Produktverantwortliche und Mandantenmitglieder es nicht mehr in der Produktliste, und jede
  ihrer Anfragen darin wird abgelehnt;
- funktionieren alle seine API-Schlüssel nicht mehr (Anfragen schlagen mit **Nicht erlaubt** fehl);
- behalten Plattform-Administratoren vollen Zugriff und Personen mit Plattform-Leserecht Lesezugriff;
- zeigt Studio **Dieses Produkt ist archiviert: Seine Produktverantwortlichen, Mandantenmitglieder und
  API-Schlüssel haben keinen Zugriff. Stelle es wieder her, um Änderungen vorzunehmen.** und bietet
  **Dashboard öffnen** nicht an.

> [!NOTE]
> Studio kann kein Produkt löschen. Das Archivieren ist der Weg, es außer Betrieb zu nehmen.

## Ein Produkt wiederherstellen {#restore}

1. Öffne das archivierte Produkt (als Plattform-Administrator siehst du es weiterhin mit dem Status
   **Archiviert** in der Liste).
2. Wähle **Wiederherstellen** und bestätige.

Das Produkt, seine Mitglieder und seine API-Schlüssel funktionieren sofort wieder. Schlüssel, die
zwischenzeitlich abgelaufen sind, bleiben abgelaufen.

## Einzelproduktbetrieb {#single-product-mode}

Ein Axentra-Server läuft in einem von zwei Modi, die der Serverbetreiber in der Serverkonfiguration
festlegt:

|                                                          | Einzelproduktbetrieb (`single`)                                               | Mehrproduktbetrieb (`multi`)                         |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| Produkte                                                 | Genau eines, beim ersten Start aus der Konfiguration angelegt                 | Beliebig viele, angelegt in Studio oder über die API |
| **Neues Produkt**, **Archivieren**, **Wiederherstellen** | Nicht angeboten; die API lehnt sie mit **In diesem Modus nicht verfügbar** ab | Mit `products:create` / `products:archive`           |
| Produktliste                                             | Zeigt das eine Produkt und den Hinweis **Einzelproduktbetrieb**               | Alle Produkte, auf die du Zugriff hast               |

Auch im Einzelproduktbetrieb änderst du Name, Beschreibung, Einstellungen und Mitglieder des Produkts
auf seiner Seite. Um mehrere Produkte zu betreiben, setzt der Serverbetreiber `mode = "multi"` in der
Serverkonfiguration; eine Datenmigration ist nicht nötig. Siehe
[Serverkonfiguration](help:server-configuration).

## Gut zu wissen {#good-to-know}

- Benutzerkonten gelten installationsweit: Ein Konto kann in mehreren Produkten arbeiten.
- Archivierte Produkte behalten ihre Daten, Audit-Ereignisse und Schlüssel; durch das Archivieren
  läuft nichts ab.
- Produkteinstellungen sind kein Geheimnisspeicher. Lege keine Passwörter oder Token in
  **Einstellungen (JSON)** ab.

## Fehlerbehebung {#troubleshooting}

**Konflikt beim Anlegen eines Produkts.** Ein anderes Produkt verwendet den Kurznamen bereits. Wähle
einen anderen Kurznamen.

**Bitte prüfe deine Eingaben: „slug must be 2-63 lowercase letters, digits or dashes“.** Entferne
Großbuchstaben, Leerzeichen und Sonderzeichen aus dem Kurznamen.

**Das ist kein gültiges JSON. / Die Einstellungen müssen ein JSON-Objekt sein.** **Einstellungen
(JSON)** muss ein einzelnes Objekt in geschweiften Klammern sein, zum Beispiel `{"key": "value"}`.
Arrays, einfache Zeichenketten und abschließende Kommas werden abgelehnt.

**Bitte prüfe deine Eingaben: „settings are too large“** oder eine Meldung zu `storage`. Das Objekt
ist länger als etwa 32.000 Zeichen, oder der Teil `storage` ist ungültig. Kürze es oder bearbeite die
Speicherrichtlinie auf dem Tab **Dateien**.

**Zwischenzeitlich geändert.** Jemand anderes hat das Produkt gespeichert, während du es bearbeitet
hast. Lade die Seite neu und nimm deine Änderung erneut vor.

**In diesem Modus nicht verfügbar.** Der Server läuft im Einzelproduktbetrieb, in dem Produkte weder
angelegt noch archiviert oder wiederhergestellt werden können.

**Benutzer nicht gefunden beim Hinzufügen einer oder eines Produktverantwortlichen.** Die Person hat
kein Konto oder keines, das du sehen kannst. Siehe [Produktverantwortliche hinzufügen](#add-operator).

**Konflikt: „the product needs at least one owner“.** Du hast versucht, den letzten **Product owner**
zu entfernen oder herabzustufen. Mache zuerst jemand anderen zum Owner.

**Ein Produkt fehlt in der Liste.** Es ist archiviert (nur Plattform-Administratoren und Personen mit
Plattform-Leserecht sehen archivierte Produkte), oder du bist kein Mitglied. Wende dich an einen
Plattform-Administrator.
