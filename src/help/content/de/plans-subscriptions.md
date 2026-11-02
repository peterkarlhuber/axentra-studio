---
title: Tarife und Abonnements
summary: Tarife mit Preisen und Berechtigungen anlegen, Mandanten anmelden, ihre Abonnements verwalten und den Zahlungsanbieter verstehen.
keywords: Abrechnung, Billing, Tarif, Plan, Preis, Preisstufe, Abonnement, Berechtigung, Feature-Flag, Funktion, Limit, Testphase, kündigen, überfällig, Stripe, Checkout, Zahlungsanbieter, manuelle Abrechnung
---

Ein **Tarif** beschreibt, was ein Mandant bekommt: seine Preise, die Länge der Testphase und seine
**Berechtigungen** (Funktionen, die ein- oder ausgeschaltet sind, und Nutzungslimits pro Zähler).
Ein **Abonnement** verbindet einen Mandanten mit einem Tarif und hat einen Status, etwa
**Testphase**, **Aktiv** oder **Überfällig**. Dein Produkt fragt bei Axentra die wirksamen
Berechtigungen eines Mandanten ab, um zu entscheiden, was der Mandant darf; das Nutzungsmodul
übernimmt daraus seine Standardkontingente. Produktverantwortliche richten auf diesen Seiten Tarife ein
und unterstützen Kunden bei ihren Abonnements.

> [!IMPORTANT]
> Diese Seiten brauchen das Modul `billing` auf dem Server; ohne es werden **Tarife** und
> **Abonnements** nicht angezeigt. **Tarife** und **Abonnements** erfordern `billing:read` über
> eine Produktrolle; die Abrechnungsseite eines Mandanten erfordert `billing:read` in diesem
> Mandanten. Jede Änderung erfordert `billing:manage`. Siehe
> [Rollen und Berechtigungen](help:roles-permissions).

> [!CAUTION]
> Studio fragt nie nach Karten- oder Bankdaten, und Axentra speichert keine. Zahlungsdaten werden
> nur auf der gehosteten Checkout-Seite des Zahlungsanbieters eingegeben. Rechnungen, Steuern,
> Belege und Erstattungen übernehmen der Anbieter und der Betreiber, nicht Axentra.

## Einen Tarif anlegen {#create-plan}

1. Öffne [Tarife](app:plans) (Gruppe **Nutzung & Abrechnung**) und wähle **Neuer Tarif**.
2. Gib einen **Name** und einen **Schlüssel** ein, zum Beispiel `pro`. Der Schlüssel lässt sich
   später nicht ändern; dein Produkt und die API verweisen über ihn auf den Tarif.
3. Optional: **Beschreibung** und **Testtage** (0 bis 365). Neue Abonnements eines Tarifs mit
   Testtagen beginnen in **Testphase**.
