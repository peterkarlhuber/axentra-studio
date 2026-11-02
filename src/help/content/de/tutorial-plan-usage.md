---
title: Tarife und Nutzung von Anfang bis Ende
summary: Einen Zähler und einen Tarif mit Nutzungslimit definieren, einen Mandanten anmelden, Nutzung über die API erfassen und das Kontingent in Studio beobachten.
keywords: Tutorial, Anleitung, Schritt für Schritt, Beispiel, Nutzungsmessung, Metering, Kontingent, Tariflimit, Leistung, Tarifleistung, Abonnement, API-Schlüssel, Nutzung erfassen, 429, Kontingent überschritten, quota exceeded
---

In diesem Tutorial begrenzt du die API-Aufrufe eines Kunden über seinen Tarif. Du legst einen
Zähler `api_calls` an, einen kostenlosen Tarif **Starter**, der 1.000 Aufrufe pro Monat erlaubt und
eine Exportfunktion einschaltet, meldest den Mandanten `acme` dafür an, erfasst Nutzung mit einem
API-Schlüssel und siehst in Studio zu, wie sich das Kontingent füllt. Am Ende löst du absichtlich
eine abgelehnte Anfrage aus. Das dauert etwa 15 Minuten.

> [!IMPORTANT]
> Du brauchst: die Module `usage` und `billing` auf dem Server; eine Produktrolle mit
> `usage:manage`, `billing:manage` und dem Recht, API-Schlüssel anzulegen (zum Beispiel
> **Product owner** oder **Product admin**); einen Mandanten zum Arbeiten (hier `acme`, siehe
> [Mandanten](help:tenants)); und ein Terminal mit `curl`. Alle IDs, Schlüssel und Adressen unten
> sind Beispiele: Verwende deine eigenen.

## Schritt 1: Den Zähler anlegen {#step-meter}

1. Öffne [Nutzung](app:usage), Tab **Zähler**, und wähle **Neuer Zähler**.
2. Gib ein:

   | Feld                 | Wert                    |
   | -------------------- | ----------------------- |
   | **Schlüssel**        | `api_calls`             |
   | **Name**             | API-Aufrufe             |
   | **Einheit**          | Aufrufe                 |
   | **Aggregation**      | **Summe**               |
   | **Rücksetzzeitraum** | **Abrechnungszeitraum** |
   | **Standardlimit**    | `100`                   |
   | **Durchsetzung**     | **Hartes Limit**        |

3. Wähle **Zähler anlegen**.