4. Lass **Aktiv** eingeschaltet, damit der Tarif für neue Abonnements gewählt werden kann.
5. Wähle unter **Preise** für jeden Preis **Preis hinzufügen** (siehe
   [Preise](help:plans-subscriptions#prices)). Ohne Preise ist der Tarif kostenlos.
6. Füge unter **Berechtigungen** Funktionen und Limits hinzu (siehe
   [Berechtigungen](help:plans-subscriptions#entitlements)).
7. Wähle **Tarif anlegen**.

### Einstellungen eines Tarifs {#plan-settings}

| Einstellung        | Was sie bewirkt                                                               | Erlaubte Werte / Standard                                                                                 |
| ------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Name**           | Anzeigename                                                                   | 1 bis 200 Zeichen; Pflicht                                                                                |
| **Schlüssel**      | Kennung des Tarifs                                                            | Kleinbuchstaben, Ziffern, `_` und `-`, beginnt mit einem Buchstaben, höchstens 63 Zeichen; nicht änderbar |
| **Beschreibung**   | Freier Text                                                                   | Höchstens 2000 Zeichen                                                                                    |
| **Testtage**       | Länge der Testphase neuer Abonnements                                         | 0 bis 365; Standard 0 (keine Testphase)                                                                   |
| **Aktiv**          | Nur aktive Tarife können für neue Abonnements und Tarifwechsel gewählt werden | Standardmäßig eingeschaltet                                                                               |
| **Preise**         | Betrag, Währung, Intervall und Preis-ID beim Anbieter                         | Höchstens 20 pro Tarif                                                                                    |
| **Berechtigungen** | Funktionen und Limits                                                         | Höchstens 200 Einträge                                                                                    |

### Preise {#prices}

Jeder Preis hat einen **Betrag**, eine **Währung**, ein **Intervall** und optional eine
**Preis-ID beim Anbieter**.

- Gib den Betrag in normalen Währungseinheiten ein, zum Beispiel `19.90`. Axentra speichert ihn
  als Ganzzahl in der kleinsten Einheit (Cent); Studio zeigt den gespeicherten Wert unter dem Feld
  an („Gespeichert als 1990 kleinste Einheiten“). Währungen ohne Untereinheit (etwa JPY) nehmen
  ganze Zahlen.
- **Währung** ist ein dreistelliger ISO-4217-Code wie `EUR` oder `USD`.
- **Intervall**: **Monat** oder **Jahr**. Es legt auch die Länge des Abrechnungszeitraums des
  Abonnements fest.
- **Preis-ID beim Anbieter**: bei Stripe die ID des Preises, den du in Stripe angelegt hast
  (Buchstaben, Ziffern und `_`, zum Beispiel `price_1EXAMPLE`). Axentra ordnet Aktualisierungen
  von Stripe darüber dem Tarif zu.

Ein Tarif ohne Preise oder nur mit Nullpreisen ist **Kostenlos**. Ein Tarif kann mehrere Preise
haben (zum Beispiel monatlich und jährlich); dann wählst du beim Anmelden eines Mandanten einen
davon. Bestehende Abonnements behalten eine Kopie des Preises, mit dem sie begonnen haben; spätere
Preisänderungen betreffen sie also nicht.

### Berechtigungen {#entitlements}

Berechtigungen sind eine flache Liste von Schlüsseln. Wähle im Editor für jede Zeile die **Art**:

| Art          | Gespeichert als                                     | Wert                                     |
| ------------ | --------------------------------------------------- | ---------------------------------------- |
| **Funktion** | `feature.<name>`, zum Beispiel `feature.sso`        | **Eingeschaltet** an oder aus            |
| **Limit**    | `limit.<meter key>`, zum Beispiel `limit.api_calls` | Eine Zahl ab 0; leer bedeutet unbegrenzt |

Namen bestehen aus Kleinbuchstaben, Ziffern, `_` und `.` und beginnen mit einem Buchstaben. Ein
**Limit** legt das Kontingent des Nutzungszählers mit diesem Schlüssel pro Rücksetzzeitraum fest;
wenn das Modul `usage` lesbar ist, schlägt Studio die vorhandenen Zählerschlüssel vor. Ein Limit
für einen Schlüssel ohne Zähler hat keine Wirkung. Tariflimits verwenden die Durchsetzung des
Zählers (hart oder weich). Siehe [Nutzung und Kontingente](help:usage#limit-source).

Was eine Funktion wie `feature.sso` bedeutet, entscheidet dein Produkt: Axentra speichert sie nur
und gibt sie zurück.

## Einen Tarif bearbeiten, deaktivieren oder löschen {#edit-plan}

Im Aktionsmenü der Zeile (**Aktionen für Tarif …**):

- **Bearbeiten** ändert alles außer dem Schlüssel. Geänderte Berechtigungen gelten sofort für
  jeden Mandanten mit diesem Tarif. Geänderte Preise gelten nur für neue Abonnements.
- **Deaktivieren** blendet den Tarif für neue Abonnements und Tarifwechsel aus. Bestehende
  Abonnements laufen weiter. **Aktivieren** macht das rückgängig.
- **Tarif löschen** entfernt einen Tarif, den kein Abonnement verwendet; du bestätigst durch
  Eingabe des Tarifschlüssels. Verwendete Tarife (auch von gekündigten Abonnements) lassen sich
  nicht löschen; deaktiviere sie stattdessen.

## Übersicht der Abonnements {#subscriptions}

[Abonnements](app:subscriptions) listet die Abonnements aller Mandanten, neueste zuerst, mit
**Mandant**, **Tarif**, **Status**, **Preis**, **Zeitraum endet**, **Testphase endet** und
**Anbieter**. Filtere nach **Status** und **Tarif**. Wähle einen Mandanten, um seine
Abrechnungsseite zu öffnen.

Um einen Mandanten ohne Abonnement zu öffnen, wähle ihn unter **Abrechnung eines Mandanten** aus
und wähle **Öffnen**.

### Status eines Abonnements {#status}

| Status            | Bedeutung                               | Berechtigungen gelten |
| ----------------- | --------------------------------------- | --------------------- |
| **Unvollständig** | Wartet auf den Checkout beim Anbieter   | Nein                  |
| **Testphase**     | Testtage laufen                         | Ja                    |
| **Aktiv**         | Laufendes Abonnement                    | Ja                    |
| **Überfällig**    | Zahlung ist überfällig; eine Kulanzzeit | Ja                    |
| **Gekündigt**     | Beendet; endgültig                      | Nein                  |

Erlaubte Wechsel: Unvollständig → Testphase, Aktiv oder Gekündigt; Testphase → Aktiv, Überfällig
oder Gekündigt; Aktiv → Überfällig oder Gekündigt; Überfällig → Aktiv oder Gekündigt. Ein
gekündigtes Abonnement lässt sich nicht reaktivieren: Melde den Mandanten erneut an.

## Einen Mandanten anmelden {#subscribe}

1. Öffne die Abrechnungsseite des Mandanten (über **Abonnements** oder **Abrechnung eines
   Mandanten**).
2. Wähle unter **Abonnement** die Option **Tarif abonnieren**.
3. Wähle den Tarif unter **Tarif wählen** und den **Preis**, falls der Tarif mehrere hat.
4. Wähle **Abonnieren**.

Was dann passiert, hängt vom Tarif und vom Zahlungsanbieter ab:

- **Kostenlose Tarife** und jeder Tarif mit dem Anbieter **Manuell** starten sofort in
  **Testphase** (wenn der Tarif Testtage hat) oder **Aktiv**.
- **Kostenpflichtige Tarife mit dem Testanbieter oder Stripe** brauchen einen Checkout. Die
  Schaltfläche heißt dann **Checkout starten**. Studio legt eine Checkout-Sitzung an und zeigt
  **Checkout-Seite öffnen**, das die gehostete Seite des Anbieters in einem neuen Tab öffnet. Das
  Abonnement bleibt **Unvollständig**, bis der Anbieter die Zahlung über seinen Webhook bestätigt.
- Sind **Echtzahlungen** eingeschaltet, startet Studio keine Checkouts mit echtem Geld. Verwende
  den eigenen Checkout-Ablauf deines Produkts.

Ein Mandant hat höchstens ein aktuelles (nicht gekündigtes) Abonnement.

## Den Tarif wechseln {#change-plan}

**Tarif wechseln** stellt den Mandanten auf einen anderen aktiven Tarif um (oder auf einen anderen
Preis desselben Tarifs). Eine anteilige Verrechnung gibt es nicht: Axentra berechnet weder
Gutschriften noch Nachbelastungen. Die Berechtigungen des neuen Tarifs gelten sofort.

- Stripe-Abonnements werden in Stripe geändert (zum Beispiel im Kundenportal von Stripe); der
  Webhook aktualisiert dann Axentra. Studio blendet **Tarif wechseln** für sie aus.
- Ein ohne Zahlung angelegtes (manuelles) Abonnement kann nicht auf einen kostenpflichtigen Tarif
  umgestellt werden, solange ein echter Anbieter konfiguriert ist; kündige es und melde den
  Mandanten mit einem Checkout neu an.
- Abonnements im Status **Unvollständig** können ihren Tarif nicht wechseln; schließe den Checkout ab oder
  starte ihn neu.

## Kündigen oder fortsetzen {#cancel}

- **Zum Periodenende kündigen**: Das Abonnement bleibt bis zum Ende des aktuellen Zeitraums nutzbar
  und endet dann. **Fortsetzen** nimmt die geplante Kündigung zurück.
- **Sofort kündigen**: Das Abonnement endet sofort, und seine Berechtigungen enden. Du bestätigst
  durch Eingabe des Tarifschlüssels. Das lässt sich nicht rückgängig machen.

Bei Stripe-Abonnements gibt Axentra die Kündigung zuerst an Stripe weiter.

> [!IMPORTANT]
> Beim Anbieter **Manuell** enden Testphasen, rücken Zeiträume weiter und greift „Zum
> Periodenende kündigen“ nur, wenn der Betreiber die geplante Abrechnungsaufgabe ausführt
> (`advance_periods`, zum Beispiel stündlich). Enden Testphasen nie, bitte deinen Betreiber, sie
> einzuplanen.

## Den Status setzen (manueller Anbieter) {#set-status}

Beim Anbieter **Manuell** ziehst du die Zahlung außerhalb von Axentra ein und hältst das Ergebnis
fest. Wähle **Status setzen** und dann unter **Neuer Status** den Zielstatus: zum Beispiel **Überfällig**, wenn eine
Rechnung offen ist, oder **Aktiv**, wenn sie bezahlt ist. Nur erlaubte Übergänge werden angeboten.
Wer während einer Testphase **Aktiv** setzt, beendet die Testphase sofort. Abonnements anderer
Anbieter erhalten ihren Status über die Webhooks des Anbieters.

## Wirksame Berechtigungen und Überschreibungen {#overrides}

**Wirksame Berechtigungen** auf der Abrechnungsseite des Mandanten zeigt, was der Mandant jetzt
bekommt: den **Tarif** (mit seinem Status), **Funktionen**, **Limits** und **Überschreibungen**.
Das sind die Berechtigungen des Tarifs, solange das Abonnement im Status **Testphase**, **Aktiv**
oder **Überfällig** ist, zusammengeführt mit den Überschreibungen des Mandanten. Ohne ein solches
Abonnement bekommt der Mandant nur seine Überschreibungen (**Kein berechtigendes Abonnement**).

Um einem einzelnen Mandanten etwas anderes als seinen Tarif zu geben, wähle **Überschreibungen
bearbeiten**, füge im selben Editor wie bei Tarifen Zeilen hinzu oder ändere sie und wähle
**Überschreibungen speichern**.

> [!WARNING]
> Speichern ersetzt alle Überschreibungen des Mandanten. Eine Zeile, die du aus der Liste
> entfernst, wird beim Mandanten entfernt. Überschreibungen bleiben bestehen, wenn sich der Tarif
> ändert oder das Abonnement endet.

Um nur ein einzelnes Nutzungslimit zu erhöhen, ist eine Kontingent-Überschreibung auf der Seite
**Nutzung** oft übersichtlicher; siehe [Nutzung und Kontingente](help:usage#quota-override).
**Nutzung** in der Kopfzeile der Seite öffnet die Nutzung des Mandanten.

## Zahlungsanbieter {#payment-provider}

Die Karte **Zahlungsanbieter** unter **Tarife** und **Abonnements** zeigt die Konfiguration des
Servers:

| Anbieter                | Verhalten                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manuell**             | Die Zahlung erfolgt außerhalb von Axentra. Abonnements werden direkt angelegt; ihren Status setzt ein Betreiber.                                            |
| **Testattrappe (fake)** | Deterministischer Testanbieter ohne Netzwerkzugriff; kostenpflichtige Tarife laufen über einen simulierten Checkout. In Produktion lehnt der Server ihn ab. |
| **Stripe**              | Kostenpflichtige Tarife laufen über Stripe Checkout; Stripe-Webhooks aktualisieren die Abonnements.                                                         |

**Echtzahlungen** zeigt, ob Zahlungen mit echtem Geld eingeschaltet sind (nur Stripe).
**Checkout aus Studio** sagt, ob Studio einen gehosteten Checkout starten kann: nur beim
Testanbieter oder bei Stripe mit ausgeschalteten Echtzahlungen.

Den Anbieter wählt der Betreiber in der Serverkonfiguration (`billing.provider`); in Studio lässt
er sich nicht ändern. Die Karte erfordert `platform:settings` oder `product:manage`; sonst meldet
sie, dass die Konfiguration für dich nicht sichtbar ist. Siehe [Einstellungen](help:settings) und
[Serverkonfiguration](help:server-configuration).

## Für Entwickler {#developers}

- Lies die wirksamen Berechtigungen eines Mandanten mit
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements`
  (`billing:read`). Die Antwort enthält `features` (Name → true/false), `limits`
  (Zählerschlüssel → Zahl oder `null` für unbegrenzt), `plan_key`, `subscription_status` und
  `overrides`.
- Selbstbedienungskäufe von Mandanten laufen über das Backend deines Produkts mit einem
  API-Schlüssel, der `billing:manage` hat; eine Mandantenberechtigung für den Checkout in
  Selbstbedienung gibt es nicht.
- Rücksprungadressen des Checkouts (`success_url`, `cancel_url`) müssen mit der öffentlichen URL
  des Servers oder einem seiner erlaubten Ursprünge beginnen. Studio verwendet die eigene
  Seitenadresse.
- Änderungen an Abonnements werden auditiert (`billing.subscription.*`) und, wenn das
  Ereignismodul aktiviert ist, als gleichnamige Ereignisse veröffentlicht, sodass ein Webhook
  darauf reagieren kann. Siehe [Ereignisse](help:events).
- Stripe-Webhooks werden über ihre Signatur geprüft und pro Ereignis-ID einmal verarbeitet;
  veraltete Ereignisse werden ignoriert.

## Gut zu wissen {#good-to-know}

- Keine anteilige Verrechnung, keine Gutscheine, Steuern, Rechnungen, Platzanzahlen oder
  nutzungsbasierten Preise.
- Kein Endpunkt für ein Kundenportal; Tarifwechsel bei Stripe passieren in Stripe.
- `past_due` behält die Berechtigungen; entscheide in deinem Produkt, ob du etwas einschränkst.
- Siehe [Bekannte Einschränkungen](help:limitations).

## Fehlerbehebung {#troubleshooting}

| Was du siehst                                                                                      | Warum                                                                                        | Was du tun kannst                                                                              |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Kein Zugriff auf die Abrechnung**                                                                | Deiner Rolle fehlt `billing:read` (auf Produktebene für **Tarife** und **Abonnements**)      | Bitte einen Produktadministrator um eine passende Rolle                                        |
| **Konflikt** beim Löschen eines Tarifs                                                             | Abonnements verwenden den Tarif                                                              | **Deaktiviere** ihn stattdessen                                                                |
| **Konflikt** „ein Tarif mit diesem Schlüssel existiert“                                            | Tarifschlüssel sind pro Produkt eindeutig                                                    | Wähle einen anderen Schlüssel                                                                  |
| Ein Tarif fehlt unter **Tarif wählen**                                                             | Er ist inaktiv                                                                               | Aktiviere ihn unter **Tarife**                                                                 |
| **Konflikt** „kostenpflichtige Tarife brauchen einen Checkout …“                                   | Anmeldung für einen kostenpflichtigen Tarif beim Testanbieter oder bei Stripe                | Verwende **Checkout starten** oder bei eingeschalteten Echtzahlungen den Checkout des Produkts |
| „Dieser kostenpflichtige Tarif braucht einen Checkout, den der Server hier nicht anbietet“         | Echtzahlungen sind eingeschaltet, oder der Anbieter ist dir nicht bekannt                    | Verwende den Checkout deines Produkts                                                          |
| **Konflikt** „der Mandant hat bereits ein Abonnement“                                              | Es gibt ein aktuelles Abonnement                                                             | Verwende **Tarif wechseln** oder kündige zuerst                                                |
| **In diesem Modus nicht verfügbar** beim Tarifwechsel                                              | Das Abonnement wird von Stripe verwaltet                                                     | Ändere es in Stripe                                                                            |
| **Bitte prüfe deine Eingaben**: „Weiterleitungs-URLs müssen mit einem erlaubten Ursprung beginnen“ | Die Adresse von Studio ist weder die öffentliche URL des Servers noch ein erlaubter Ursprung | Bitte den Betreiber, den Ursprung von Studio zu `security.allowed_origins` hinzuzufügen        |
| Das Abonnement bleibt **Unvollständig**                                                            | Der Checkout wurde nicht abgeschlossen, oder der Webhook erreicht den Server nicht           | Öffne den Checkout erneut; bitte den Betreiber, Webhook-Endpunkt und Secret zu prüfen          |
| Die Testphase endet nicht (manuell)                                                                | Die Abrechnungsaufgabe ist nicht eingeplant                                                  | Bitte den Betreiber, `advance_periods` einzuplanen                                             |
| **Zwischenzeitlich geändert**                                                                      | Jemand anderes hat den Tarif oder das Abonnement geändert                                    | Lade neu und wiederhole                                                                        |
| Limits gelten nach der Kündigung nicht                                                             | Gekündigte Abonnements gewähren keine Berechtigungen                                         | Erwartet; es gilt der Standard des Zählers oder eine Kontingent-Überschreibung                 |