Das Standardlimit von 100 gilt für Mandanten ohne Tariflimit, zum Beispiel Mandanten ohne
Abonnement. **Abrechnungszeitraum** lässt den Zähler dem Abonnementzyklus jedes Mandanten folgen.
Details: [Nutzung und Kontingente](help:usage#create-meter).

## Schritt 2: Einen Tarif mit Leistungen anlegen {#step-plan}

1. Öffne [Tarife](app:plans) und wähle **Neuer Tarif**.
2. **Name**: Starter, **Schlüssel**: `starter`, **Testtage**: `0`, **Aktiv** eingeschaltet.
3. Lass **Preise** leer. Der Tarif ist kostenlos, daher beginnt das Abonnement bei jedem
   Zahlungsanbieter sofort.
4. Wähle unter **Leistungen** zweimal **Leistung hinzufügen**:
   - **Art** **Limit**, **Schlüssel des Zählers** `api_calls`, **Limit** `1000`;
   - **Art** **Funktion**, **Name der Funktion** `export`, **Eingeschaltet** an.
5. Wähle **Tarif anlegen**.

Der Tarif enthält jetzt `limit.api_calls: 1000` und `feature.export: true`. Details:
[Leistungen](help:plans-subscriptions#entitlements).

> [!NOTE]
> Ein kostenpflichtiger Tarif funktioniert genauso, aber die Anmeldung erfordert einen Checkout
> beim Zahlungsanbieter (außer der Server verwendet den manuellen Anbieter). Siehe
> [Einen Mandanten anmelden](help:plans-subscriptions#subscribe).

## Schritt 3: Den Mandanten anmelden {#step-subscribe}

1. Öffne [Abonnements](app:subscriptions). Wähle unter **Abrechnung eines Mandanten** `acme` und
   dann **Öffnen**.
2. Wähle unter **Abonnement** die Option **Tarif abonnieren**, dann **Starter (starter)**, und wähle
   **Abonnieren**.
3. Das Abonnement zeigt **Aktiv**. **Wirksame Leistungen** listet `export: on` unter
   **Funktionen** und `api_calls` 1.000 unter **Limits**.

## Schritt 4: Einen API-Schlüssel zum Erfassen der Nutzung anlegen {#step-api-key}

1. Öffne [API-Schlüssel](app:apiKeys) und wähle **Neuer API-Schlüssel**.
2. **Name**: `usage-demo`. Wähle unter **Mandantenbindung** `acme`, damit der Schlüssel nur diesen
   Mandanten berühren kann.
3. Wähle unter **Berechtigungen** `usage:record` und `usage:read`.
4. Lege den Schlüssel an und kopiere das Geheimnis. Es wird nur einmal angezeigt.

Speichere die benötigten Werte in deinem Terminal (Beispielwerte):

```bash
export AX=https://axentra.example.com
export PID=prd_01EXAMPLE
export TID=ten_01EXAMPLE
export KEY=axk_EXAMPLE_secret
```

Die Produkt-ID steht auf der Seite des Produkts, die Mandanten-ID auf der Seite des Mandanten und
auf seiner Abrechnungsseite. Siehe [API-Schlüssel](help:api-keys) und
[API-Grundlagen](help:api-basics).

## Schritt 5: Nutzung erfassen {#step-record}

Erfasse einen API-Aufruf. Jedes eigenständige Ereignis braucht einen eigenen `Idempotency-Key`; dein
Produkt würde seine Anfrage-ID verwenden.

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0001" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 1, "properties": {"endpoint": "/reports"}}'
```

Die Antwort (`201 Created`, gekürzt) enthält das Ereignis und das Kontingent danach:

```json
{
  "event": {
    "id": "uev_01EXAMPLE",
    "meter": "api_calls",
    "quantity": 1,
    "idempotency_key": "demo-0001"
  },
  "replayed": false,
  "quota": {
    "meter": "api_calls",
    "used": 1,
    "reserved": 0,
    "limit": 1000,
    "remaining": 999,
    "enforcement": "hard",
    "source": "plan",
    "over_limit": false
  }
}
```

Führe denselben Befehl noch einmal aus: Die Antwort ist `200` mit `"replayed": true`, und die
Nutzung zählt weiterhin nur einmal. Genau das macht Wiederholungen nach einem Netzwerkfehler sicher.

Erfasse jetzt einen größeren Block mit einem neuen Schlüssel:

```bash
curl -sS -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0002" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 950}'
```

`remaining` ist jetzt 49.

## Schritt 6: Das Kontingent in Studio beobachten {#step-watch}

1. Öffne [Nutzung](app:usage), Tab **Nutzung pro Mandant**, und wähle `acme` (oder wähle
   **Nutzung** in der Kopfzeile der Abrechnungsseite des Mandanten).
2. Die Karte `api_calls` zeigt 951 Aufrufe, einen Balken bei 95 %, die Kennzeichen **Aus dem
   Tarif** und **Hartes Limit** und **Verbleibend** 49 Aufrufe.
3. **Nutzungsereignisse** listet beide Ereignisse mit ihren Idempotenzschlüsseln und der
   Eigenschaft `endpoint`.
4. **Tägliche Nutzung** zeigt den Balken für heute, und der Tab **Übersicht** zeigt `acme` unter
   **Summen pro Mandant**.

## Schritt 7: Das Limit überschreiten {#step-exceed}

Versuche, 50 weitere Aufrufe zu erfassen (951 + 50 > 1.000):

```bash
curl -sS -i -X POST "$AX/v1/products/$PID/tenants/$TID/usage/events" \
  -H "Authorization: Bearer $KEY" \
  -H "Idempotency-Key: demo-0003" \
  -H "Content-Type: application/json" \
  -d '{"meter": "api_calls", "quantity": 50}'
```

Der Server antwortet mit `429`, einem Header `Retry-After` und einem Problem-Body wie diesem
(gekürzt):

```json
{
  "code": "quota_exceeded",
  "status": 429,
  "detail": "the api_calls limit of this period would be exceeded",
  "meter": "api_calls",
  "limit": 1000,
  "used": 951,
  "reserved": 0,
  "requested": 50,
  "period_end": "2026-12-02T00:00:00+00:00"
}
```

Es wurde nichts erfasst. Dein Produkt würde jetzt die Anfrage des Kunden ablehnen oder ein Upgrade
anbieten.

## Schritt 8: Dem Mandanten mehr Spielraum geben {#step-override}

Angenommen, du gestehst `acme` für diesen Zeitraum 2.000 Aufrufe zu:

1. Wähle unter **Nutzung pro Mandant** auf der Karte `api_calls` **Überschreibung festlegen**.
2. Gib als **Limit** `2000` ein, behalte **Hartes Limit** bei und wähle **Überschreibung
   speichern**.
3. Das Kennzeichen wechselt zu **Mandanten-Überschreibung**. Wiederhole die Anfrage aus Schritt 7:
   Die Anfrage wird mit `"source": "quota"` angenommen.

Wähle **Überschreibung entfernen**, um zum Tariflimit zurückzukehren. Um das Limit für jeden
Mandanten mit diesem Tarif zu ändern, bearbeite stattdessen die Leistung des Tarifs. Details:
[Woher das wirksame Limit kommt](help:usage#limit-source).

## Was dein Produkt damit macht {#in-your-product}

- Erfasse vor einer Aktion, die eine gemessene Ressource kostet, die Nutzung. Behandle
  `429 quota_exceeded` als „Limit erreicht“ und zeig dem Kunden eine klare Meldung.
- Lies die Funktionen des Mandanten mit
  `GET /v1/products/{product_id}/tenants/{tenant_id}/billing/entitlements` und schalte den Export
  nur ein, wenn `features.export` den Wert `true` hat.
- Bei lang laufender Arbeit reservierst du zuerst und verbuchst später; siehe
  [Reservierungen](help:usage#reservations).

## Aufräumen {#clean-up}

- Widerrufe den Schlüssel `usage-demo` unter [API-Schlüssel](app:apiKeys).
- Kündige das Abonnement auf der Abrechnungsseite des Mandanten mit **Sofort kündigen**, wenn du es
  nicht brauchst.
- Der Zähler lässt sich nicht löschen, weil er Nutzung hat. **Deaktiviere** ihn, wenn du ihn nicht
  möchtest.
- Der Tarif lässt sich nicht löschen, weil ein Abonnement ihn verwendet hat. **Deaktiviere** ihn.

## Fehlerbehebung {#troubleshooting}

| Was du siehst                                          | Warum                                                                               | Was du tun kannst                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `401`                                                  | Der Schlüssel ist falsch, widerrufen oder abgelaufen                                | Prüfe `$KEY`; lege einen neuen Schlüssel an                                 |
| `403`                                                  | Dem Schlüssel fehlt `usage:record`, oder er ist an einen anderen Mandanten gebunden | Prüfe die Berechtigungen und die **Mandantenbindung** des Schlüssels        |
| `404`                                                  | Falsche Produkt- oder Mandanten-ID, oder der Zählerschlüssel existiert nicht        | Vergleiche die IDs mit Studio; prüfe den Zählerschlüssel                    |
| `409` „the meter is inactive“                          | Der Zähler wurde deaktiviert                                                        | **Aktiviere** ihn unter **Zähler**                                          |
| `409` für den Idempotenzschlüssel                      | Der Schlüssel wurde schon mit einem anderen Body verwendet                          | Verwende einen neuen `Idempotency-Key`                                      |
| `422`                                                  | `Idempotency-Key` fehlt, oder die Menge ist ungültig                                | Sende den Header; verwende eine Menge ab 0 mit höchstens 6 Nachkommastellen |
| Die Karte zeigt **Standard des Zählers** und Limit 100 | Das Abonnement ist nicht aktiv, oder der Tarif hat kein `limit.api_calls`           | Prüfe Schritt 2 und Schritt 3                                               |
| `429` früher als erwartet                              | Reservierungen oder andere Ereignisse zählen ebenfalls                              | Sieh dir **Reserviert** und **Nutzungsereignisse** an                       |
